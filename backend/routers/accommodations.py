"""
Accommodations Router — Cơ sở lưu trú Gia Lai (Thông tin bổ sung).
"""
import os
import json
from fastapi import APIRouter, Query
from typing import Optional
from core.neo4j_driver import run_query

router = APIRouter(prefix="/api/accommodations", tags=["Accommodations"])


@router.get("")
def list_accommodations(
    region: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    """Danh sách cơ sở lưu trú."""
    try:
        conditions = []
        params: dict = {"limit": limit}

        if search:
            conditions.append("toLower(acc.name) CONTAINS toLower($search)")
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
        res = run_query(cypher, params)
        if res:
            for r in res:
                if not r.get("imageUrls") and r.get("imageUrl"):
                    r["imageUrls"] = [r["imageUrl"]]
                if isinstance(r.get("budget"), (int, float)):
                    r["budget"] = f"{int(r['budget']):,}đ / đêm"
            return res
    except Exception:
        pass

    # Fallback to local data
    current_dir = os.path.dirname(os.path.abspath(__file__))
    a_file = os.path.join(current_dir, "..", "data", "accommodations.json")
    if os.path.exists(a_file):
        with open(a_file, "r", encoding="utf-8") as f:
            stays = json.load(f)
            if search:
                stays = [s for s in stays if search.lower() in s["name"].lower() or search.lower() in s.get("description", "").lower()]
            return [
                {
                    "id": s.get("id") or s.get("accId"),
                    "name": s["name"],
                    "description": s.get("description", ""),
                    "imageUrl": s.get("imageUrl", ""),
                    "imageUrls": s.get("imageUrls") or ([s["imageUrl"]] if s.get("imageUrl") else []),
                    "budget": s.get("budget") or s.get("pricePerNight", ""),
                    "stayType": s.get("stayType", "Khách sạn"),
                    "address": s.get("address", ""),
                    "ratingAvg": s.get("ratingAvg", 4.7),
                    "suitableFor": s.get("suitableFor", []),
                    "regions": ["TP. Pleiku", "Chư Păh"]
                }
                for s in stays[:limit]
            ]
    return []
