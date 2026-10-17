"""
Dishes Router — Ẩm thực đặc sản Gia Lai (Truy vấn trực tiếp từ Neo4j Knowledge Graph).
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from core.neo4j_driver import run_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dishes", tags=["Dishes"])


@router.get("")
def list_dishes(
    region: Optional[str] = Query(None, description="Filter by district"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """Danh sách ẩm thực đặc sản truy vấn trực tiếp từ Neo4j."""
    conditions = []
    params: dict = {"limit": limit}

    if search:
        conditions.append("toLower(dish.name) CONTAINS toLower($search) OR toLower(dish.description) CONTAINS toLower($search)")
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
    try:
        res = run_query(cypher, params)
        if res is not None:
            for r in res:
                if not r.get("budget") and (r.get("priceMin") or r.get("priceMax")):
                    try:
                        p_min = int(r['priceMin']) if r.get('priceMin') else 0
                        p_max = int(r['priceMax']) if r.get('priceMax') else 0
                        if p_min and p_max:
                            r["budget"] = f"{p_min:,}đ - {p_max:,}đ"
                        elif p_min:
                            r["budget"] = f"Từ {p_min:,}đ"
                    except Exception:
                        pass
                if not r.get("imageUrls") and r.get("imageUrl"):
                    r["imageUrls"] = [r["imageUrl"]]
            return res
        return []
    except Exception as e:
        logger.error(f"Error querying dishes from Neo4j: {e}")
        raise HTTPException(status_code=503, detail="Database service temporarily unavailable")
