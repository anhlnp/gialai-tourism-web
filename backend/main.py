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
from routers.events import router as events_router

app.include_router(locations_router)
app.include_router(dishes_router)
app.include_router(accommodations_router)
app.include_router(planner_router)
app.include_router(chat_router)
app.include_router(search_router)
from fastapi import FastAPI, HTTPException

app.include_router(events_router)


@app.get("/api/stats")
def get_stats():
    """Thống kê tổng quan trực tiếp từ CSDL đồ thị Neo4j."""
    try:
        from core.neo4j_driver import run_query_single
        stats = run_query_single("""
            MATCH (loc:Location) WITH count(loc) AS locations
            MATCH (dish:Dish) WITH locations, count(dish) AS dishes
            MATCH (acc:Accommodation) WITH locations, dishes, count(acc) AS stays
            MATCH (d:District) WITH locations, dishes, stays, count(d) AS districts
            RETURN locations, dishes, stays, districts
        """)
        if stats is not None:
            return stats
        raise HTTPException(status_code=503, detail="Không thể truy xuất số liệu thống kê từ Neo4j")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Dịch vụ cơ sở dữ liệu Neo4j không khả dụng: {type(e).__name__}"
        )


@app.get("/api/featured")
def get_featured():
    """Điểm đến nổi bật và món ngon trực tiếp từ Neo4j."""
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
        return {"locations": locations or [], "dishes": dishes or []}
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Dịch vụ cơ sở dữ liệu Neo4j không khả dụng: {type(e).__name__}"
        )


@app.get("/api/health")
def health_check():
    """Health check + Neo4j connectivity."""
    try:
        from core.neo4j_driver import get_driver
        get_driver().verify_connectivity()
        return {"status": "ok", "neo4j": "connected"}
    except Exception as e:
        return {"status": "error", "neo4j": str(e)}

