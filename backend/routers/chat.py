"""
Chat Router — AI Trợ lý du lịch thông minh tỉnh Gia Lai (GraphRAG Engine).
Tích hợp nhận diện ý định thông minh (Intent Classifier) và phản hồi tự nhiên chuẩn bản ngữ.
"""
import os
import json
import re
from fastapi import APIRouter
from pydantic import BaseModel
from core.search_engine import hybrid_search

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
    """Trả về hướng dẫn ẩm thực đặc sắc nhất Gia Lai từ dữ liệu chuẩn."""
    return (
        "🍲 **Ẩm thực đặc sản Gia Lai — Những món nhất định phải thử:**\n\n"
        "1. **Phở Khô Gia Lai (Phở Hai Tô)**: Món ăn biểu tượng với một tô bánh phở trụng trộn gia vị đậm đà và một tô nước dùng thơm ngọt từ xương hầm bò/gà.\n"
        "   • *Địa chỉ gợi ý*: Phở Nữ (Nguyễn Du), Phở Ngọc Sơn (Hùng Vương), Phở Tàu Lý (Trần Phú).\n\n"
        "2. **Gà Nướng Sa Lửa & Cơm Lam Ống Tre**: Gà thả vườn ướp lá rừng nướng vàng giòn trên than hồng, chấm muối é ớt hiểm, ăn cùng cơm lam dẻo thơm nướng ống tre.\n"
        "   • *Địa chỉ gợi ý*: Quán Gà nướng Pleiku Cơm Lam, Quán Bazan (Đường Wừu), Quán Ksor H'Nhao (Biển Hồ).\n\n"
        "3. **Bò Một Nắng Muối Kiến Vàng Krông Pa**: Thịt bò cỏ tươi ngon ướp gia vị phơi đúng một nắng rực lửa cao nguyên, nướng than rồi chấm muối trứng kiến vàng chua cay độc lạ.\n"
        "   • *Địa chỉ gợi ý*: Các cửa hàng đặc sản Krông Pa, Chợ Pleiku.\n\n"
        "4. **Bún Mắm Cua (Bún Cua Thối)**: Đặc sản độc đáo dành cho những ai thích khám phá ẩm thực bản địa với nước dùng cua đồng lên men đậm vị, ăn kèm da heo chiên giòn và ớt cay xè.\n"
        "   • *Địa chỉ gợi ý*: Bún mắm cua chợ đêm Pleiku, Quán Chi (Đường Phùng Hưng).\n\n"
        "💡 Bạn có thể hỏi thêm chi tiết về quán ăn gần một điểm du lịch cụ thể nhé!"
    )


def _get_curated_stay_guide() -> str:
    """Trả về hướng dẫn lưu trú chuẩn tại Gia Lai."""
    return (
        "🏨 **Gợi ý cơ sở lưu trú tốt nhất tại Gia Lai:**\n\n"
        "1. **Khách sạn Trung tâm Tiện nghi (TP. Pleiku):**\n"
        "   • **Hoàng Anh Gia Lai Hotel (4 sao)** — *1 Đường Phù Đổng*: Khách sạn sang trọng bậc nhất, view toàn cảnh phố núi, hồ bơi và buffet sáng chuẩn vị. Giá từ 950.000đ/đêm.\n"
        "   • **Boston Hotel Pleiku (3 sao)** — *212 Đường Phạm Văn Đồng*: Phong cách hiện đại, gần sân bay Pleiku, phòng ốc sạch sẽ, tiện nghi. Giá từ 550.000đ/đêm.\n\n"
        "2. **Homestay Sinh thái & Săn mây:**\n"
        "   • **Tiên Sơn Pleiku Homestay** — *Xã Tân Sơn (gần Biển Hồ)*: Không gian sân vườn xanh mát, view nhìn ra lòng hồ thơ mộng, thích hợp nghỉ dưỡng yên tĩnh. Giá từ 400.000đ/đêm.\n"
        "   • **XOM Homestay & Coffee** — *Khu vực Biển Hồ Chè*: View đồi chè xanh mướt, decor mộc mạc ấm áp phong cách Tây Nguyên. Giá từ 350.000đ/đêm.\n\n"
        "💡 Bạn thích ở trung tâm sôi động hay homestay yên bình gần gũi thiên nhiên để tôi tư vấn cụ thể hơn?"
    )


