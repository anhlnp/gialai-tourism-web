"""
Events & Entertainment Router — Sự kiện, Lễ hội và Vui chơi Giải trí (Truy vấn trực tiếp từ Neo4j).
"""
import logging
from fastapi import APIRouter, HTTPException
from core.neo4j_driver import run_query

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events")
def get_all_events():
    """Lấy danh sách tất cả các sự kiện và lễ hội văn hóa tại Gia Lai từ Neo4j."""
    try:
        events = run_query("""
            MATCH (evt:Event)
            OPTIONAL MATCH (loc:Location)-[:HAS_EVENT]->(evt)
            RETURN evt.eventId AS id, evt.name AS name, evt.monthOccurred AS time,
                   evt.frequency AS frequency, evt.highlightActivity AS highlight,
                   evt.description AS description, loc.locationId AS locationId, loc.name AS locationName
            ORDER BY evt.name
        """)
        return events if events is not None else []
    except Exception as e:
        logger.error(f"Error querying events from Neo4j: {e}")
        raise HTTPException(status_code=503, detail="Database service temporarily unavailable")


@router.get("/entertainments")
def get_all_entertainments():
    """Lấy danh sách các điểm vui chơi, giải trí, cà phê ngắm cảnh tại Gia Lai từ Neo4j."""
    try:
        ents = run_query("""
            MATCH (ent:Entertainment)
            OPTIONAL MATCH (loc:Location)-[:NEAR_ENTERTAINMENT]->(ent)
            RETURN ent.entId AS id, ent.name AS name, ent.entertainmentType AS type,
                   ent.openHours AS openHours, ent.address AS address, ent.ticketPrice AS budget,
                   ent.imageUrl AS imageUrl, ent.description AS description,
                   loc.locationId AS locationId, loc.name AS locationName
            ORDER BY ent.name
        """)
        return ents if ents is not None else []
    except Exception as e:
        logger.error(f"Error querying entertainments from Neo4j: {e}")
        raise HTTPException(status_code=503, detail="Database service temporarily unavailable")
