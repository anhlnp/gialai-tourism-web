/**
 * useApi — Custom hook for API calls with resilient fallback to official Gia Lai dataset
 */
import { useState, useEffect, useCallback } from 'react'
import {
  MOCK_LOCATIONS,
  MOCK_CATEGORIES,
  MOCK_DISTRICTS,
  MOCK_DISHES,
  MOCK_STAYS
} from '../data/mockData'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export function generateFallbackPlan(days = 2, region = null) {
  let pool = [...MOCK_LOCATIONS]
  if (region) {
    const regionFiltered = pool.filter(l => l.district === region || l.districtId === region)
    if (regionFiltered.length > 0) {
      pool = regionFiltered
    }
  }

  // Sắp xếp theo đánh giá cao nhất
  pool.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))

  const spotsPerDay = Math.max(2, Math.min(3, Math.floor(pool.length / days) || 2))
  const itinerary = []

  for (let d = 1; d <= days; d++) {
    const startIdx = ((d - 1) * spotsPerDay) % pool.length
    let daySpots = pool.slice(startIdx, startIdx + spotsPerDay)
    if (daySpots.length === 0 && pool.length > 0) {
      daySpots = [pool[0]]
    }

    const dayFoods = MOCK_DISHES.slice(((d - 1) * 2) % MOCK_DISHES.length, (((d - 1) * 2) % MOCK_DISHES.length) + 2)
    const dayStay = MOCK_STAYS[(d - 1) % MOCK_STAYS.length]

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
        { name: "Phở hai tô Pleiku (Phở khô Gia Lai)" },
        { name: "Bò một nắng nướng muối kiến vàng Krông Pa" }
      ],
      stay: dayStay ? {
        name: dayStay.name,
        address: dayStay.address
      } : {
        name: "Khách sạn Mường Thanh Grand Gia Lai",
        address: "Số 02 Tô Vĩnh Diện, TP. Pleiku"
      }
    })
  }

  return {
    title: `Lộ trình ${days} ngày khám phá ${region || 'Gia Lai'} tối ưu`,
    days,
    itinerary
  }
}

export function resolveFallback(endpoint, params = {}) {
  const [cleanEndpoint, qs] = endpoint.split('?')
  const qParams = new URLSearchParams(qs || '')
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null) qParams.set(k, v)
  }

  if (cleanEndpoint === '/stats') {
    return {
      locations: MOCK_LOCATIONS.length,
      dishes: MOCK_DISHES.length,
      stays: MOCK_STAYS.length,
      districts: MOCK_DISTRICTS.length
    }
  }

  if (cleanEndpoint === '/featured') {
    return {
      locations: MOCK_LOCATIONS.slice(0, 6),
      dishes: MOCK_DISHES.slice(0, 4)
    }
  }

  if (cleanEndpoint === '/locations') {
    let result = [...MOCK_LOCATIONS]
    const cat = qParams.get('category')
    const reg = qParams.get('region')
    const search = qParams.get('search')
    if (cat) result = result.filter(l => l.category === cat || l.categoryId === cat)
    if (reg) result = result.filter(l => l.district === reg || l.districtId === reg)
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(l => l.name.toLowerCase().includes(s) || l.description.toLowerCase().includes(s))
    }
    return result
  }

  if (cleanEndpoint === '/locations/categories') {
    return MOCK_CATEGORIES
  }

  if (cleanEndpoint === '/locations/districts') {
    return MOCK_DISTRICTS
  }

  if (cleanEndpoint.startsWith('/locations/')) {
    const id = cleanEndpoint.replace('/locations/', '')
    const found = MOCK_LOCATIONS.find(l => l.id === id || l.locationId === id)
    if (found) {
      return {
        ...found,
        tags: [found.category, found.district, found.bestTime],
        relatedLocations: MOCK_LOCATIONS.filter(l => l.categoryId === found.categoryId && l.id !== found.id).slice(0, 3),
        nearbyDishes: MOCK_DISHES.slice(0, 3),
        nearbyStays: MOCK_STAYS.slice(0, 3)
      }
    }
  }

  if (cleanEndpoint === '/dishes') {
    const s = qParams.get('search')?.toLowerCase()
    if (s) {
      return MOCK_DISHES.filter(d => 
        (d.name && d.name.toLowerCase().includes(s)) || 
        (d.description && d.description.toLowerCase().includes(s)) ||
        (d.suggestedEateries && d.suggestedEateries.some(e => e.toLowerCase().includes(s)))
      )
    }
    return MOCK_DISHES
  }

  if (cleanEndpoint === '/accommodations') {
    const s = qParams.get('search')?.toLowerCase()
    if (s) {
      return MOCK_STAYS.filter(st => 
        (st.name && st.name.toLowerCase().includes(s)) || 
        (st.description && st.description.toLowerCase().includes(s)) ||
        (st.address && st.address.toLowerCase().includes(s)) ||
        (st.stayType && st.stayType.toLowerCase().includes(s))
      )
    }
    return MOCK_STAYS
  }

  if (cleanEndpoint.startsWith('/search/')) {
    const q = qParams.get('q') || ''
    if (!q) return MOCK_LOCATIONS
    const s = q.toLowerCase()
    return MOCK_LOCATIONS.filter(l =>
      l.name.toLowerCase().includes(s) ||
      l.description.toLowerCase().includes(s) ||
      l.district.toLowerCase().includes(s) ||
      l.category.toLowerCase().includes(s)
    )
  }

  return null
}

