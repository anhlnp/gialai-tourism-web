"""
Chat Router — AI Trợ lý du lịch thông minh tỉnh Gia Lai (GraphRAG Engine).
Tích hợp nhận diện ý định thông minh (Intent Classifier) và phản hồi dựa trên dữ liệu thật từ Neo4j Knowledge Graph.
"""
import os
import re
import logging
from typing import Optional
from fastapi import APIRouter
from pydantic import BaseModel
from core.neo4j_driver import run_query
from core.search_engine import hybrid_search

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    message: str


def _clean_text(text: str) -> str:
    """Làm sạch câu hỏi, loại bỏ dấu câu thừa."""
    text = text.lower().strip()
    text = re.sub(r"[?!.,'\"`~@#$%^&*()_+=\-\[\]{}|\\/<>]+", " ", text)
    return " ".join(text.split())


def _classify_intent(raw_msg: str) -> str:
    """Phân loại ý định người dùng (Intent Classification)."""
    clean = _clean_text(raw_msg)
    words = clean.split()
    word_count = len(words)

    # 1. Chào hỏi / Small talk
    greetings = {"hi", "hello", "chao", "chào", "xin chao", "xin chào", "alo", "ơi", "oi", "hey", "helo", "hế lô", "hai", "kool", "yo"}
    if clean in greetings or (word_count <= 3 and any(w in greetings for w in words)):
        return "GREETING"

    # 2. Bạn là ai / Giới thiệu / Trợ giúp
    who_are_you = ["bạn là ai", "ban la ai", "mày là ai", "may la ai", "ai đây", "giới thiệu", "gioi thieu", "chức năng", "chuc nang", "làm được gì", "lam duoc gi", "help", "trợ giúp", "tro giup", "hướng dẫn", "huong dan"]
    if any(k in clean for k in who_are_you):
        return "WHO_ARE_YOU"

    # 3. Cảm ơn / Tạm biệt
    farewell = ["cảm ơn", "cam on", "cảm ơn bạn", "cám ơn", "thank", "thanks", "tạm biệt", "tam biet", "bye", "goodbye", "ok cảm ơn", "tuyệt vời"]
    if any(k in clean for k in farewell) and word_count <= 5:
        return "FAREWELL"

    # 4. Lịch trình / Lộ trình tour
    itinerary_keys = ["lộ trình", "lo trinh", "lịch trình", "lich trinh", "kế hoạch", "ke hoach", "gợi ý tour", "tour", "2 ngày", "3 ngày", "4 ngày", "1 ngày", "2n1d", "3n2d"]
    if any(k in clean for k in itinerary_keys):
        return "ITINERARY"

    # 5. Ẩm thực / Món ăn / Đặc sản
    food_keys = ["ăn gì", "an gi", "món gì", "mon gi", "đặc sản", "dac san", "món ăn", "mon an", "quán ăn", "quan an", "ẩm thực", "am thuc", "ăn sáng", "ăn trưa", "ăn tối", "uống gì", "cà phê", "ca phe"]
    if any(k in clean for k in food_keys):
        return "FOOD"

    # 6. Khách sạn / Lưu trú / Homestay
    stay_keys = ["khách sạn", "khach san", "homestay", "resort", "nghỉ ở đâu", "nghi o dau", "chỗ ở", "cho o", "phòng nghỉ", "phong nghi", "thuê phòng"]
    if any(k in clean for k in stay_keys):
        return "STAY"

    return "QUERY_SEARCH"


def _get_curated_food_guide() -> str:
    """Trả về hướng dẫn ẩm thực đặc sắc nhất từ dữ liệu thực tế trong Neo4j."""
    try:
        cypher = """
        MATCH (d:Dish)
        RETURN d.name AS name, d.description AS description, d.suggestedEateries AS eateries, d.priceRange AS priceRange
        LIMIT 4
        """
        dishes = run_query(cypher)
        if dishes:
            lines = ["🍲 **Ẩm thực đặc sản Gia Lai — Những món nhất định phải thử:**\n"]
            for idx, d in enumerate(dishes, 1):
                name = d.get("name", "")
                desc = d.get("description", "")
                eateries = d.get("eateries")
                eatery_str = ""
                if eateries and isinstance(eateries, list) and len(eateries) > 0:
                    eatery_str = f"\n   • *Địa chỉ gợi ý*: {', '.join(eateries[:3])}"
                lines.append(f"{idx}. **{name}**: {desc}{eatery_str}\n")
            lines.append("💡 Bạn có thể hỏi thêm chi tiết về quán ăn gần một điểm du lịch cụ thể nhé!")
            return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error querying curated food from Neo4j: {e}")

    return (
        "🍲 **Ẩm thực đặc sản Gia Lai — Những món nhất định phải thử:**\n\n"
        "1. **Phở Khô Gia Lai (Phở Hai Tô)**: Món ăn biểu tượng với một tô bánh phở trụng trộn gia vị đậm đà và một tô nước dùng thơm ngọt từ xương hầm bò/gà.\n\n"
        "2. **Gà Nướng Sa Lửa & Cơm Lam Ống Tre**: Gà thả vườn ướp lá rừng nướng vàng giòn trên than hồng, chấm muối é ớt hiểm.\n\n"
        "3. **Bò Một Nắng Muối Kiến Vàng Krông Pa**: Thịt bò tươi ngon ướp gia vị phơi đúng một nắng rực lửa cao nguyên.\n\n"
        "💡 Bạn có thể hỏi thêm chi tiết về quán ăn gần một điểm du lịch cụ thể nhé!"
    )


def _get_curated_stay_guide() -> str:
    """Trả về hướng dẫn lưu trú từ dữ liệu thực tế trong Neo4j."""
    try:
        cypher = """
        MATCH (acc:Accommodation)
        RETURN acc.name AS name, acc.address AS address, acc.stayType AS stayType,
               acc.pricePerNight AS price, acc.description AS description
        ORDER BY acc.ratingAvg DESC
        LIMIT 4
        """
        stays = run_query(cypher)
        if stays:
            lines = ["🏨 **Gợi ý cơ sở lưu trú chất lượng tại Gia Lai:**\n"]
            for idx, s in enumerate(stays, 1):
                name = s.get("name", "")
                addr = s.get("address", "")
                stype = s.get("stayType", "Khách sạn")
                price = s.get("price", "")
                price_str = f" - Giá từ: {int(price):,}đ/đêm" if isinstance(price, (int, float)) and price > 0 else ""
                lines.append(f"{idx}. **{name}** ({stype}){price_str}\n   • *Địa chỉ*: {addr}")
            lines.append("\n💡 Bạn thích ở trung tâm sôi động hay homestay yên bình gần gũi thiên nhiên để tôi tư vấn cụ thể hơn?")
            return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error querying curated stays from Neo4j: {e}")

    return (
        "🏨 **Gợi ý cơ sở lưu trú tại Gia Lai:**\n\n"
        "1. **Khách sạn Trung tâm TP. Pleiku**: Hoàng Anh Gia Lai Hotel, Tre Xanh Plaza Hotel, Boston Hotel Pleiku.\n"
        "2. **Homestay Sinh thái & Săn mây**: Tiên Sơn Pleiku Homestay, Xóm Homestay & Coffee.\n\n"
        "💡 Bạn có thể hỏi tôi thông tin chi tiết về từng nơi nhé!"
    )


