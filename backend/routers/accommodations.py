"""
Accommodations Router — Cơ sở lưu trú Gia Lai (Truy vấn trực tiếp từ Neo4j Knowledge Graph).
"""
import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from core.neo4j_driver import run_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/accommodations", tags=["Accommodations"])


@router.get("")
def list_accommodations(
    region: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """Danh sách cơ sở lưu trú truy vấn trực tiếp từ Neo4j."""
    conditions = []
    params: dict = {"limit": limit}

    if search:
        conditions.append("toLower(acc.name) CONTAINS toLower($search) OR toLower(acc.description) CONTAINS toLower($search)")
        params["search"] = search

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    cypher = f"""
    MATCH (acc:Accommodation)
    OPTIONAL MATCH (loc:Location)-[:NEAR_STAY]->(acc)
    OPTIONAL MATCH (loc)-[:LOCATED_IN]->(d:District)
    {where}
    RETURN acc.accId AS id, acc.name AS name, acc.description AS description,
           acc.imageUrl AS imageUrl, acc.imageUrls AS imageUrls,
           acc.pricePerNight AS budget, acc.stayType AS stayType,
           acc.address AS address, acc.ratingAvg AS ratingAvg,
           acc.suitableFor AS suitableFor,
           collect(DISTINCT d.name)[0..3] AS regions
    ORDER BY acc.name
    LIMIT $limit
    """
    try:
        res = run_query(cypher, params)
        if res is not None:
            for r in res:
                if not r.get("imageUrls") and r.get("imageUrl"):
                    r["imageUrls"] = [r["imageUrl"]]
                if isinstance(r.get("budget"), (int, float)):
                    r["budget"] = f"{int(r['budget']):,}đ / đêm"
            return res
        return []
    except Exception as e:
        logger.error(f"Error querying accommodations from Neo4j: {e}")
        raise HTTPException(status_code=503, detail="Database service temporarily unavailable")
