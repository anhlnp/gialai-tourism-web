"""
Search Router — Các API Tìm kiếm Toàn văn, Ngữ nghĩa Vector Embedding và Thông tin Bổ sung.
"""
from fastapi import APIRouter, Query
from typing import Optional, List
from core.search_engine import (
    fulltext_search,
    semantic_search,
    hybrid_search,
    get_location_enrichment
)

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.get("/fulltext")
def search_fulltext(
    q: str = Query(..., min_length=1, description="Từ khóa tìm kiếm toàn văn"),
    limit: int = Query(10, ge=1, le=50)
):
    """Tìm kiếm toàn văn (Fulltext Search) trên danh thắng Gia Lai."""
    return fulltext_search(q, limit=limit)

@router.get("/semantic")
def search_semantic(
    q: str = Query(..., min_length=1, description="Câu hỏi hoặc mô tả ngữ nghĩa du lịch"),
    limit: int = Query(10, ge=1, le=50)
):
    """Tìm kiếm ngữ nghĩa theo Vector Embedding (Semantic Search)."""
    return semantic_search(q, limit=limit)

@router.get("/hybrid")
def search_hybrid_endpoint(
    q: str = Query(..., min_length=1, description="Nội dung tìm kiếm kết hợp"),
    limit: int = Query(10, ge=1, le=50),
    alpha: float = Query(0.5, ge=0.0, le=1.0, description="Trọng số Fulltext (0.0: thuần Semantic, 1.0: thuần Fulltext)")
):
    """Tìm kiếm kết hợp (Hybrid Search: Fulltext + Semantic Embedding)."""
    return hybrid_search(q, limit=limit, alpha=alpha)

@router.get("/enrichment/{location_id}")
def get_enrichment(location_id: str):
    """Lấy thông tin bổ sung kết nối: Sự kiện lễ hội, ẩm thực quán ngon, cơ sở lưu trú, điểm vui chơi."""
    return get_location_enrichment(location_id)