export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { immediate = true, params = {} } = options

  const fetchData = useCallback(async (overrideParams) => {
    setLoading(true)
    setError(null)
    const effectiveParams = overrideParams || params
    try {
      const queryParams = new URLSearchParams(effectiveParams)
      const qs = queryParams.toString()
      const url = `${API_BASE}${endpoint}${qs ? '?' + qs : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
      return json
    } catch (err) {
      const fallback = resolveFallback(endpoint, effectiveParams)
      if (fallback !== null) {
        setData(fallback)
        return fallback
      }
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    if (immediate) fetchData()
  }, [endpoint])

  return { data, loading, error, refetch: fetchData }
}

export async function getApi(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    const fallback = resolveFallback(endpoint)
    if (fallback !== null) return fallback
    throw err
  }
}

export async function postApi(endpoint, body) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    // Graceful fallback cho cả Planner và Chat khi Vercel standalone hoặc backend lỗi
    if (endpoint === '/planner') {
      const { days = 2, region = null } = body || {}
      return generateFallbackPlan(days, region)
    }

    if (endpoint === '/chat') {
      const userText = (body?.message || body?.query || '').trim().toLowerCase()
      const greetings = ['hi', 'hello', 'chào', 'xin chào', 'alo', 'ơi', 'hey', 'hai', 'helo']
      let reply = ''
      if (greetings.includes(userText) || userText.length <= 4) {
        reply = 'Dạ xin chào bạn! 👋 Tôi là Trợ lý Du lịch Thông minh Gia Lai. Tôi có thể hỗ trợ bạn tìm kiếm điểm tham quan danh thắng, món ăn đặc sản, khách sạn homestay hay lên lộ trình du lịch tối ưu. Hôm nay bạn cần tôi hỗ trợ thông tin gì ạ? 😊'
      } else if (userText.includes('ăn') || userText.includes('món') || userText.includes('đặc sản')) {
        reply = '🍲 **Đặc sản Gia Lai nhất định phải thử:**\n\n1. **Phở Khô Gia Lai (Phở Hai Tô)**: Món ăn biểu tượng với tô bánh phở trụng riêng và tô súp ngọt xương thơm lừng.\n2. **Gà nướng sa lửa & Cơm lam**: Thịt gà đồi ướp lá rừng nướng than hồng chấm muối é ớt hiểm.\n3. **Bò một nắng muối kiến vàng Krông Pa**: Bò cỏ phơi nắng nướng chấm muối trứng kiến chua cay lạ miệng.\n4. **Bún mắm cua (Bún cua thối)**: Nét ẩm thực bản địa độc đáo phố núi Pleiku.'
      } else if (userText.includes('khách sạn') || userText.includes('homestay') || userText.includes('nghỉ') || userText.includes('ở')) {
        reply = '🏨 **Gợi ý nơi lưu trú tốt nhất tại Gia Lai:**\n\n• **HAGL Hotel Pleiku (4 sao)**: Trung tâm TP. Pleiku, view toàn cảnh phố núi, hồ bơi và buffet sáng.\n• **Boston Hotel Pleiku (3 sao)**: Gần sân bay, phòng ốc hiện đại, giá hợp lý.\n• **Tiên Sơn Homestay**: Gần Biển Hồ, view hồ xanh mát yên bình.\n• **XOM Homestay & Coffee**: View đồi chè Biển Hồ thơ mộng.'
      } else {
        reply = `Dạ chào bạn! Đối với câu hỏi về "${body?.message || 'du lịch Gia Lai'}", hệ thống Đồ thị Tri thức đã cập nhật 40 điểm đến, ẩm thực và lưu trú chính thống. Bạn có thể tra cứu chi tiết tại trang Khám phá, Bản đồ du lịch hoặc Lên lộ trình nhé!`
      }
      return {
        answer: reply,
        reply: reply,
        sources: [
          { name: "Cổng Thông tin Du lịch Tỉnh Gia Lai", url: "https://gialaitourism.gov.vn" }
        ]
      }
    }

    // Nếu endpoint khác thì ném lỗi
    throw err
  }
}
