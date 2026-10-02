"""
Dishes Router — Ẩm thực đặc sản Gia Lai (Thông tin bổ sung).
"""
import os
import json
from fastapi import APIRouter, Query
from typing import Optional
from core.neo4j_driver import run_query

router = APIRouter(prefix="/api/dishes", tags=["Dishes"])


@router.get("")
def list_dishes(
    region: Optional[str] = Query(None, description="Filter by district"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """Danh sách ẩm thực đặc sản."""
    try:
        conditions = []
        params: dict = {"limit": limit}

        if search:
            conditions.append("toLower(dish.name) CONTAINS toLower($search)")
            params["search"] = search

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        cypher = f"""
        MATCH (dish:Dish)
        OPTIONAL MATCH (loc:Location)-[ne:NEAR_EATERY]->(dish)
        OPTIONAL MATCH (loc)-[:LOCATED_IN]->(d:District)
        {where}
        RETURN dish.dishId AS id, dish.name AS name, dish.description AS description,
               dish.imageUrl AS imageUrl, dish.imageUrls AS imageUrls,
               dish.priceRange AS budget, dish.priceMin AS priceMin, dish.priceMax AS priceMax,
               dish.mealTime AS mealTime, dish.tasteType AS tasteType,
               dish.suggestedEateries AS suggestedEateries,
               collect(DISTINCT d.name)[0..3] AS regions
        ORDER BY dish.name
        LIMIT $limit
        """
        res = run_query(cypher, params)
        if res:
            for r in res:
                if not r.get("budget") and (r.get("priceMin") or r.get("priceMax")):
                    try:
                        r["budget"] = f"{int(r['priceMin']):,}đ - {int(r['priceMax']):,}đ"
                    except Exception:
                        pass
                if not r.get("imageUrls") and r.get("imageUrl"):
                    r["imageUrls"] = [r["imageUrl"]]
            return res
    except Exception:
        pass

    # Fallback to local data
    current_dir = os.path.dirname(os.path.abspath(__file__))
    d_file = os.path.join(current_dir, "..", "data", "dishes.json")
    if os.path.exists(d_file):
        with open(d_file, "r", encoding="utf-8") as f:
            dishes = json.load(f)
            if search:
                dishes = [d for d in dishes if search.lower() in d["name"].lower() or search.lower() in d.get("description", "").lower()]
            return [
                {
                    "id": d.get("id") or d.get("dishId"),
                    "name": d["name"],
                    "description": d.get("description", ""),
                    "imageUrl": d.get("imageUrl", ""),
                    "imageUrls": d.get("imageUrls") or ([d["imageUrl"]] if d.get("imageUrl") else []),
                    "budget": d.get("budget") or d.get("priceRange", ""),
                    "priceMin": d.get("priceMin"),
                    "priceMax": d.get("priceMax"),
                    "mealTime": d.get("mealTime", ""),
                    "tasteType": d.get("tasteType", ""),
                    "suggestedEateries": d.get("suggestedEateries", []),
                    "regions": [d.get("region", "Gia Lai")]
                }
                for d in dishes[:limit]
            ]
    return []
