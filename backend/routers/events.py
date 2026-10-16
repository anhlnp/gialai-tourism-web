import os
import json
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["events"])

@router.get("/events")
def get_all_events():
    """Lấy danh sách tất cả các sự kiện và lễ hội văn hóa tại Gia Lai."""
    try:
        from core.neo4j_driver import run_query
        events = run_query("""
            MATCH (evt:Event)
            OPTIONAL MATCH (loc:Location)-[:HAS_EVENT]->(evt)
            RETURN evt.eventId AS id, evt.name AS name, evt.monthOccurred AS time,
                   evt.frequency AS frequency, evt.highlightActivity AS highlight,
                   evt.description AS description, loc.locationId AS locationId, loc.name AS locationName
            ORDER BY evt.name
        """)
        if events:
            return events
    except Exception:
        pass

    # Fallback local data
    cur_dir = os.path.dirname(os.path.abspath(__file__))
    ev_path = os.path.join(cur_dir, "..", "data", "events.json")
    if os.path.exists(ev_path):
        with open(ev_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@router.get("/entertainments")
def get_all_entertainments():
    """Lấy danh sách các điểm vui chơi, giải trí, cà phê ngắm cảnh tại Gia Lai."""
    try:
        from core.neo4j_driver import run_query
        ents = run_query("""
            MATCH (ent:Entertainment)
            OPTIONAL MATCH (loc:Location)-[:NEAR_ENTERTAINMENT]->(ent)
            RETURN ent.entId AS id, ent.name AS name, ent.entertainmentType AS type,
                   ent.openHours AS openHours, ent.address AS address, ent.ticketPrice AS budget,
                   ent.imageUrl AS imageUrl, ent.description AS description,
                   loc.locationId AS locationId, loc.name AS locationName
            ORDER BY ent.name
        """)
        if ents:
            return ents
    except Exception:
        pass

    # Fallback local data
    cur_dir = os.path.dirname(os.path.abspath(__file__))
    ent_path = os.path.join(cur_dir, "..", "data", "entertainments.json")
    if os.path.exists(ent_path):
        with open(ent_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []
