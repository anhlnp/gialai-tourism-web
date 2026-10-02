"""
Đại Ngàn Chạm Biển Xanh — FastAPI Backend
Smart Tourism API powered by Neo4j Knowledge Graph.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

import os

load_dotenv()

app = FastAPI(
    title="Du Lịch Gia Lai — Knowledge Graph API",
    description="Smart Tourism API powered by Neo4j Knowledge Graph & Fulltext/Semantic Search",
    version="1.0.0",
)

# CORS — cho phép frontend truy cập (dev + production)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
]
# Thêm Vercel production URL từ biến môi trường
extra_origins = os.getenv("CORS_ORIGINS", "")
if extra_origins:
    allowed_origins.extend([o.strip() for o in extra_origins.split(",") if o.strip()])
# Mặc định cho phép tất cả subdomain Vercel
allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cho phép tất cả origins (Vercel + localhost)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from routers.locations import router as locations_router
from routers.dishes import router as dishes_router
from routers.accommodations import router as accommodations_router
from routers.planner import router as planner_router
from routers.chat import router as chat_router
from routers.search import router as search_router

app.include_router(locations_router)
app.include_router(dishes_router)
app.include_router(accommodations_router)
app.include_router(planner_router)
app.include_router(chat_router)
app.include_router(search_router)


@app.get("/api/stats")
def get_stats():
    """Thống kê tổng quan cho trang chủ."""
    try:
        from core.neo4j_driver import run_query_single
        stats = run_query_single("""
            MATCH (loc:Location) WITH count(loc) AS locations
            MATCH (dish:Dish) WITH locations, count(dish) AS dishes
            MATCH (acc:Accommodation) WITH locations, dishes, count(acc) AS stays
            MATCH (d:District) WITH locations, dishes, stays, count(d) AS districts
            RETURN locations, dishes, stays, districts
        """)
        if stats and stats.get("locations", 0) > 0:
            return stats
    except Exception:
        pass

    import json, os
    cur = os.path.dirname(os.path.abspath(__file__))
    d_path = os.path.join(cur, "data")
    loc_len, dish_len, stay_len, dist_len = 30, 6, 6, 11
    try:
        with open(os.path.join(d_path, "locations.json"), encoding="utf-8") as f:
            loc_len = len(json.load(f))
        with open(os.path.join(d_path, "dishes.json"), encoding="utf-8") as f:
            dish_len = len(json.load(f))
        with open(os.path.join(d_path, "accommodations.json"), encoding="utf-8") as f:
            stay_len = len(json.load(f))
        with open(os.path.join(d_path, "districts.json"), encoding="utf-8") as f:
            dist_len = len(json.load(f))
    except Exception:
        pass
    return {"locations": loc_len, "dishes": dish_len, "stays": stay_len, "districts": dist_len}


@app.get("/api/featured")
def get_featured():
    """Điểm đến nổi bật cho trang chủ."""
    try:
        from core.neo4j_driver import run_query
        locations = run_query("""
            MATCH (loc:Location)-[:LOCATED_IN]->(d:District)
            OPTIONAL MATCH (u:User)-[r:RATED]->(loc)
            WITH loc, d, avg(toFloat(r.rating)) AS rating
            RETURN loc.locationId AS id, loc.name AS name, loc.imageUrl AS imageUrl,
                   loc.description AS description, d.name AS district,
                   loc.ticketPrice AS budget, round(coalesce(rating, loc.ratingAvg, 4.8), 1) AS rating
            ORDER BY rating DESC LIMIT 8
        """)
        dishes = run_query("""
            MATCH (dish:Dish)
            RETURN dish.dishId AS id, dish.name AS name, dish.imageUrl AS imageUrl,
                   dish.priceRange AS budget
            ORDER BY dish.name LIMIT 6
        """)
        if locations and dishes:
            return {"locations": locations, "dishes": dishes}
    except Exception:
        pass

    import json, os
    cur = os.path.dirname(os.path.abspath(__file__))
    d_path = os.path.join(cur, "data")
    locs, dishes, dists = [], [], {}
    try:
        with open(os.path.join(d_path, "districts.json"), encoding="utf-8") as f:
            for d in json.load(f):
                dists[d["districtId"]] = d["name"]
        with open(os.path.join(d_path, "locations.json"), encoding="utf-8") as f:
            for l in json.load(f)[:8]:
                locs.append({
                    "id": l["locationId"],
                    "name": l["name"],
                    "imageUrl": l["imageUrl"],
                    "description": l["description"],
                    "district": dists.get(l.get("districtId"), "Gia Lai"),
                    "budget": l.get("ticketPrice", 0),
                    "rating": l.get("ratingAvg", 4.8)
                })
        with open(os.path.join(d_path, "dishes.json"), encoding="utf-8") as f:
            for d in json.load(f)[:6]:
                dishes.append({
                    "id": d["dishId"],
                    "name": d["name"],
                    "imageUrl": d["imageUrl"],
                    "budget": d.get("priceRange", "")
                })
    except Exception:
        pass
    return {"locations": locs, "dishes": dishes}



@app.get("/api/health")
def health_check():
    """Health check + Neo4j connectivity."""
    try:
        from core.neo4j_driver import get_driver
        get_driver().verify_connectivity()
        return {"status": "ok", "neo4j": "connected"}
    except Exception as e:
        return {"status": "error", "neo4j": str(e)}
