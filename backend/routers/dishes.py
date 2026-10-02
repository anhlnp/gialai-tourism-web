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
               dish.imageUrl AS imageUrl, dish.priceRange AS budget,
               dish.mealTime AS mealTime,
               collect(DISTINCT d.name)[0..3] AS regions
        ORDER BY dish.name
        LIMIT $limit
        """
        res = run_query(cypher, params)
        if res:
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
                    "id": d["dishId"],
                    "name": d["name"],
                    "description": d["description"],
                    "imageUrl": d["imageUrl"],
                    "budget": d.get("priceRange", ""),
                    "mealTime": d.get("mealTime", ""),
                    "regions": ["Pleiku", "Chư Păh"]
                }
                for d in dishes[:limit]
            ]
    return []