def _get_curated_itinerary_guide() -> str:
    """Gợi ý lịch trình du lịch Gia Lai 2 ngày 1 đêm tối ưu."""
    return (
        "🗺️ **Gợi ý Lộ trình Du lịch Gia Lai 2 Ngày 1 Đêm Hoàn Hảo:**\n\n"
        "🌿 **NGÀY 1: Dấu ấn Phố Núi & Mắt Ngọc Biển Hồ**\n"
        "• **Sáng**: Thưởng thức **Phở Khô Hai Tô** nổi tiếng -> Khám phá **Biển Hồ T'nưng** (hồ nước ngọt tự nhiên tuyệt đẹp trên miệng núi lửa cổ) -> Dạo bước check-in **Hàng thông trăm tuổi** và đồi chè Biển Hồ.\n"
        "• **Trưa**: Thưởng thức **Gà nướng sa lửa & Cơm lam** tại khu vực Biển Hồ.\n"
        "• **Chiều**: Viếng **Chùa Minh Thành** với kiến trúc Nhật Bản - Tây Tạng độc nhất vô nhị -> Tham quan **Làng văn hóa Plei Ốp** tìm hiểu văn hóa Jrai, nhà rông và tượng nhà mồ.\n"
        "• **Tối**: Dạo phố đêm Pleiku, thưởng thức ẩm thực đường phố (Bún mắm cua, nem nướng, chè lụi) và nhâm nhi cà phê Pleiku ngắm phố núi về đêm.\n\n"
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


@router.post("")
def chat(req: ChatRequest):
    """Hỏi đáp du lịch Gia Lai qua GraphRAG & Natural Language Engine."""
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
                "Dạ xin chào bạn! 👋 Tôi là **Trợ lý Du lịch Thông minh Gia Lai** (Đại ngàn Tây Nguyên chạm Biển xanh Quy Nhơn).\n\n"
                "Tôi có thể hỗ trợ bạn:\n"
                "• 🏔️ **Khám phá điểm đến**: Biển Hồ T'nưng, Chư Đang Ya, đỉnh Chư Nâm, Thác K50, Chùa Minh Thành...\n"
                "• 🍲 **Ẩm thực đặc sản**: Phở khô hai tô, Gà nướng cơm lam, Bò một nắng muối kiến vàng...\n"
                "• 🏨 **Lưu trú**: Khách sạn trung tâm Pleiku, homestay săn mây view đồi chè...\n"
                "• 🗺️ **Lộ trình du lịch**: Gợi ý lịch trình 1 - 5 ngày tối ưu.\n\n"
                "Hôm nay bạn cần tôi hỗ trợ thông tin gì ạ? 😊"
            ),
            "source": "intent_greeting"
        }

    # 2. Giới thiệu / Trợ giúp
    if intent == "WHO_ARE_YOU":
        return {
            "answer": (
                "Tôi là **AI Trợ lý Du lịch Gia Lai**, được xây dựng dựa trên nền tảng **Đồ thị Tri thức (Knowledge Graph)** kết hợp công nghệ **GraphRAG**.\n\n"
                "Hệ thống đã số hóa dữ liệu chuẩn xác gồm:\n"
                "- 📌 **40 điểm du lịch** danh thắng, văn hóa, sinh thái và biển đảo\n"
                "- 🍲 **25 món ẩm thực** đặc sản kèm địa chỉ quán ngon\n"
                "- 🏨 **20 khách sạn & homestay** chất lượng cao\n"
                "- 🗺️ Tọa độ GPS và tuyến đường kết nối liên huyện\n\n"
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

    # Nếu có GOOGLE_API_KEY → dùng Gemini LLM sinh câu trả lời tự nhiên
    if api_key and matched_locs:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import HumanMessage, SystemMessage

            llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=api_key,
                temperature=0.3,
            )

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

            response = llm.invoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_msg),
            ])

            return {
                "answer": response.content,
                "context": context_str,
                "source": "graphrag_gemini",
            }
        except Exception:
            pass

    # Phản hồi tự nhiên được tổng hợp (Natural Synthesis Fallback khi không có API key)
    if matched_locs:
        best_loc = matched_locs[0]
        # Nếu điểm cao hoặc khớp tên rõ ràng
        if best_loc.get("hybrid_score", 0) > 0.3 or len(matched_locs) == 1:
            reply = _format_location_answer(best_loc)
            return {
                "answer": reply,
                "context": str(best_loc),
                "source": "knowledge_graph_specific",
            }

        # Nếu tìm thấy nhiều điểm gợi ý
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

    # Nếu không tìm thấy kết quả phù hợp
    return {
        "answer": (
            f"Tôi chưa tìm thấy thông tin cụ thể về '{user_msg}' trong dữ liệu du lịch Gia Lai hiện tại.\n\n"
            "Bạn có thể thử tìm kiếm theo:\n"
            "• Tên danh thắng: *Biển Hồ, Núi lửa Chư Đang Ya, Thác K50, Chùa Minh Thành, Đỉnh Chư Nâm...*\n"
            "• Đặc sản ẩm thực: *Phở hai tô, Gà nướng cơm lam, Bò một nắng, Bún mắm cua...*\n"
            "• Hoặc hỏi gợi ý lộ trình du lịch 2 ngày, 3 ngày nhé! 🏔️✨"
        ),
        "source": "not_found_fallback"
    }
