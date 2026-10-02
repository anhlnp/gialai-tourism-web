export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const userText = body.message || body.query || 'Gia Lai';

  const answer = `Chào bạn! Tôi là trợ lý ảo Đồ thị Tri thức Du lịch Gia Lai. Hệ thống đã đồng bộ 30 điểm đến chính thống, 4 danh mục di sản và thắng cảnh, cùng danh sách đặc sản ẩm thực (Phở hai tô, Bò một nắng, Gà nướng cơm lam). Đối với câu hỏi về "${userText}", bạn có thể tra cứu chi tiết tại trang Khám phá, Lên lộ trình hoặc Bản đồ du lịch!`;

  return res.status(200).json({
    answer,
    reply: answer,
    sources: [
      { name: "Cổng Thông tin Du lịch Tỉnh Gia Lai", url: "https://gialaitourism.gov.vn" }
    ]
  });
}
