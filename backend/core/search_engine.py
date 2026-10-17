"""
Search Engine Module — Fulltext Search & Semantic Search with Vector Embeddings.
Hỗ trợ tìm kiếm toàn văn và tìm kiếm ngữ nghĩa theo embedding cho Du lịch Gia Lai (Truy vấn trực tiếp Neo4j).
"""
import logging
import math
import hashlib
from typing import List, Dict, Any
from core.neo4j_driver import run_query

logger = logging.getLogger(__name__)

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


def fulltext_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Thực hiện Tìm kiếm Toàn văn (Fulltext Search) trực tiếp qua Neo4j Fulltext Index.
    """
    if not query or not query.strip():
        return []

    try:
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
        neo_res = run_query(cypher, {"q": query.strip(), "limit": limit})
        return neo_res or []
    except Exception as e:
        logger.error(f"Error in Neo4j fulltext search: {e}")
        return []


def semantic_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Thực hiện Tìm kiếm Ngữ nghĩa theo Vector Embedding (Semantic Search) qua Neo4j Vector Index.
    """
    if not query or not query.strip():
        return []

    query_vec = compute_pseudo_embedding(query.strip())
    try:
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
        return neo_res or []
    except Exception as e:
        logger.error(f"Error in Neo4j semantic vector search: {e}")
        return []


def hybrid_search(query: str, limit: int = 10, alpha: float = 0.5) -> List[Dict[str, Any]]:
    """
    Tìm kiếm kết hợp (Hybrid Search):
    Điểm tổng = alpha * Điểm_Fulltext_ChuẩnHóa + (1 - alpha) * Điểm_Semantic.
    """
    fts_res = fulltext_search(query, limit=limit * 2)
    sem_res = semantic_search(query, limit=limit * 2)

    if not fts_res and not sem_res:
        return []

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
    Lấy toàn bộ thông tin bổ sung kết nối với 1 điểm du lịch từ Đồ thị Neo4j:
    - Sự kiện / Lễ hội (:Event via :HAS_EVENT)
    - Nhà hàng / Ẩm thực (:Dish via :NEAR_EATERY)
    - Cơ sở lưu trú (:Accommodation via :NEAR_STAY)
    - Điểm vui chơi giải trí (:Entertainment via :NEAR_ENTERTAINMENT)
    """
    cypher = """
    MATCH (loc:Location {locationId: $id})
    OPTIONAL MATCH (loc)-[:HAS_EVENT]->(evt:Event)
    OPTIONAL MATCH (loc)-[:NEAR_ENTERTAINMENT]->(ent:Entertainment)
    OPTIONAL MATCH (loc)-[:NEAR_EATERY]->(dish:Dish)
    OPTIONAL MATCH (loc)-[:NEAR_STAY]->(acc:Accommodation)
    RETURN 
        [e IN collect(DISTINCT evt) WHERE e IS NOT NULL | {
            id: e.eventId, name: e.name, time: e.monthOccurred, frequency: e.frequency,
            highlight: e.highlightActivity, description: e.description
        }] AS events,
        [en IN collect(DISTINCT ent) WHERE en IS NOT NULL | {
            id: en.entId, name: en.name, type: en.entertainmentType, openHours: en.openHours,
            address: en.address, budget: en.ticketPrice, imageUrl: en.imageUrl, description: en.description
        }] AS entertainments,
        [d IN collect(DISTINCT dish) WHERE d IS NOT NULL | {
            id: d.dishId, name: d.name, description: d.description, imageUrl: d.imageUrl,
            budget: d.priceRange, mealTime: d.mealTime, tasteType: d.tasteType
        }] AS nearbyDishes,
        [a IN collect(DISTINCT acc) WHERE a IS NOT NULL | {
            id: a.accId, name: a.name, description: a.description, imageUrl: a.imageUrl,
            budget: a.pricePerNight, stayType: a.stayType, address: a.address, ratingAvg: a.ratingAvg
        }] AS nearbyStays
    """
    try:
        res = run_query(cypher, {"id": location_id})
        if res and len(res) > 0:
            row = res[0]
            for acc in row.get("nearbyStays", []):
                if isinstance(acc.get("budget"), (int, float)):
                    acc["budget"] = f"{int(acc['budget']):,}đ / đêm"
            return {
                "locationId": location_id,
                "events": row.get("events", []),
                "entertainments": row.get("entertainments", []),
                "nearbyDishes": row.get("nearbyDishes", []),
                "nearbyStays": row.get("nearbyStays", [])
            }
        return {
            "locationId": location_id,
            "events": [],
            "entertainments": [],
            "nearbyDishes": [],
            "nearbyStays": []
        }
    except Exception as e:
        logger.error(f"Error querying location enrichment for {location_id} from Neo4j: {e}")
        return {
            "locationId": location_id,
            "events": [],
            "entertainments": [],
            "nearbyDishes": [],
            "nearbyStays": []
        }
