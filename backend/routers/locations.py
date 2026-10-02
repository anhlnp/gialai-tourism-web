"""
Locations Router — Điểm tham quan du lịch tỉnh Gia Lai (Chính thống).
"""
import os
import json
from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from core.neo4j_driver import run_query, run_query_single

router = APIRouter(prefix="/api/locations", tags=["Locations"])

def _get_local_data():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(current_dir, "..", "data")
    locs, cats, dists = [], {}, {}
    
    loc_file = os.path.join(data_dir, "locations.json")
    cat_file = os.path.join(data_dir, "categories.json")
    dist_file = os.path.join(data_dir, "districts.json")
    
    if os.path.exists(loc_file):
        with open(loc_file, "r", encoding="utf-8") as f:
            locs = json.load(f)
    if os.path.exists(cat_file):
        with open(cat_file, "r", encoding="utf-8") as f:
            for c in json.load(f):
                cats[c["categoryId"]] = c["name"]
    if os.path.exists(dist_file):
        with open(dist_file, "r", encoding="utf-8") as f:
            for d in json.load(f):
                dists[d["districtId"]] = d["name"]
                
    return locs, cats, dists


@router.get("")
def list_locations(
    region: Optional[str] = Query(None, description="Filter by region/district"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    search: Optional[str] = Query(None, description="Search by name"),
    limit: int = Query(50, ge=1, le=200),
):
    """Danh sách điểm đến — dùng cho trang Explore."""
    # 1. Thử qua Neo4j
    try:
        conditions = []
        params: dict = {"limit": limit}

        if region:
            conditions.append("d.name = $region")
            params["region"] = region
        if category:
            conditions.append("cat.name = $category")
            params["category"] = category
        if min_rating:
            conditions.append("avgRating >= $minRating")
            params["minRating"] = min_rating
        if search:
            conditions.append("toLower(loc.name) CONTAINS toLower($search)")
            params["search"] = search

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        cypher = f"""
        MATCH (loc:Location)-[:LOCATED_IN]->(d:District)
        OPTIONAL MATCH (loc)-[:BELONGS_TO|BELONGS_TO_CATEGORY]->(cat:Category)
        OPTIONAL MATCH (u:User)-[r:RATED]->(loc)
        WITH loc, d, cat,
             CASE WHEN count(r) > 0 THEN round(avg(toFloat(r.rating)), 1) ELSE loc.ratingAvg END AS avgRating,
             count(r) AS reviewCount
        {where}
        RETURN loc.locationId AS id,
               loc.name AS name,
               loc.description AS description,
               loc.address AS address,
               loc.latitude AS lat,
               loc.longitude AS lng,
               loc.imageUrl AS imageUrl,
               loc.bestTimeOfDay AS bestTime,
               loc.ticketPrice AS budget,
               d.name AS district,
               cat.name AS category,
               avgRating,
               reviewCount
        ORDER BY avgRating DESC, reviewCount DESC
        LIMIT $limit
        """
        res = run_query(cypher, params)
        if res:
            return res
    except Exception:
        pass

    # 2. Fallback sang dữ liệu chuẩn hóa local (data/locations.json)
    locs, cats, dists = _get_local_data()
    filtered = []
    
    for l in locs:
        dist_name = dists.get(l.get("districtId"), "Gia Lai")
        cat_name = cats.get(l.get("categoryId"), "Danh thắng Gia Lai")
        rating = float(l.get("ratingAvg", 4.5))
        
        if region and dist_name != region:
            continue
        if category and cat_name != category:
            continue
        if min_rating and rating < min_rating:
            continue
        if search and search.lower() not in l.get("name", "").lower() and search.lower() not in l.get("description", "").lower():
            continue
            
        filtered.append({
            "id": l.get("locationId"),
            "name": l.get("name"),
            "description": l.get("description"),
            "address": l.get("address"),
            "lat": l.get("latitude"),
            "lng": l.get("longitude"),
            "imageUrl": l.get("imageUrl"),
            "bestTime": l.get("bestTimeOfDay"),
            "budget": l.get("ticketPrice", 0),
            "district": dist_name,
            "category": cat_name,
            "avgRating": rating,
            "reviewCount": 12
        })
        
    filtered.sort(key=lambda x: x["avgRating"], reverse=True)
    return filtered[:limit]


@router.get("/categories")
def list_categories():
    """Danh sách loại hình tham quan chính thống tỉnh Gia Lai."""
    try:
        res = run_query("MATCH (c:Category) RETURN c.categoryId AS id, c.name AS name ORDER BY c.name")
        if res:
            return res
    except Exception:
        pass
        
    current_dir = os.path.dirname(os.path.abspath(__file__))
    cat_file = os.path.join(current_dir, "..", "data", "categories.json")
    if os.path.exists(cat_file):
        with open(cat_file, "r", encoding="utf-8") as f:
            cats = json.load(f)
            return [{"id": c["categoryId"], "name": c["name"]} for c in cats]
    return []


@router.get("/districts")
def list_districts():
    """Danh sách quận/huyện/thị/thành phố tỉnh Gia Lai."""
    try:
        cypher = """
        MATCH (d:District)
        OPTIONAL MATCH (loc:Location)-[:LOCATED_IN]->(d)
        RETURN d.districtId AS id, d.name AS name, count(loc) AS locationCount
        ORDER BY d.name
        """
        res = run_query(cypher)
        if res:
            return res
    except Exception:
        pass

    current_dir = os.path.dirname(os.path.abspath(__file__))
    dist_file = os.path.join(current_dir, "..", "data", "districts.json")
    loc_file = os.path.join(current_dir, "..", "data", "locations.json")
    
    loc_counts = {}
    if os.path.exists(loc_file):
        with open(loc_file, "r", encoding="utf-8") as f:
            for l in json.load(f):
                d_id = l.get("districtId")
                loc_counts[d_id] = loc_counts.get(d_id, 0) + 1
                
    if os.path.exists(dist_file):
        with open(dist_file, "r", encoding="utf-8") as f:
            dists = json.load(f)
            return [{"id": d["districtId"], "name": d["name"], "locationCount": loc_counts.get(d["districtId"], 0)} for d in dists]
    return []


@router.get("/{location_id}")
def get_location_detail(location_id: str):
    """Chi tiết 1 điểm đến — kèm thông tin bổ sung: sự kiện, ẩm thực, lưu trú, vui chơi."""
    try:
        info = run_query_single("""
            MATCH (loc:Location {locationId: $id})-[:LOCATED_IN]->(d:District)
            OPTIONAL MATCH (loc)-[:BELONGS_TO|BELONGS_TO_CATEGORY]->(cat:Category)
            RETURN loc.locationId AS id, loc.name AS name, loc.description AS description,
                   loc.address AS address, loc.latitude AS lat, loc.longitude AS lng,
                   loc.imageUrl AS imageUrl, loc.imageUrls AS imageUrls,
                   loc.bestTimeOfDay AS bestTime, loc.ticketPrice AS budget,
                   d.name AS district, cat.name AS category,
                   loc.ratingAvg AS avgRating,
                   15 AS reviewCount
        """, {"id": location_id})

        if info:
            # Nearby dishes
            dishes = run_query("""
                MATCH (loc:Location {locationId: $id})-[ne:NEAR_EATERY]->(dish:Dish)
                RETURN dish.dishId AS id, dish.name AS name, dish.description AS description,
                       dish.imageUrl AS imageUrl, dish.priceRange AS budget,
                       ne.distanceKm AS distanceKm
                ORDER BY ne.distanceKm ASC LIMIT 6
            """, {"id": location_id})

            # Nearby stay
            stays = run_query("""
                MATCH (loc:Location {locationId: $id})-[ns:NEAR_STAY]->(acc:Accommodation)
                RETURN acc.accId AS id, acc.name AS name, acc.description AS description,
                       acc.imageUrl AS imageUrl, acc.pricePerNight AS budget,
                       ns.distanceKm AS distanceKm
                ORDER BY ns.distanceKm ASC LIMIT 6
            """, {"id": location_id})

            # Events
            events = run_query("""
                MATCH (loc:Location {locationId: $id})-[:HAS_EVENT]->(evt:Event)
                RETURN evt.eventId AS id, evt.name AS name, evt.monthOccurred AS time,
                       evt.highlightActivity AS highlight, evt.description AS description
            """, {"id": location_id})

            # Entertainment
            entertainments = run_query("""
                MATCH (loc:Location {locationId: $id})-[:NEAR_ENTERTAINMENT]->(ent:Entertainment)
                RETURN ent.entId AS id, ent.name AS name, ent.entertainmentType AS type,
                       ent.openHours AS openHours, ent.imageUrl AS imageUrl
            """, {"id": location_id})

            return {
                **info,
                "nearbyDishes": dishes,
                "nearbyStays": stays,
                "events": events,
                "entertainments": entertainments
            }
    except Exception:
        pass

    # Fallback local data
    locs, cats, dists = _get_local_data()
    target = next((l for l in locs if l.get("locationId") == location_id), None)
    if not target:
        return {"error": "Location not found"}
        
    current_dir = os.path.dirname(os.path.abspath(__file__))
    base_data = os.path.join(current_dir, "..", "data")
    
    events, dishes, stays, entertainments = [], [], [], []
    
    ev_path = os.path.join(base_data, "events.json")
    if os.path.exists(ev_path):
        with open(ev_path, "r", encoding="utf-8") as f:
            events = [e for e in json.load(f) if e.get("locationId") == location_id]
            
    ent_path = os.path.join(base_data, "entertainments.json")
    if os.path.exists(ent_path):
        with open(ent_path, "r", encoding="utf-8") as f:
            entertainments = [ent for ent in json.load(f) if ent.get("locationId") == location_id]
            
    dish_path = os.path.join(base_data, "dishes.json")
    if os.path.exists(dish_path):
        with open(dish_path, "r", encoding="utf-8") as f:
            dishes = json.load(f)[:3]
            
    stay_path = os.path.join(base_data, "accommodations.json")
    if os.path.exists(stay_path):
        with open(stay_path, "r", encoding="utf-8") as f:
            stays = json.load(f)[:3]

    return {
        "id": target["locationId"],
        "name": target["name"],
        "description": target["description"],
        "address": target["address"],
        "lat": target["latitude"],
        "lng": target["longitude"],
        "imageUrl": target["imageUrl"],
        "imageUrls": target.get("imageUrls", [target["imageUrl"]]),
        "bestTime": target["bestTimeOfDay"],
        "budget": target.get("ticketPrice", 0),
        "district": dists.get(target.get("districtId"), "Gia Lai"),
        "category": cats.get(target.get("categoryId"), "Danh thắng Gia Lai"),
        "avgRating": target.get("ratingAvg", 4.8),
        "reviewCount": 18,
        "nearbyDishes": dishes,
        "nearbyStays": stays,
        "events": events,
        "entertainments": entertainments
    }
