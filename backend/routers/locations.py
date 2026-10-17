"""
Locations Router — Điểm tham quan du lịch tỉnh Gia Lai (Chính thống).
Truy vấn trực tiếp từ CSDL đồ thị Neo4j Aura.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict, Any
from core.neo4j_driver import run_query, run_query_single

router = APIRouter(prefix="/api/locations", tags=["Locations"])


@router.get("")
def list_locations(
    region: Optional[str] = Query(None, description="Filter by region/district"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    search: Optional[str] = Query(None, description="Search by name"),
    limit: int = Query(50, ge=1, le=200),
):
    """Danh sách điểm đến — dùng cho trang Explore (Truy vấn Neo4j trực tiếp)."""
    try:
        conditions = []
        params: dict = {"limit": limit}

        if region:
            conditions.append("(d.name = $region OR loc.geographic_region = $region OR loc.legacy_province = $region OR d.geographic_region = $region)")
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
        OPTIONAL MATCH (loc)-[:BELONGS_TO]->(cat:Category)
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
               loc.imageUrls AS imageUrls,
               loc.bestTimeOfDay AS bestTime,
               loc.ticketPrice AS budget,
               d.name AS district,
               cat.name AS category,
               coalesce(loc.legacy_province, 'Gia Lai') AS legacyProvince,
               coalesce(loc.geographic_region, 'Cao nguyên') AS geographicRegion,
               avgRating,
               reviewCount
        ORDER BY avgRating DESC, reviewCount DESC
        LIMIT $limit
        """
        res = run_query(cypher, params)
        return res if res is not None else []
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Dịch vụ cơ sở dữ liệu Neo4j không khả dụng: {type(e).__name__}"
        )


@router.get("/categories")
def list_categories():
    """Danh sách loại hình tham quan chính thống từ Neo4j."""
    try:
        res = run_query("""
            MATCH (c:Category)
            OPTIONAL MATCH (loc:Location)-[:BELONGS_TO]->(c)
            RETURN c.categoryId AS id, c.name AS name, c.description AS description, count(loc) AS locationCount
            ORDER BY c.name
        """)
        return res if res is not None else []
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Dịch vụ cơ sở dữ liệu Neo4j không khả dụng: {type(e).__name__}"
        )


@router.get("/districts")
def list_districts():
    """Danh sách quận/huyện/thị/thành phố tỉnh Gia Lai (toàn tỉnh mới) từ Neo4j."""
    try:
        cypher = """
        MATCH (d:District)
        OPTIONAL MATCH (loc:Location)-[:LOCATED_IN]->(d)
        RETURN d.districtId AS id, d.name AS name,
               coalesce(d.geographic_region, 'Cao nguyên') AS region,
               coalesce(d.legacy_province, 'Gia Lai') AS province,
               count(loc) AS locationCount
        ORDER BY d.name
        """
        res = run_query(cypher)
        return res if res is not None else []
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Dịch vụ cơ sở dữ liệu Neo4j không khả dụng: {type(e).__name__}"
        )


@router.get("/{location_id}")
def get_location_detail(location_id: str):
    """Chi tiết 1 điểm đến — kèm thông tin quan hệ trên Đồ thị Tri thức Neo4j."""
    try:
        info = run_query_single("""
            MATCH (loc:Location {locationId: $id})-[:LOCATED_IN]->(d:District)
            OPTIONAL MATCH (loc)-[:BELONGS_TO]->(cat:Category)
            OPTIONAL MATCH (u:User)-[r:RATED]->(loc)
            WITH loc, d, cat, round(avg(toFloat(r.rating)), 1) AS userRatingAvg, count(r) AS reviewCount
            RETURN loc.locationId AS id, loc.name AS name, loc.description AS description,
                   loc.address AS address, loc.latitude AS lat, loc.longitude AS lng,
                   loc.imageUrl AS imageUrl, loc.imageUrls AS imageUrls,
                   loc.bestTimeOfDay AS bestTime, loc.ticketPrice AS budget,
                   d.name AS district, cat.name AS category,
                   coalesce(loc.legacy_province, 'Gia Lai') AS legacyProvince,
                   coalesce(loc.geographic_region, 'Cao nguyên') AS geographicRegion,
                   loc.sourceUrl AS sourceUrl,
                   loc.sourceName AS sourceName,
                   loc.licenseStatus AS licenseStatus,
                   loc.attribution AS attribution,
                   coalesce(userRatingAvg, loc.ratingAvg, 4.8) AS avgRating,
                   reviewCount
        """, {"id": location_id})

        if not info:
            raise HTTPException(status_code=404, detail="Không tìm thấy điểm đến trong CSDL Neo4j")

        # Nearby dishes
        dishes = run_query("""
            MATCH (loc:Location {locationId: $id})-[ne:NEAR_EATERY]->(dish:Dish)
            RETURN dish.dishId AS id, dish.name AS name, dish.description AS description,
                   dish.imageUrl AS imageUrl, dish.priceRange AS budget,
                   ne.distanceKm AS distanceKm
            ORDER BY ne.distanceKm ASC LIMIT 6
        """, {"id": location_id}) or []

        # Nearby stay
        stays = run_query("""
            MATCH (loc:Location {locationId: $id})-[ns:NEAR_STAY]->(acc:Accommodation)
            RETURN acc.accId AS id, acc.name AS name, acc.description AS description,
                   acc.imageUrl AS imageUrl, acc.pricePerNight AS budget,
                   ns.distanceKm AS distanceKm
            ORDER BY ns.distanceKm ASC LIMIT 6
        """, {"id": location_id}) or []

        # Events
        events = run_query("""
            MATCH (loc:Location {locationId: $id})-[:HAS_EVENT]->(evt:Event)
            RETURN evt.eventId AS id, evt.name AS name, evt.monthOccurred AS time,
                   evt.highlightActivity AS highlight, evt.description AS description
        """, {"id": location_id}) or []

        # Entertainment
        entertainments = run_query("""
            MATCH (loc:Location {locationId: $id})-[:NEAR_ENTERTAINMENT]->(ent:Entertainment)
            RETURN ent.entId AS id, ent.name AS name, ent.entertainmentType AS type,
                   ent.openHours AS openHours, ent.imageUrl AS imageUrl
        """, {"id": location_id}) or []

        # Connected inter-regional corridors
        corridors = run_query("""
            MATCH (loc:Location {locationId: $id})-[c:CONNECTS_TO]-(conn:Location)
            RETURN conn.locationId AS id, conn.name AS name, conn.imageUrl AS imageUrl,
                   c.corridor AS corridor, c.distanceKm AS distanceKm, c.route AS route
        """, {"id": location_id}) or []

        return {
            **info,
            "nearbyDishes": dishes,
            "nearbyStays": stays,
            "events": events,
            "entertainments": entertainments,
            "corridors": corridors
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Dịch vụ cơ sở dữ liệu Neo4j không khả dụng: {type(e).__name__}"
        )
