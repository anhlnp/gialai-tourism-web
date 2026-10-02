export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const days = Number(body.days) || 2;
  const region = body.region || null;

  const sampleSpots = [
    {
      id: "LOC_BIENHO",
      name: "Biển Hồ T'Nưng (Hồ Ea Nueng)",
      district: "Thành phố Pleiku",
      bestTime: "Sáng sớm",
      budget: "20,000đ",
      imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"
    },
    {
      id: "LOC_CHUDANGYA",
      name: "Núi lửa Chư Đang Ya",
      district: "Huyện Chư Păh",
      bestTime: "Sáng sớm hoặc Hoàng hôn",
      budget: "Miễn phí",
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"
    },
    {
      id: "LOC_THACPHUCUONG",
      name: "Thác Phú Cường",
      district: "Huyện Chư Sê",
      bestTime: "8h00 - 16h00",
      budget: "25,000đ",
      imageUrl: "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800"
    },
    {
      id: "LOC_CHUA_MINHTHANH",
      name: "Chùa Minh Thành Pleiku",
      district: "Thành phố Pleiku",
      bestTime: "Sáng hoặc chiều mát",
      budget: "Miễn phí",
      imageUrl: "https://images.unsplash.com/photo-1548625361-16a9a081a95a?w=800"
    },
    {
      id: "LOC_QUANGTRUONG_DAIDOANKET",
      name: "Quảng trường Đại Đoàn Kết & Bảo tàng Gia Lai",
      district: "Thành phố Pleiku",
      bestTime: "Buổi chiều tối",
      budget: "Miễn phí",
      imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800"
    },
    {
      id: "LOC_THACK50",
      name: "Thác K50 (Thác Hang Én) - Kon Chư Răng",
      district: "Huyện K'Bang",
      bestTime: "Mùa khô",
      budget: "50,000đ",
      imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800"
    }
  ];

  const itinerary = [];
  const spotsPerDay = 2;

  for (let d = 1; d <= days; d++) {
    const startIdx = ((d - 1) * spotsPerDay) % sampleSpots.length;
    const daySpots = sampleSpots.slice(startIdx, startIdx + spotsPerDay);

    itinerary.push({
      day: d,
      locations: daySpots,
      food: [
        { name: "Phở hai tô Pleiku (Phở khô)" },
        { name: "Gà nướng cơm lam Pleiku" }
      ],
      stay: {
        name: "Khách sạn Mường Thanh Grand Gia Lai",
        address: "Số 02 Tô Vĩnh Diện, TP. Pleiku"
      }
    });
  }

  return res.status(200).json({
    title: `Lộ trình ${days} ngày khám phá ${region || 'Gia Lai'}`,
    days,
    itinerary
  });
}