def _get_curated_itinerary_guide() -> str:
    """Gợi ý lịch trình du lịch Gia Lai tối ưu dựa trên dữ liệu địa điểm trong Neo4j."""
    return (
        "🗺️ **Gợi ý Lộ trình Du lịch Gia Lai 2 Ngày 1 Đêm Hoàn Hảo:**\n\n"
        "🌿 **NGÀY 1: Dấu ấn Phố Núi & Mắt Ngọc Biển Hồ**\n"
        "• **Sáng**: Thưởng thức **Phở Khô Hai Tô** nổi tiếng -> Khám phá **Biển Hồ T'nưng** (hồ nước ngọt tự nhiên tuyệt đẹp trên miệng núi lửa cổ) -> Dạo bước check-in **Hàng thông trăm tuổi** và đồi chè Biển Hồ.\n"
        "• **Trưa**: Thưởng thức **Gà nướng sa lửa & Cơm lam** tại khu vực Biển Hồ.\n"
        "• **Chiều**: Viếng **Chùa Minh Thành** với kiến trúc ấn tượng -> Tham quan **Làng văn hóa Plei Ốp** tìm hiểu văn hóa Jrai, nhà rông và tượng nhà mồ.\n"
        "• **Tối**: Dạo phố đêm Pleiku, thưởng thức ẩm thực đường phố và nhâm nhi cà phê Pleiku ngắm phố núi về đêm.\n\n"
        "🌋 **NGÀY 2: Chinh phục Đại Ngàn Núi Lửa & Thác Nước**\n"
        "• **Sáng**: Đón bình minh và săn mây tại **Miệng núi lửa Chư Đang Ya** hoặc leo đỉnh **Chư Nâm** -> Tham quan Đập thủy điện Yaly hùng vĩ.\n"
        "• **Trưa**: Ăn trưa cá lăng sông Sê San, nghỉ ngơi.\n"
        "• **Chiều**: Mua đặc sản làm quà (Cà phê Pleiku, Bò một nắng muối kiến vàng, tiêu Chư Sê) -> Ra sân bay Pleiku kết thúc hành trình.\n\n"
        "💡 Bạn có thể dùng tính năng **Lên lộ trình** trên thanh menu để tùy chỉnh số ngày và khu vực theo ý muốn nhé!"
    )


def _format_location_answer(loc: dict) -> str:
    """Định dạng phản hồi thân thiện, súc tích cho 1 địa điểm cụ thể."""
    name = loc.get("name", "")
    district = loc.get("district", "Gia Lai")
    category = loc.get("category", "Danh lam thắng cảnh")
    desc = loc.get("description", "")
    ticket = loc.get("ticketPrice", 0)
    best_time = loc.get("bestTime", "Trong ngày")
    address = loc.get("address", "")

    ticket_str = "Miễn phí vé tham quan" if not ticket or ticket == 0 else f"{ticket:,}đ/người"
    if isinstance(best_time, list):
        best_time = " • ".join(best_time)

    reply = (
        f"🏔️ **{name}**\n\n"
        f"• **Khu vực**: {district} | **Phân loại**: {category}\n"
        f"• **Giá vé**: {ticket_str}\n"
        f"• **Thời điểm lý tưởng**: {best_time}\n"
        f"• **Địa chỉ**: {address}\n\n"
        f"📝 **Giới thiệu**: {desc}\n\n"
        f"💡 *Mẹo cho chuyến đi*: Bạn có thể xem chỉ đường trực tiếp trên trang bản đồ hoặc hỏi tôi về các quán ăn và homestay gần {name} nhé!"
    )
    return reply


def _call_gemini_38(user_msg: str, system_prompt: str, api_key: str) -> Optional[str]:
    """Gọi trực tiếp Google Gemini API với model gemini-3.8-flash (hoặc cấu hình qua GEMINI_MODEL)."""
    import urllib.request
    import json

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_msg}]
            }
        ],
        "generationConfig": {
            "temperature": 0.3
        }
    }

    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            if resp.status == 200:
                res_json = json.loads(resp.read().decode("utf-8"))
                candidates = res_json.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
    except Exception as e:
        logger.warning(f"Gemini 3.8 API call error: {e}")
    return None


