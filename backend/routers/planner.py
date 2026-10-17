"""
Planner Router — Lập lộ trình du lịch thông minh tỉnh Gia Lai (Truy vấn đồ thị Neo4j).
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from core.neo4j_driver import run_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/planner", tags=["Planner"])


class PlanRequest(BaseModel):
    days: int = 2
    region: Optional[str] = None
    style: Optional[str] = None
    budget: Optional[str] = None


@router.post("")
def generate_plan(req: PlanRequest):
    """Tạo lộ trình du lịch dựa trên CSDL đồ thị Neo4j."""
    conditions = []
    params: dict = {}

    if req.region:
        conditions.append("(d.name = $region OR loc.geographic_region = $region OR loc.legacy_province = $region OR d.geographic_region = $region)")
        params["region"] = req.region

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    cypher = f"""
    MATCH (loc:Location)-[:LOCATED_IN]->(d:District)
    OPTIONAL MATCH (loc)-[:BELONGS_TO]->(cat:Category)
    OPTIONAL MATCH (u:User)-[r:RATED]->(loc)
    WITH loc, d, cat,
         CASE WHEN count(r) > 0 THEN avg(toFloat(r.rating)) ELSE loc.ratingAvg END AS score
    {where}
    RETURN loc.locationId AS id, loc.name AS name, loc.description AS description,
           loc.imageUrl AS imageUrl, loc.latitude AS lat, loc.longitude AS lng,
           loc.bestTimeOfDay AS bestTime, loc.ticketPrice AS budget,
           d.name AS district, cat.name AS category, score
    ORDER BY score DESC
    LIMIT $total
    """
    params["total"] = max(4, req.days * 4)

    try:
        locations = run_query(cypher, params)
        if locations is None:
            locations = []

        itinerary = []
        if locations:
            spots_per_day = max(2, len(locations) // req.days)

            for day_idx in range(req.days):
                start = day_idx * spots_per_day
                day_locs = locations[start : start + spots_per_day]
                if not day_locs and locations:
                    # Nếu số ngày nhiều hơn số điểm, phân bổ điểm có sẵn
                    day_locs = [locations[day_idx % len(locations)]]

                food_suggestions = []
                if day_locs:
                    first_loc_id = day_locs[0]["id"]
                    try:
                        food_suggestions = run_query("""
                            MATCH (loc:Location {locationId: $id})-[:NEAR_EATERY]->(dish:Dish)
                            RETURN dish.name AS name, dish.imageUrl AS imageUrl,
                                   dish.priceRange AS budget, dish.mealTime AS mealTime
                            ORDER BY dish.name LIMIT 2
                        """, {"id": first_loc_id}) or []
                    except Exception:
                        food_suggestions = []

                stay_suggestion = None
                if day_locs:
                    last_loc_id = day_locs[-1]["id"]
                    try:
                        stays = run_query("""
                            MATCH (loc:Location {locationId: $id})-[:NEAR_STAY]->(acc:Accommodation)
                            RETURN acc.name AS name, acc.imageUrl AS imageUrl, acc.pricePerNight AS budget
                            ORDER BY acc.name LIMIT 1
                        """, {"id": last_loc_id}) or []
                        stay_suggestion = stays[0] if stays else None
                    except Exception:
                        stay_suggestion = None

                itinerary.append({
                    "day": day_idx + 1,
                    "locations": day_locs,
                    "food": food_suggestions,
                    "stay": stay_suggestion,
                })

        return {
            "days": req.days,
            "region": req.region,
            "itinerary": itinerary,
            "totalLocations": len(locations),
        }
    except Exception as e:
        logger.error(f"Error generating plan from Neo4j: {e}")
        raise HTTPException(status_code=503, detail="Database service temporarily unavailable")
