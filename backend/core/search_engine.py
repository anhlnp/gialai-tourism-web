"""
Search Engine Module — Fulltext Search & Semantic Search with Vector Embeddings.
Hỗ trợ tìm kiếm toàn văn và tìm kiếm ngữ nghĩa theo embedding cho Du lịch Gia Lai.
"""
import os
import json
import math
import hashlib
from typing import List, Dict, Any, Optional

DIMENSION = 384

def compute_pseudo_embedding(text: str, dim: int = DIMENSION) -> List[float]:
    """Tạo vector embedding 384 chiều chuẩn hóa dựa trên hashing từ vựng."""
    vec = [0.0] * dim
    words = text.lower().split()
    for w in words:
        h = int(hashlib.md5(w.encode('utf-8')).hexdigest(), 16)
        idx1 = h % dim
        idx2 = (h >> 8) % dim
        vec[idx1] += 1.0
        vec[idx2] += 0.5
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [round(v / norm, 5) for v in vec]

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Tính độ tương đồng Cosine giữa hai vector."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def get_local_locations() -> List[Dict[str, Any]]:
    """Đọc dữ liệu điểm đến chuẩn hóa Gia Lai từ thư mục data/."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "..", "..", "..", "data", "locations.json")
    if os.path.exists(data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def get_local_categories() -> Dict[str, str]:
    """Lấy ánh xạ categoryId -> tên danh mục."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    cat_path = os.path.join(current_dir, "..", "..", "..", "data", "categories.json")
    if os.path.exists(cat_path):
        with open(cat_path, "r", encoding="utf-8") as f:
            cats = json.load(f)
            return {c["categoryId"]: c["name"] for c in cats}
    return {}

def get_local_districts() -> Dict[str, str]:
    """Lấy ánh xạ districtId -> tên huyện/thị/thành phố."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dist_path = os.path.join(current_dir, "..", "..", "..", "data", "districts.json")
    if os.path.exists(dist_path):
        with open(dist_path, "r", encoding="utf-8") as f:
            dists = json.load(f)
            return {d["districtId"]: d["name"] for d in dists}
    return {}

def fulltext_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Thực hiện Tìm kiếm Toàn văn (Fulltext Search).
    Thử qua Neo4j Fulltext Index, nếu không kết nối được thì dùng fallback từ vựng.
    """
    results = []
    # 1. Thử qua Neo4j
    try:
        from core.neo4j_driver import run_query
        cypher = """
        CALL db.index.fulltext.queryNodes('location_fulltext_search', $q) YIELD node, score
        MATCH (node)-[:BELONGS_TO]->(c:Category)
        MATCH (node)-[:LOCATED_IN]->(d:District)
        RETURN node.locationId AS id, node.name AS name, node.address AS address,
               node.description AS description, node.imageUrl AS imageUrl,
               node.ticketPrice AS ticketPrice, node.ratingAvg AS ratingAvg,
               node.bestTimeOfDay AS bestTime, c.name AS category, d.name AS district,
               round(score, 3) AS score, 'neo4j_fulltext' AS searchType
        ORDER BY score DESC LIMIT $limit
        """
        neo_res = run_query(cypher, {"q": query, "limit": limit})
        if neo_res:
            return neo_res
    except Exception:
        pass

    # 2. Fallback tìm kiếm từ vựng (In-memory lexical search)
    locs = get_local_locations()
    cats = get_local_categories()
    dists = get_local_districts()
    q_lower = query.lower().strip()
    q_tokens = [w for w in q_lower.split() if len(w) > 1]

    scored_locs = []
    for loc in locs:
        score = 0.0
        name_lower = loc.get("name", "").lower()
        desc_lower = loc.get("description", "").lower()
        addr_lower = loc.get("address", "").lower()

        # Khớp nguyên cụm từ
        if q_lower in name_lower:
            score += 10.0
        elif q_lower in desc_lower:
            score += 5.0
        elif q_lower in addr_lower:
            score += 3.0

        # Khớp từng token từ
        for tok in q_tokens:
            if tok in name_lower:
                score += 3.0
            if tok in desc_lower:
                score += 1.0
            if tok in addr_lower:
                score += 0.5

        if score > 0:
            scored_locs.append({
                "id": loc.get("locationId"),
                "name": loc.get("name"),
                "address": loc.get("address"),
                "description": loc.get("description"),
                "imageUrl": loc.get("imageUrl"),
                "ticketPrice": loc.get("ticketPrice"),
                "ratingAvg": loc.get("ratingAvg"),
                "bestTime": loc.get("bestTimeOfDay"),
                "category": cats.get(loc.get("categoryId"), "Danh thắng Gia Lai"),
                "district": dists.get(loc.get("districtId"), "Gia Lai"),
                "score": round(score, 3),
                "searchType": "local_fulltext"
            })

    scored_locs.sort(key=lambda x: x["score"], reverse=True)
    return scored_locs[:limit]