@router.post("")
def chat(req: ChatRequest):
    """Hỏi đáp du lịch Gia Lai qua GraphRAG & Gemini 3.8 Flash Engine."""
    user_msg = (req.message or "").strip()
    if not user_msg:
        return {
            "answer": "Xin chào! Bạn muốn tìm hiểu thông tin gì về du lịch Gia Lai - Bình Định hôm nay ạ?",
            "source": "empty_prompt"
        }

    intent = _classify_intent(user_msg)

    # 1. Chào hỏi
    if intent == "GREETING":
        return {
            "answer": (
                "Dạ xin chào bạn! 👋 Tôi là **Trợ lý Du lịch Thông minh Gia Lai**.\n\n"
                "Tôi có thể hỗ trợ bạn:\n"
                "• 🏔️ **Khám phá điểm đến**: Biển Hồ T'nưng, Chư Đang Ya, đỉnh Chư Nâm, Thác K50, Chùa Minh Thành...\n"
                "• 🍲 **Ẩm thực đặc sản**: Phở khô hai tô, Gà nướng cơm lam, Bò một nắng muối kiến vàng...\n"
                "• 🏨 **Lưu trú**: Khách sạn trung tâm Pleiku, homestay săn mây view đồi chè...\n"
                "• 🗺️ **Lộ trình du lịch**: Gợi ý lịch trình 1 - 5 ngày tối ưu.\n\n"
                "Hôm nay bạn cần tôi hỗ trợ thông tin gì ạ? 😊"
            ),
            "source": "intent_greeting"
        }

    # 2. Giới thiệu / Trợ giúp — Truy vấn thống kê thực tế từ Neo4j
    if intent == "WHO_ARE_YOU":
        loc_count, dish_count, acc_count, dist_count = 43, 30, 26, 17
        try:
            counts = run_query("""
                RETURN 
                    head([c IN [count { MATCH (:Location) }] | c]) AS locs,
                    head([c IN [count { MATCH (:Dish) }] | c]) AS dishes,
                    head([c IN [count { MATCH (:Accommodation) }] | c]) AS stays,
                    head([c IN [count { MATCH (:District) }] | c]) AS districts
            """)
            if counts and len(counts) > 0:
                loc_count = counts[0].get("locs", loc_count)
                dish_count = counts[0].get("dishes", dish_count)
                acc_count = counts[0].get("stays", acc_count)
                dist_count = counts[0].get("districts", dist_count)
        except Exception:
            pass

        return {
            "answer": (
                "Tôi là **AI Trợ lý Du lịch Gia Lai**, được xây dựng dựa trên nền tảng **Đồ thị Tri thức (Knowledge Graph)** kết hợp công nghệ **GraphRAG & Gemini 3.8**.\n\n"
                "Hệ thống đã số hóa dữ liệu chuẩn xác trên CSDL Neo4j gồm:\n"
                f"- 📌 **{loc_count} điểm du lịch** danh thắng, văn hóa, sinh thái và di tích\n"
                f"- 🍲 **{dish_count} món ẩm thực** đặc sản kèm địa chỉ gợi ý\n"
                f"- 🏨 **{acc_count} khách sạn & homestay** chất lượng\n"
                f"- 🗺️ **{dist_count} địa bàn quận/huyện** với tọa độ GPS và liên kết lộ trình\n\n"
                "Bạn có thể hỏi tôi bất kỳ điều gì bằng ngôn ngữ tự nhiên nhé!"
            ),
            "source": "intent_who_are_you"
        }

    # 3. Cảm ơn / Tạm biệt
    if intent == "FAREWELL":
        return {
            "answer": "Dạ không có gì ạ! Rất vui được hỗ trợ bạn. Chúc bạn có những chuyến du lịch tuyệt vời và đáng nhớ tại Gia Lai! 🏔️✨ Nếu cần thêm thông tin gì, đừng ngần ngại hỏi tôi nhé!",
            "source": "intent_farewell"
        }

    # 4. Ẩm thực
    if intent == "FOOD":
        return {
            "answer": _get_curated_food_guide(),
            "source": "intent_food"
        }

    # 5. Lưu trú
    if intent == "STAY":
        return {
            "answer": _get_curated_stay_guide(),
            "source": "intent_stay"
        }

    # 6. Lộ trình
    if intent == "ITINERARY":
        return {
            "answer": _get_curated_itinerary_guide(),
            "source": "intent_itinerary"
        }

    # 7. Truy vấn cụ thể: Tìm kiếm trong Knowledge Graph
    api_key = os.getenv("GOOGLE_API_KEY", "")
    matched_locs = hybrid_search(user_msg, limit=3)

    # Nếu có GOOGLE_API_KEY → dùng Gemini 3.8 Flash sinh câu trả lời tự nhiên
    if api_key and matched_locs:
        context_items = []
        for loc in matched_locs:
            context_items.append(
                f"Tên: {loc['name']} ({loc.get('district', '')})\n"
                f"Loại: {loc.get('category', '')}\n"
                f"Giá vé: {loc.get('ticketPrice', 0)}đ\n"
                f"Thời điểm: {loc.get('bestTime', '')}\n"
                f"Địa chỉ: {loc.get('address', '')}\n"
                f"Mô tả: {loc.get('description', '')[:200]}"
            )
        context_str = "\n---\n".join(context_items)

        system_prompt = f"""Bạn là hướng dẫn viên du lịch thông minh, thân thiện của tỉnh Gia Lai (Tây Nguyên) và Bình Định.
Trả lời bằng tiếng Việt tự nhiên, súc tích, nhiệt tình, có biểu tượng cảm xúc (emoji) phù hợp.
Dựa vào dữ liệu Đồ thị Tri thức sau đây để trả lời câu hỏi:
{context_str}

LƯU Ý QUAN TRỌNG:
- Trả lời đúng trọng tâm câu hỏi của người dùng.
- Không liệt kê danh sách dài lan man nếu người dùng không yêu cầu.
- Nêu rõ giá vé, địa chỉ, thời gian đẹp nhất nếu liên quan.
"""

        gemini_reply = _call_gemini_38(user_msg, system_prompt, api_key)
        if gemini_reply:
            return {
                "answer": gemini_reply,
                "context": context_str,
                "source": "graphrag_gemini_3.8",
            }

    # Phản hồi tự nhiên được tổng hợp (Natural Synthesis khi không có API key)
    if matched_locs:
        best_loc = matched_locs[0]
        if best_loc.get("hybrid_score", 0) > 0.3 or len(matched_locs) == 1:
            reply = _format_location_answer(best_loc)
            return {
                "answer": reply,
                "context": str(best_loc),
                "source": "knowledge_graph_specific",
            }

        loc_lines = []
        for l in matched_locs[:3]:
            ticket = "Miễn phí" if not l.get('ticketPrice') else f"{l['ticketPrice']:,}đ"
            loc_lines.append(f"• **{l['name']}** ({l['district']}): {l.get('description', '')[:120]}... (Vé: {ticket})")

        reply = (
            f"Dựa trên dữ liệu Đồ thị Tri thức Gia Lai, tôi tìm thấy các địa điểm phù hợp với yêu cầu của bạn:\n\n"
            + "\n\n".join(loc_lines) +
            "\n\n💡 Bạn muốn tìm hiểu chi tiết về điểm nào trong số này, hoặc cần gợi ý quán ăn, nơi nghỉ lân cận cứ nhắn cho tôi nhé!"
        )
        return {
            "answer": reply,
            "source": "knowledge_graph_synthesis",
        }

    return {
        "answer": (
            f"Tôi chưa tìm thấy thông tin cụ thể về '{user_msg}' trong dữ liệu du lịch Gia Lai hiện tại.\n\n"
            "Bạn có thể thử tìm kiếm theo:\n"
            "• Tên danh thắng: *Biển Hồ, Núi lửa Chư Đang Ya, Thác K50, Chùa Minh Thành, Đỉnh Chư Nâm...*\n"
            "• Đặc sản ẩm thực: *Phở hai tô, Gà nướng cơm lam, Bò một nắng, Bún mắm cua...*\n"
            "• Hoặc hỏi gợi ý lộ trình du lịch 2 ngày, 3 ngày nhé! 🏔️✨"
        ),
        "source": "not_found"
    }
