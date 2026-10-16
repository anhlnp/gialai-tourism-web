import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Calendar, MapPin, Clock, ArrowLeft, RotateCcw, 
  UtensilsCrossed, Hotel, Check, Compass, Trees, Coffee, 
  Flame, Camera, Mountain, Map as MapIcon, Share2, BookmarkCheck, ChevronRight
} from 'lucide-react'
import { postApi, useApi } from '../hooks/useApi'

export default function Planner() {
  const navigate = useNavigate()
  const { data: districts } = useApi('/locations/districts')

  // Form states
  const [days, setDays] = useState(3)
  const [region, setRegion] = useState('')
  const [pace, setPace] = useState('balanced') // 'relaxed' | 'balanced' | 'active'
  const [interests, setInterests] = useState(['nature', 'food', 'culture'])
  
  // App states
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [plan, setPlan] = useState(() => {
    try {
      const cached = localStorage.getItem('last_generated_itinerary')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [activeDay, setActiveDay] = useState(1)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const interestOptions = [
    { id: 'nature', label: 'Cảnh quan thiên nhiên', icon: Trees },
    { id: 'food', label: 'Ẩm thực bản địa', icon: UtensilsCrossed },
    { id: 'culture', label: 'Văn hóa & Cồng chiêng', icon: Flame },
    { id: 'photo', label: 'Sống ảo & Check-in', icon: Camera },
    { id: 'trekking', label: 'Trekking, thác nước', icon: Mountain },
    { id: 'coffee', label: 'Cà phê & Ngắm cảnh', icon: Coffee },
  ]

  const toggleInterest = (id) => {
    if (interests.includes(id)) {
      if (interests.length > 1) {
        setInterests(interests.filter(item => item !== id))
      }
    } else {
      setInterests([...interests, id])
    }
  }

  const generatePlan = async () => {
    setLoading(true)
    setLoadingStep(1)

    // Hiệu ứng các bước phân tích GraphRAG
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < 4 ? prev + 1 : prev))
    }, 700)

    try {
      const result = await postApi('/planner', { 
        days, 
        region: region || null,
        pace,
        interests
      })
      clearInterval(stepInterval)
      if (result) {
        setPlan(result)
        setActiveDay(1)
        localStorage.setItem('last_generated_itinerary', JSON.stringify(result))
      }
    } catch (err) {
      console.error('Error generating itinerary:', err)
      clearInterval(stepInterval)
    } finally {
      setLoading(false)
    }
  }

  const saveToMyItineraries = () => {
    if (!plan) return
    try {
      const history = JSON.parse(localStorage.getItem('saved_itineraries') || '[]')
      const newEntry = {
        id: 'ITIN_' + Date.now(),
        createdAt: new Date().toLocaleDateString('vi-VN'),
        title: `Lịch trình Gia Lai ${days} ngày`,
        days,
        region: region || 'Toàn tỉnh',
        data: plan
      }
      localStorage.setItem('saved_itineraries', JSON.stringify([newEntry, ...history.slice(0, 9)]))
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (err) {
      console.error('Error saving itinerary:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-24 text-[#1A1D1A]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#E8EBE5]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#1A1D1A] hover:bg-[#E8EBE5]/60 active:scale-95 transition-all"
              title="Quay lại"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-editorial text-xl font-bold text-[#1A1D1A]">
                {plan ? 'Lịch trình của tôi' : 'Lập lịch trình AI'}
              </h1>
              <span className="text-[11px] text-[#5A635B] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#246B4A]"></span>
                Cố vấn du lịch GraphRAG Gia Lai
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {plan && (
              <>
                <button
                  onClick={() => setPlan(null)}
                  className="px-3 py-1.5 rounded-full bg-white border border-[#E8EBE5] text-[#5A635B] hover:text-[#246B4A] text-xs font-medium flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                  title="Tạo lại lịch trình khác"
                >
                  <RotateCcw size={13} />
                  <span>Tạo lại</span>
                </button>
                <button
                  onClick={saveToMyItineraries}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-xs active:scale-95 transition-all ${
                    savedSuccess 
                      ? 'bg-[#246B4A] text-white' 
                      : 'bg-[#EAF3EB] text-[#246B4A] border border-[#246B4A]/30'
                  }`}
                  title="Lưu lịch trình này"
                >
                  <BookmarkCheck size={14} />
                  <span>{savedSuccess ? 'Đã lưu!' : 'Lưu'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 pt-4">
        {loading ? (
          /* Màn hình Loading Stitch: Đang tổng hợp lộ trình AI */
          <div className="bg-white rounded-3xl border border-[#E8EBE5] p-6 text-center my-6 shadow-sm">
            <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-[#246B4A]/20 border-t-[#246B4A] animate-spin"></div>
              <Sparkles size={32} className="text-[#246B4A] animate-pulse" />
            </div>

            <h2 className="font-editorial text-2xl font-bold text-[#1A1D1A] mb-2">
              Đang tổng hợp lộ trình AI...
            </h2>
            <p className="text-xs text-[#5A635B] max-w-sm mx-auto mb-6 leading-relaxed">
              Trợ lý GraphRAG đang liên kết các cung đường bazan, kiểm tra tọa độ không gian và cân đối lịch trình tối ưu cho bạn.
            </p>

            <div className="space-y-2.5 text-left max-w-xs mx-auto border-t border-[#E8EBE5] pt-4">
              <div className={`flex items-center gap-2 text-xs ${loadingStep >= 1 ? 'text-[#246B4A] font-semibold' : 'text-[#8A948C]'}`}>
                <Check size={14} className={loadingStep >= 1 ? 'opacity-100' : 'opacity-30'} />
                <span>Truy vấn mạng lưới địa danh Neo4j...</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${loadingStep >= 2 ? 'text-[#246B4A] font-semibold' : 'text-[#8A948C]'}`}>
                <Check size={14} className={loadingStep >= 2 ? 'opacity-100' : 'opacity-30'} />
                <span>Ghép nối đặc sản ẩm thực & lưu trú phù hợp...</span>
              </div>
              <div className={`flex items-center gap-2 text-xs ${loadingStep >= 3 ? 'text-[#246B4A] font-semibold' : 'text-[#8A948C]'}`}>
                <Check size={14} className={loadingStep >= 3 ? 'opacity-100' : 'opacity-30'} />
                <span>Tối ưu hóa thứ tự tham quan tránh ngược đường...</span>
              </div>
            </div>
          </div>
        ) : !plan ? (
          /* Form Wizard Stitch: Thiết lập Lịch trình */
          <div className="space-y-4">
            {/* Hero Banner Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#EAF3EB] via-[#F2FCF2] to-white p-5 border border-[#246B4A]/15 shadow-xs">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="p-2.5 rounded-xl bg-[#246B4A] text-white shadow-xs">
                  <Sparkles size={20} />
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#246B4A] block">
                    Cố vấn số cao nguyên
                  </span>
                  <h2 className="font-editorial text-lg font-bold text-[#1A1D1A]">
                    Cá nhân hóa chuyến đi Gia Lai
                  </h2>
                </div>
              </div>
              <p className="text-xs text-[#5A635B] leading-relaxed">
                Được vận hành bởi <strong>Đồ thị Tri thức GraphRAG</strong>, hệ thống tự động gắn kết danh lam, canh nhịp nắng đẹp nhất và gợi ý ẩm thực đặc sắc.
              </p>
            </div>

            {/* Bước 1: Thời lượng & Khu vực */}
            <section className="bg-white rounded-2xl p-4 border border-[#E8EBE5] space-y-3.5 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E8EBE5]">
                <span className="w-5 h-5 rounded-full bg-[#EAF3EB] text-[#246B4A] text-xs font-bold flex items-center justify-center">1</span>
                <h3 className="font-editorial text-sm font-bold text-[#1A1D1A]">Thời lượng & Khu vực</h3>
              </div>

              {/* Số ngày */}
              <div>
                <label className="text-xs font-semibold text-[#5A635B] block mb-2">Số ngày trải nghiệm:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDays(d)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                        days === d
                          ? 'bg-[#EAF3EB] border-[#246B4A] text-[#246B4A] shadow-xs'
                          : 'bg-white border-[#E8EBE5] text-[#5A635B] hover:bg-[#FAFAF7]'
                      }`}
                    >
                      {d} ngày {d > 1 ? `${d-1} đêm` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khu vực trọng tâm */}
              <div>
                <label className="text-xs font-semibold text-[#5A635B] block mb-2">Trọng tâm vùng:</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRegion('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      !region
                        ? 'bg-[#246B4A] border-[#246B4A] text-white'
                        : 'bg-white border-[#E8EBE5] text-[#5A635B] hover:bg-[#FAFAF7]'
                    }`}
                  >
                    Toàn tỉnh Gia Lai
                  </button>
                  {districts?.map(d => (
                    <button
                      key={d.id || d.name}
                      type="button"
                      onClick={() => setRegion(region === d.name ? '' : d.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        region === d.name
                          ? 'bg-[#246B4A] border-[#246B4A] text-white'
                          : 'bg-white border-[#E8EBE5] text-[#5A635B] hover:bg-[#FAFAF7]'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Bước 2: Nhịp độ chuyến đi */}
            <section className="bg-white rounded-2xl p-4 border border-[#E8EBE5] space-y-3 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E8EBE5]">
                <span className="w-5 h-5 rounded-full bg-[#EAF3EB] text-[#246B4A] text-xs font-bold flex items-center justify-center">2</span>
                <h3 className="font-editorial text-sm font-bold text-[#1A1D1A]">Nhịp độ chuyến đi</h3>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'relaxed', title: 'Thư thái, nghỉ dưỡng', desc: '2 – 3 điểm/ngày • Thảnh thơi thưởng cảnh', icon: Coffee },
                  { id: 'balanced', title: 'Cân bằng, trọn vẹn', desc: '4 – 5 điểm/ngày • Trải nghiệm hài hòa nhất', icon: Compass, badge: 'Khuyên dùng' },
                  { id: 'active', title: 'Khám phá liên tục, trekking', desc: '6+ điểm/ngày • Dành cho người năng động', icon: Mountain },
                ].map(item => {
                  const Icon = item.icon
                  const active = pace === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPace(item.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        active
                          ? 'bg-[#EAF3EB] border-[#246B4A] shadow-xs'
                          : 'bg-white border-[#E8EBE5] hover:border-[#246B4A]/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? 'bg-[#246B4A] text-white' : 'bg-[#FAFAF7] text-[#5A635B]'}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#1A1D1A]">{item.title}</span>
                            {item.badge && (
                              <span className="text-[10px] bg-[#246B4A] text-white font-semibold px-2 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#5A635B]">{item.desc}</span>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${active ? 'border-[#246B4A] bg-[#246B4A] text-white' : 'border-[#8A948C]'}`}>
                        {active && <Check size={13} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Bước 3: Sở thích & Trải nghiệm ưu tiên */}
            <section className="bg-white rounded-2xl p-4 border border-[#E8EBE5] space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8EBE5]">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#EAF3EB] text-[#246B4A] text-xs font-bold flex items-center justify-center">3</span>
                  <h3 className="font-editorial text-sm font-bold text-[#1A1D1A]">Sở thích ưu tiên</h3>
                </div>
                <span className="text-[11px] text-[#246B4A] font-semibold">Chọn ít nhất 1</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {interestOptions.map(opt => {
                  const Icon = opt.icon
                  const selected = interests.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleInterest(opt.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selected
                          ? 'bg-[#EAF3EB] border-[#246B4A] text-[#246B4A] shadow-xs'
                          : 'bg-white border-[#E8EBE5] text-[#5A635B] hover:bg-[#FAFAF7]'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{opt.label}</span>
                      {selected && <Check size={12} className="ml-0.5 text-[#246B4A]" />}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Nút hành động Tạo lịch trình */}
            <button
              onClick={generatePlan}
              className="w-full py-3.5 rounded-2xl bg-[#246B4A] text-white font-editorial text-base font-bold flex items-center justify-center gap-2 shadow-md hover:bg-[#1E573C] active:scale-98 transition-all"
            >
              <Sparkles size={18} />
              <span>Tạo lịch trình với GraphRAG</span>
            </button>
          </div>
        ) : (
          /* Màn hình Hiển thị Lịch trình Stitch Editorial */
          <div className="space-y-4">
            {/* Days Segmented Tab Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {plan?.itinerary?.map(d => (
                <button
                  key={d.day}
                  onClick={() => setActiveDay(d.day)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                    activeDay === d.day
                      ? 'bg-[#246B4A] text-white shadow-xs'
                      : 'bg-white border border-[#E8EBE5] text-[#5A635B] hover:bg-[#F2FCF2]'
                  }`}
                >
                  Ngày {d.day}: {d.theme || `Khám phá`}
                </button>
              ))}
            </div>

            {/* Content của ngày đang chọn */}
            {(() => {
              const currentDayData = plan?.itinerary?.find(d => d.day === activeDay) || plan?.itinerary?.[0]
              if (!currentDayData) return null

              return (
                <div className="space-y-4">
                  {/* Banner ngày */}
                  <div className="bg-white rounded-2xl p-4 border border-[#E8EBE5] shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#EAF3EB] text-[#246B4A] text-[11px] font-bold uppercase tracking-wider">
                        Ngày {currentDayData.day}
                      </span>
                      <span className="text-xs text-[#5A635B]">
                        {currentDayData.locations?.length || 0} điểm dừng chân
                      </span>
                    </div>
                    <h3 className="font-editorial text-lg font-bold text-[#1A1D1A]">
                      {currentDayData.theme || 'Hành trình trải nghiệm Gia Lai'}
                    </h3>
                  </div>

                  {/* Danh sách địa điểm trong ngày */}
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E8EBE5]">
                    {currentDayData.locations?.map((loc, idx) => (
                      <div key={loc.id || idx} className="relative">
                        {/* Timeline Bullet */}
                        <div className="absolute -left-6 top-3 w-5 h-5 rounded-full bg-[#246B4A] text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                          {idx + 1}
                        </div>

                        {/* Location Card */}
                        <div className="bg-white rounded-2xl border border-[#E8EBE5] overflow-hidden hover:border-[#246B4A]/40 transition-all shadow-xs">
                          <div className="flex flex-col sm:flex-row">
                            {loc.imageUrl && (
                              <div className="w-full sm:w-32 aspect-[16/10] sm:aspect-square bg-[#E8EBE5] shrink-0">
                                <img
                                  src={loc.imageUrl}
                                  alt={loc.name}
                                  className="w-full h-full object-cover"
                                  onError={e => {
                                    e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop'
                                  }}
                                />
                              </div>
                            )}
                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <Link
                                    to={`/destinations/${loc.id}`}
                                    className="font-editorial text-base font-bold text-[#1A1D1A] hover:text-[#246B4A]"
                                  >
                                    {loc.name}
                                  </Link>
                                  {loc.time && (
                                    <span className="text-[11px] text-[#C26D38] font-bold px-2 py-0.5 rounded-full bg-[#FFF5EE]">
                                      {loc.time}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-[#5A635B] mb-1.5">
                                  <MapPin size={12} className="text-[#246B4A]" />
                                  <span>{loc.district || 'Gia Lai'}</span>
                                  {loc.bestTime && <span>• {loc.bestTime}</span>}
                                </div>
                                <p className="text-xs text-[#5A635B] line-clamp-2">
                                  {loc.notes || loc.description || 'Thắng cảnh thiên nhiên nổi bật trên hành trình.'}
                                </p>
                              </div>

                              <div className="mt-2 pt-2 border-t border-[#E8EBE5]/60 flex items-center justify-between text-xs">
                                <span className="text-[#8A948C] text-[11px]">
                                  {loc.budget || 'Miễn phí'}
                                </span>
                                <Link
                                  to={`/destinations/${loc.id}`}
                                  className="inline-flex items-center gap-1 text-[#246B4A] font-semibold text-xs hover:underline"
                                >
                                  <span>Chi tiết</span>
                                  <ChevronRight size={13} />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gợi ý Ẩm thực trong ngày */}
                  {currentDayData.food && currentDayData.food.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 border border-[#E8EBE5] shadow-xs">
                      <div className="flex items-center gap-2 mb-2.5 text-[#C26D38]">
                        <UtensilsCrossed size={16} />
                        <h4 className="font-editorial text-sm font-bold text-[#1A1D1A]">
                          Gợi ý ẩm thực ngày {currentDayData.day}
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {currentDayData.food.map((f, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-[#FAFAF7] border border-[#E8EBE5] flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#1A1D1A]">{f.name}</p>
                              <span className="text-[11px] text-[#5A635B]">{f.restaurant || 'Quán ăn đặc sản'}</span>
                            </div>
                            <Link
                              to="/food"
                              className="text-[11px] text-[#246B4A] font-semibold hover:underline"
                            >
                              Khám phá
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nơi nghỉ đêm */}
                  {currentDayData.stay && (
                    <div className="bg-white rounded-2xl p-4 border border-[#E8EBE5] shadow-xs">
                      <div className="flex items-center gap-2 mb-2 text-[#246B4A]">
                        <Hotel size={16} />
                        <h4 className="font-editorial text-sm font-bold text-[#1A1D1A]">
                          Nơi lưu trú đêm {currentDayData.day}
                        </h4>
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAFAF7] border border-[#E8EBE5] flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#1A1D1A]">{currentDayData.stay.name}</p>
                          <span className="text-[11px] text-[#5A635B]">{currentDayData.stay.district || currentDayData.stay.address || 'Gia Lai'}</span>
                        </div>
                        <Link
                          to="/stay"
                          className="px-3 py-1 rounded-full bg-white border border-[#E8EBE5] text-xs font-semibold text-[#246B4A] hover:bg-[#F2FCF2]"
                        >
                          Xem phòng
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </main>
    </div>
  )
}
