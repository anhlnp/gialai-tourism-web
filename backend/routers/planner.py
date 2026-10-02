"""
Planner Router — Lập lộ trình du lịch thông minh tỉnh Gia Lai.
"""
import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from core.neo4j_driver import run_query

router = APIRouter(prefix="/api/planner", tags=["Planner"])


class PlanRequest(BaseModel):
    days: int = 2
    region: str | None = None
    style: str | None = None
    budget: str | None = None


@router.post("")
def generate_plan(req: PlanRequest):
    """Tạo lộ trình du lịch dựa trên CSDL đồ thị."""
    try:
        conditions = []
        params: dict = {}

        if req.region:
            conditions.append("d.name = $region")
            params["region"] = req.region

        where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

        cypher = f"""
        MATCH (loc:Location)-[:LOCATED_IN]->(d:District)
        OPTIONAL MATCH (loc)-[:BELONGS_TO|BELONGS_TO_CATEGORY]->(cat:Category)
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
        params["total"] = req.days * 4

        locations = run_query(cypher, params)
        if locations:
            itinerary = []
            spots_per_day = max(2, len(locations) // req.days)

            for day_idx in range(req.days):
                start = day_idx * spots_per_day
                day_locs = locations[start : start + spots_per_day]

                food_suggestions = []
                if day_locs:
                    first_loc_id = day_locs[0]["id"]
                    food_suggestions = run_query("""
                        MATCH (loc:Location {locationId: $id})-[:NEAR_EATERY]->(dish:Dish)
                        RETURN dish.name AS name, dish.imageUrl AS imageUrl,
                               dish.priceRange AS budget, dish.mealTime AS mealTime
                        ORDER BY dish.name LIMIT 2
                    """, {"id": first_loc_id})

                stay_suggestion = None
                if day_locs:
                    last_loc_id = day_locs[-1]["id"]
                    stays = run_query("""
                        MATCH (loc:Location {locationId: $id})-[:NEAR_STAY]->(acc:Accommodation)
                        RETURN acc.name AS name, acc.imageUrl AS imageUrl, acc.pricePerNight AS budget
                        ORDER BY acc.name LIMIT 1
                    """, {"id": last_loc_id})
                    stay_suggestion = stays[0] if stays else None

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
    except Exception:
        pass

    # Fallback to local data
    current_dir = os.path.dirname(os.path.abspath(__file__))
    base_data = os.path.join(current_dir, "..", "data")
    locs_file = os.path.join(base_data, "locations.json")
    dishes_file = os.path.join(base_data, "dishes.json")
    stays_file = os.path.join(base_data, "accommodations.json")
    dists_file = os.path.join(base_data, "districts.json")
    cats_file = os.path.join(base_data, "categories.json")

    locs, dishes, stays, dists, cats = [], [], [], {}, {}

    if os.path.exists(dists_file):
        with open(dists_file, "r", encoding="utf-8") as f:
            for d in json.load(f):
                dists[d["districtId"]] = d["name"]
    if os.path.exists(cats_file):
        with open(cats_file, "r", encoding="utf-8") as f:
            for c in json.load(f):
                cats[c["categoryId"]] = c["name"]
    if os.path.exists(dishes_file):
        with open(dishes_file, "r", encoding="utf-8") as f:
            dishes = json.load(f)
    if os.path.exists(stays_file):
        with open(stays_file, "r", encoding="utf-8") as f:
            stays = json.load(f)
    if os.path.exists(locs_file):
        with open(locs_file, "r", encoding="utf-8") as f:
            locs = json.load(f)

    if req.region:
        locs = [l for l in locs if dists.get(l.get("districtId")) == req.region]

    spots_per_day = 3
    total_needed = req.days * spots_per_day
    selected_locs = locs[:total_needed]

    itinerary = []
    for day_idx in range(req.days):
        day_items = selected_locs[day_idx * spots_per_day : (day_idx + 1) * spots_per_day]
        formatted_day_locs = [
            {
                "id": l["locationId"],
                "name": l["name"],
                "description": l["description"],
                "imageUrl": l["imageUrl"],
                "lat": l["latitude"],
                "lng": l["longitude"],
                "bestTime": l["bestTimeOfDay"],
                "budget": l.get("ticketPrice", 0),
                "district": dists.get(l.get("districtId"), "Gia Lai"),
                "category": cats.get(l.get("categoryId"), "Danh thắng Gia Lai"),
                "score": l.get("ratingAvg", 4.8)
            }
            for l in day_items
        ]

        food_items = [
            {
                "name": d["name"],
                "imageUrl": d["imageUrl"],
                "budget": d.get("priceRange", ""),
                "mealTime": d.get("mealTime", "")
            }
            for d in dishes[day_idx % len(dishes) : (day_idx % len(dishes)) + 2]
        ]

        stay_item = None
        if stays:
            s = stays[day_idx % len(stays)]
            stay_item = {
                "name": s["name"],
                "imageUrl": s["imageUrl"],
                "budget": s.get("pricePerNight", "")
            }

        itinerary.append({
            "day": day_idx + 1,
            "locations": formatted_day_locs,
            "food": food_items,
            "stay": stay_item
        })

    return {
        "days": req.days,
        "region": req.region,
        "itinerary": itinerary,
        "totalLocations": len(selected_locs)
    }
