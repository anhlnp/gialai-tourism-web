import {
  MOCK_LOCATIONS,
  MOCK_CATEGORIES,
  MOCK_DISTRICTS,
  MOCK_DISHES,
  MOCK_STAYS
} from './data.js';

export default function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/^\/api/, '');
  const searchParams = url.searchParams;

  // 1. Stats
  if (pathname === '/stats' || pathname === '/stats/') {
    return res.status(200).json({
      locations: MOCK_LOCATIONS.length,
      dishes: MOCK_DISHES.length,
      stays: MOCK_STAYS.length,
      districts: MOCK_DISTRICTS.length
    });
  }

  // 2. Featured
  if (pathname === '/featured' || pathname === '/featured/') {
    return res.status(200).json({
      locations: MOCK_LOCATIONS.slice(0, 6),
      dishes: MOCK_DISHES.slice(0, 4)
    });
  }

  // 3. Categories
  if (pathname === '/locations/categories' || pathname === '/categories') {
    return res.status(200).json(MOCK_CATEGORIES);
  }

  // 4. Districts
  if (pathname === '/locations/districts' || pathname === '/districts') {
    return res.status(200).json(MOCK_DISTRICTS);
  }

  // 5. Locations list & filter
  if (pathname === '/locations' || pathname === '/locations/') {
    let result = [...MOCK_LOCATIONS];
    const cat = searchParams.get('category');
    const reg = searchParams.get('region');
    const search = searchParams.get('search');
    const limit = Number(searchParams.get('limit')) || 200;

    if (cat) result = result.filter(l => l.category === cat || l.categoryId === cat);
    if (reg) result = result.filter(l => l.district === reg || l.districtId === reg);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l => l.name.toLowerCase().includes(s) || l.description.toLowerCase().includes(s));
    }

    return res.status(200).json(result.slice(0, limit));
  }

  // 6. Single location detail
  if (pathname.startsWith('/locations/')) {
    const id = pathname.replace('/locations/', '');
    const found = MOCK_LOCATIONS.find(l => l.id === id || l.locationId === id);
    if (found) {
      return res.status(200).json({
        ...found,
        tags: [found.category, found.district, found.bestTime],
        relatedLocations: MOCK_LOCATIONS.filter(l => l.categoryId === found.categoryId && l.id !== found.id).slice(0, 3),
        nearbyDishes: MOCK_DISHES.slice(0, 3),
        nearbyStays: MOCK_STAYS.slice(0, 3)
      });
    }
  }

  // 7. Dishes
  if (pathname === '/dishes' || pathname === '/dishes/') {
    return res.status(200).json(MOCK_DISHES);
  }

  // 8. Stays / Accommodations
  if (pathname === '/accommodations' || pathname === '/accommodations/' || pathname === '/stays') {
    return res.status(200).json(MOCK_STAYS);
  }

  // 9. Search (Fulltext, Semantic, Hybrid)
  if (pathname.startsWith('/search/')) {
    const q = searchParams.get('q') || '';
    if (!q) return res.status(200).json(MOCK_LOCATIONS);
    const s = q.toLowerCase();
    const matches = MOCK_LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(s) ||
      l.description.toLowerCase().includes(s) ||
      l.district.toLowerCase().includes(s) ||
      l.category.toLowerCase().includes(s)
    );
    return res.status(200).json(matches);
  }

  // 10. Planner (POST)
  if (pathname === '/planner' || pathname === '/planner/') {
    const body = req.body || {};
    const days = Number(body.days) || 2;
    const region = body.region || null;

    let pool = [...MOCK_LOCATIONS];
    if (region) {
      const regionFiltered = pool.filter(l => l.district === region || l.districtId === region);
      if (regionFiltered.length > 0) pool = regionFiltered;
    }
    pool.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));

    const spotsPerDay = 2;
    const itinerary = [];

    for (let d = 1; d <= days; d++) {
      const startIdx = ((d - 1) * spotsPerDay) % pool.length;
      let daySpots = pool.slice(startIdx, startIdx + spotsPerDay);
      if (daySpots.length === 0 && pool.length > 0) daySpots = [pool[0]];

      const dayFoods = MOCK_DISHES.slice(((d - 1) * 2) % MOCK_DISHES.length, ((d - 1) * 2) % MOCK_DISHES.length + 2);
      const dayStay = MOCK_STAYS[(d - 1) % MOCK_STAYS.length];

      itinerary.push({
        day: d,
        locations: daySpots.map(l => ({
          id: l.id,
          name: l.name,
          imageUrl: l.imageUrl,
          district: l.district,
          bestTime: l.bestTime,
          budget: l.budget ? `${Number(l.budget).toLocaleString()}đ` : 'Miễn phí'
        })),
        food: dayFoods.length > 0 ? dayFoods : [
          { name: "Phở hai tô Pleiku (Phở khô)" },
          { name: "Gà nướng cơm lam Pleiku" }
        ],
        stay: dayStay ? {
          name: dayStay.name,
          address: dayStay.address
        } : {
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

  // 11. Chat (POST)
  if (pathname === '/chat' || pathname === '/chat/') {
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

  // Catch-all
  return res.status(200).json({
    status: "online",
    service: "Gia Lai Tourism Knowledge Graph API",
    path: pathname
  });
}