def semantic_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Thực hiện Tìm kiếm Ngữ nghĩa theo Vector Embedding (Semantic Search).
    Tính độ tương đồng Cosine giữa vector của query và vector embedding của từng điểm đến.
    """
    query_vec = compute_pseudo_embedding(query)

    # 1. Thử qua Neo4j Vector Index
    try:
        from core.neo4j_driver import run_query
        cypher = """
        CALL db.index.vector.queryNodes('location_vector_index', $limit, $vec) YIELD node, score
        MATCH (node)-[:BELONGS_TO]->(c:Category)
        MATCH (node)-[:LOCATED_IN]->(d:District)
        RETURN node.locationId AS id, node.name AS name, node.address AS address,
               node.description AS description, node.imageUrl AS imageUrl,
               node.ticketPrice AS ticketPrice, node.ratingAvg AS ratingAvg,
               node.bestTimeOfDay AS bestTime, c.name AS category, d.name AS district,
               round(score, 3) AS score, 'neo4j_vector' AS searchType
        ORDER BY score DESC
        """
        neo_res = run_query(cypher, {"vec": query_vec, "limit": limit})
        if neo_res:
            return neo_res
    except Exception:
        pass

    # 2. Fallback Vector Cosine Similarity trên bộ dữ liệu local
    locs = get_local_locations()
    cats = get_local_categories()
    dists = get_local_districts()

    scored = []
    for loc in locs:
        loc_vec = loc.get("embedding")
        if not loc_vec:
            text = f"{loc.get('name', '')} {loc.get('description', '')} {loc.get('address', '')}"
            loc_vec = compute_pseudo_embedding(text)
        sim = cosine_similarity(query_vec, loc_vec)
        scored.append({
            "id": loc.get("locationId"),
            "name": loc.get("name"),
            "address": loc.get("address"),
            "description": loc.get("description"),
            "imageUrl": loc.get("imageUrl"),
            "ticketPrice": loc.get("ticketPrice"),
            "ratingAvg": loc.get("ratingAvg"),
            "bestTime": loc.get("bestTimeOfDay"),
            "category": cats.get(loc.get("categoryId"), "Danh thắng Gia Lai"),
            "district": dists.get(loc.get("districtId"), "Gia Lai"),
            "score": round(sim, 3),
            "searchType": "local_vector_embedding"
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:limit]

def hybrid_search(query: str, limit: int = 10, alpha: float = 0.5) -> List[Dict[str, Any]]:
    """
    Tìm kiếm kết hợp (Hybrid Search):
    Điểm tổng = alpha * Điểm_Fulltext_ChuẩnHóa + (1 - alpha) * Điểm_Semantic.
    """
    fts_res = fulltext_search(query, limit=limit * 2)
    sem_res = semantic_search(query, limit=limit * 2)

    # Chuẩn hóa điểm FTS về thang [0, 1]
    max_fts = max([r["score"] for r in fts_res], default=1.0) or 1.0
    for r in fts_res:
        r["norm_score"] = r["score"] / max_fts

    # Kết hợp bằng dictionary
    combined = {}
    for r in fts_res:
        combined[r["id"]] = {
            **r,
            "fts_score": round(r["score"], 3),
            "sem_score": 0.0,
            "hybrid_score": round(alpha * r["norm_score"], 3),
            "searchType": "hybrid"
        }

    for r in sem_res:
        loc_id = r["id"]
        sem_score = r["score"]
        if loc_id in combined:
            combined[loc_id]["sem_score"] = round(sem_score, 3)
            combined[loc_id]["hybrid_score"] = round(combined[loc_id]["hybrid_score"] + (1 - alpha) * sem_score, 3)
        else:
            combined[loc_id] = {
                **r,
                "fts_score": 0.0,
                "sem_score": round(sem_score, 3),
                "hybrid_score": round((1 - alpha) * sem_score, 3),
                "searchType": "hybrid"
            }

    results = list(combined.values())
    results.sort(key=lambda x: x["hybrid_score"], reverse=True)
    return results[:limit]

def get_location_enrichment(location_id: str) -> Dict[str, Any]:
    """
    Lấy toàn bộ thông tin bổ sung kết nối với 1 điểm du lịch:
    - Sự kiện / Lễ hội (:Event)
    - Nhà hàng / Ẩm thực (:Dish)
    - Cơ sở lưu trú (:Accommodation)
    - Điểm vui chơi giải trí (:Entertainment)
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    base_data = os.path.join(current_dir, "..", "..", "..", "data")

    # Đọc các file thông tin bổ sung
    events_file = os.path.join(base_data, "events.json")
    dishes_file = os.path.join(base_data, "dishes.json")
    stays_file = os.path.join(base_data, "accommodations.json")
    ents_file = os.path.join(base_data, "entertainments.json")

    events = []
    if os.path.exists(events_file):
        with open(events_file, "r", encoding="utf-8") as f:
            all_evts = json.load(f)
            events = [e for e in all_evts if e.get("locationId") == location_id]

    entertainments = []
    if os.path.exists(ents_file):
        with open(ents_file, "r", encoding="utf-8") as f:
            all_ents = json.load(f)
            entertainments = [ent for ent in all_ents if ent.get("locationId") == location_id]

    # Đọc các gợi ý món ăn và nơi lưu trú gần nhất
    dishes = []
    if os.path.exists(dishes_file):
        with open(dishes_file, "r", encoding="utf-8") as f:
            dishes = json.load(f)[:3] # Top 3 gợi ý tiêu biểu

    stays = []
    if os.path.exists(stays_file):
        with open(stays_file, "r", encoding="utf-8") as f:
            stays = json.load(f)[:3] # Top 3 nơi lưu trú tiêu biểu

    return {
        "locationId": location_id,
        "events": events,
        "entertainments": entertainments,
        "nearbyDishes": dishes,
        "nearbyStays": stays
    }
