"""
Chat Router — AI Trợ lý du lịch thông minh tỉnh Gia Lai (GraphRAG Engine).
"""
import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from core.search_engine import hybrid_search, get_location_enrichment

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    message: str


def _get_graph_context(question: str) -> str:
    """Tìm context từ Knowledge Graph bằng Hybrid Search và mở rộng Subgraph thông tin bổ sung."""
    context_parts = []

    # 1. Tìm các điểm đến liên quan nhất bằng Hybrid Search (Fulltext + Embedding)
    matched_locs = hybrid_search(question, limit=4)
    if matched_locs:
        context_parts.append("=== ĐIỂM DU LỊCH GIA LAI LIÊN QUAN ===")
        for loc in matched_locs:
            context_parts.append(
                f"• {loc['name']} ({loc['district']}) - Phân loại: {loc['category']}\n"
                f"  - Giá vé: {loc.get('ticketPrice', 0):,}đ | Thời điểm đẹp: {loc.get('bestTime', 'Trong ngày')}\n"
                f"  - Địa chỉ: {loc.get('address', '')}\n"
                f"  - Giới thiệu: {loc.get('description', '')[:250]}"
            )

            # Lấy thông tin bổ sung kết nối
            enr = get_location_enrichment(loc["id"])
            if enr.get("events"):
                evt_names = [f"{e['name']} ({e['monthOccurred']})" for e in enr["events"]]
                context_parts.append(f"  - [Sự kiện/Lễ hội bổ sung]: {'; '.join(evt_names)}")
            if enr.get("entertainments"):
                ent_names = [e["name"] for e in enr["entertainments"]]
                context_parts.append(f"  - [Điểm vui chơi lân cận]: {', '.join(ent_names)}")
            if enr.get("nearbyDishes"):
                dish_names = [d["name"] for d in enr["nearbyDishes"][:2]]
                context_parts.append(f"  - [Đặc sản/Quán ăn gợi ý]: {', '.join(dish_names)}")
            if enr.get("nearbyStays"):
                stay_names = [f"{s['name']} ({s['stayType']})" for s in enr["nearbyStays"][:2]]
                context_parts.append(f"  - [Nơi lưu trú gợi ý]: {', '.join(stay_names)}")

    # 2. Đọc thêm danh sách đặc sản ẩm thực chung nếu câu hỏi nhắc đến ăn uống
    q_low = question.lower()
    if any(k in q_low for k in ["ăn", "uống", "món", "đặc sản", "quán"]):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        dish_file = os.path.join(current_dir, "..", "data", "dishes.json")
        if os.path.exists(dish_file):
            with open(dish_file, "r", encoding="utf-8") as f:
                dishes = json.load(f)[:4]
                context_parts.append("\n=== ẨM THỰC ĐẶC SẢN GIA LAI ===")
                for d in dishes:
                    context_parts.append(f"• {d['name']} ({d['tasteType']}): {d['description'][:150]} - Quán gợi ý: {d['recommendedPlaces']}")

    # 3. Đọc thêm cơ sở lưu trú nếu câu hỏi nhắc đến ngủ nghỉ, khách sạn, homestay
    if any(k in q_low for k in ["nghỉ", "ở", "khách sạn", "homestay", "chỗ"]):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        stay_file = os.path.join(current_dir, "..", "data", "accommodations.json")
        if os.path.exists(stay_file):
            with open(stay_file, "r", encoding="utf-8") as f:
                stays = json.load(f)[:4]
                context_parts.append("\n=== CƠ SỞ LƯU TRÚ GIA LAI ===")
                for s in stays:
                    context_parts.append(f"• {s['name']} ({s['stayType']}) - Giá: {s['pricePerNight']} - Đ/c: {s['address']}")

    return "\n\n".join(context_parts) if context_parts else "Chưa tìm thấy thông tin cụ thể trong Đồ thị Tri thức."


@router.post("")
def chat(req: ChatRequest):
    """Hỏi đáp du lịch Gia Lai qua GraphRAG."""
    api_key = os.getenv("GOOGLE_API_KEY", "")

    # Lấy context đồ thị tri thức
    context = _get_graph_context(req.message)

    # Nếu có GOOGLE_API_KEY → dùng Gemini LLM sinh câu trả lời
    if api_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import HumanMessage, SystemMessage

            llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=api_key,
                temperature=0.3,
            )

            system_prompt = f"""Bạn là trợ lý du lịch thông minh cho tỉnh Gia Lai.
Nhiệm vụ của bạn là hỗ trợ du khách khám phá các điểm tham quan, ẩm thực đặc sản, cơ sở lưu trú và sự kiện văn hóa chính thống của tỉnh Gia Lai.
Luôn trả lời bằng tiếng Việt thân thiện, rõ ràng, dựa trên dữ liệu chuẩn xác từ Đồ thị Tri thức bên dưới.
Nếu có thông tin bổ sung (ẩm thực, khách sạn, sự kiện), hãy tư vấn trọn gói cho du khách.

Dữ liệu từ Đồ thị Tri thức (Knowledge Graph):
{context}
"""

            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=req.message),
            ])

            return {
                "answer": response.content,
                "context": context,
                "source": "graphrag_gemini",
            }
        except Exception as e:
            pass

    # Phản hồi tự nhiên được tổng hợp từ Graph Context (Fallback thông minh không cần API key)
    formatted_reply = (
        f"Dạ chào bạn! Dựa trên dữ liệu Đồ thị Tri thức Du lịch Tỉnh Gia Lai, tôi xin gợi ý thông tin cho bạn như sau:\n\n"
        f"{context}\n\n"
        f"💡 Bạn có thể hỏi thêm chi tiết về lộ trình di chuyển, quán ăn đặc sản (Phở khô hai tô, Gà nướng cơm lam) hoặc đặt homestay view Biển Hồ nhé!"
    )

    return {
        "answer": formatted_reply,
        "context": context,
        "source": "knowledge_graph_synthesis",
    }
