import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Calendar, Flame, Sparkles, MapPin, Clock, ArrowLeft, 
  Search, Ticket, Music, Mountain, Compass, ChevronRight, X
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { DEFAULT_EVENT_THUMB } from '../constants/placeholders'

export default function Events() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('events') // 'events' | 'entertainments'
  const [search, setSearch] = useState('')

  const { data: events, loading: loadingEvents } = useApi('/events')
  const { data: entertainments, loading: loadingEnts } = useApi('/entertainments')

  const filteredEvents = (events || []).filter(e => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.name?.toLowerCase().includes(q) ||
      e.time?.toLowerCase().includes(q) ||
      e.highlight?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.locationName?.toLowerCase().includes(q)
    )
  })

  const filteredEnts = (entertainments || []).filter(ent => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      ent.name?.toLowerCase().includes(q) ||
      ent.type?.toLowerCase().includes(q) ||
      ent.address?.toLowerCase().includes(q) ||
      ent.description?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-slate-950 pb-28 lg:pb-16 text-[#1A1D1A] dark:text-slate-100 transition-colors">
      {/* Top Filter Header (Non-sticky to prevent covering content) */}
      <div className="border-b border-[#E8EBE5] dark:border-slate-800 bg-[#FAFAF7] dark:bg-slate-900/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#1A1D1A] dark:text-slate-200 hover:bg-[#E8EBE5]/60 dark:hover:bg-slate-800 active:scale-95 transition-all"
                title="Quay lại"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="font-editorial text-2xl font-bold text-[#1A1D1A] dark:text-slate-100 leading-tight">
                  {activeTab === 'events' ? 'Sự kiện & Lễ hội' : 'Vui chơi & Giải trí'}
                </h1>
                <p className="text-xs text-[#5A635B] dark:text-slate-400">
                  Không gian văn hóa cồng chiêng, lễ hội truyền thống và điểm hẹn Pleiku
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar Input */}
          <div className="relative mb-3">
            <div className="w-full h-11 bg-white dark:bg-slate-800 border border-[#E8EBE5] dark:border-slate-700 focus-within:border-[#246B4A] focus-within:ring-2 focus-within:ring-[#246B4A]/10 rounded-2xl px-3.5 flex items-center gap-2.5 shadow-xs transition-all">
              <Search size={18} className="text-[#246B4A] shrink-0" />
              <input
                type="text"
                placeholder={
                  activeTab === 'events'
                    ? "Tìm kiếm lễ hội, tuần lễ hoa dã quỳ, đua thuyền, cồng chiêng..."
                    : "Tìm chợ đêm, khu cắm trại, cafe ngắm hoàng hôn, tắm suối..."
                }
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-xs sm:text-sm text-[#1A1D1A] dark:text-slate-100 placeholder:text-[#8A948C] dark:placeholder:text-slate-400 focus:outline-none"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="text-[#8A948C] hover:text-[#1A1D1A] dark:hover:text-slate-200 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'events'
                  ? 'bg-[#246B4A] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-[#E8EBE5] dark:border-slate-700 text-[#5A635B] dark:text-slate-300 hover:bg-[#FAFAF7] dark:hover:bg-slate-700/60'
              }`}
            >
              <Flame size={14} />
              <span>Lễ hội &amp; Sự kiện ({events?.length || 6})</span>
            </button>
            <button
              onClick={() => setActiveTab('entertainments')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'entertainments'
                  ? 'bg-[#246B4A] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-[#E8EBE5] dark:border-slate-700 text-[#5A635B] dark:text-slate-300 hover:bg-[#FAFAF7] dark:hover:bg-slate-700/60'
              }`}
            >
              <Music size={14} />
              <span>Vui chơi &amp; Check-in ({entertainments?.length || 4})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'events' ? (
          /* TAB 1: SỰ KIỆN & LỄ HỘI */
          loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8EBE5] dark:border-slate-800 p-5 animate-pulse space-y-3">
                  <div className="h-5 bg-[#E8EBE5] dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-4 bg-[#E8EBE5] dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-14 bg-[#E8EBE5] dark:bg-slate-800 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state-card text-center my-8 p-8">
              <Calendar size={32} className="mx-auto text-[#8A948C] mb-2" />
              <h3 className="font-editorial text-lg font-bold text-[#1A1D1A] dark:text-slate-100">Không tìm thấy sự kiện nào</h3>
              <p className="text-xs text-[#5A635B] dark:text-slate-400 mt-1">Hãy thử xóa bộ lọc tìm kiếm để xem tất cả lễ hội.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map(evt => (
                <article
                  key={evt.id || evt.eventId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8EBE5] dark:border-slate-800 p-5 hover:border-[#246B4A]/40 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FFF5EE] dark:bg-amber-950/40 text-[#C26D38] dark:text-amber-400 text-[11px] font-bold border border-[#C26D38]/20 dark:border-amber-700/30 flex items-center gap-1">
                        <Calendar size={12} />
                        {evt.time || evt.monthOccurred || 'Đang cập nhật'}
                      </span>
                      {evt.frequency && (
                        <span className="text-[11px] text-[#5A635B] dark:text-slate-400 font-medium bg-[#FAFAF7] dark:bg-slate-800 px-2 py-0.5 rounded-full border border-[#E8EBE5] dark:border-slate-700">
                          {evt.frequency}
                        </span>
                      )}
                    </div>

                    <h2 className="font-editorial text-lg font-bold text-[#1A1D1A] dark:text-slate-100 mb-2 leading-snug">
                      {evt.name}
                    </h2>

                    {evt.highlight && (
                      <div className="p-3 rounded-xl bg-[#EAF3EB] dark:bg-emerald-950/30 border border-[#246B4A]/15 dark:border-emerald-800/30 text-xs text-[#246B4A] dark:text-emerald-300 font-medium mb-3 flex items-start gap-2">
                        <Sparkles size={15} className="shrink-0 mt-0.5" />
                        <span>{evt.highlight || evt.highlightActivity}</span>
                      </div>
                    )}

                    <p className="text-xs text-[#5A635B] dark:text-slate-300 leading-relaxed mb-4">
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E8EBE5] dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-[#5A635B] dark:text-slate-400">
                      <MapPin size={13} className="text-[#246B4A] shrink-0" />
                      <span className="font-medium">{evt.locationName || 'Địa điểm tại Gia Lai'}</span>
                    </div>

                    {evt.locationId && (
                      <Link
                        to={`/destinations/${evt.locationId}`}
                        className="inline-flex items-center gap-1 text-[#246B4A] dark:text-emerald-400 font-bold hover:underline"
                      >
                        <span>Xem địa điểm</span>
                        <ChevronRight size={14} />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )
        ) : (
          /* TAB 2: ĐIỂM VUI CHƠI & GIẢI TRÍ */
          loadingEnts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <div key={n} className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8EBE5] dark:border-slate-800 overflow-hidden animate-pulse">
                  <div className="w-full aspect-[16/10] bg-[#E8EBE5] dark:bg-slate-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-[#E8EBE5] dark:bg-slate-800 rounded w-2/3" />
                    <div className="h-4 bg-[#E8EBE5] dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEnts.length === 0 ? (
            <div className="empty-state-card text-center my-8 p-8">
              <Music size={32} className="mx-auto text-[#8A948C] mb-2" />
              <h3 className="font-editorial text-lg font-bold text-[#1A1D1A] dark:text-slate-100">Không tìm thấy điểm vui chơi nào</h3>
              <p className="text-xs text-[#5A635B] dark:text-slate-400 mt-1">Hãy thử xóa bộ lọc tìm kiếm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredEnts.map(ent => (
                <article
                  key={ent.id || ent.entId}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-[#E8EBE5] dark:border-slate-800 overflow-hidden hover:border-[#246B4A]/40 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    {ent.imageUrl && (
                      <div className="relative w-full aspect-[16/10] bg-[#E8EBE5] dark:bg-slate-800 overflow-hidden">
                        <img
                          src={ent.imageUrl}
                          alt={ent.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          onError={e => {
                            e.target.src = DEFAULT_EVENT_THUMB
                          }}
                        />
                        <span className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold">
                          {ent.type || ent.entertainmentType || 'Vui chơi'}
                        </span>
                      </div>
                    )}

                    <div className="p-4">
                      <h2 className="font-editorial text-base font-bold text-[#1A1D1A] dark:text-slate-100 mb-1">
                        {ent.name}
                      </h2>

                      <div className="flex items-center gap-1.5 text-xs text-[#5A635B] dark:text-slate-400 mb-2">
                        <MapPin size={13} className="text-[#246B4A] shrink-0" />
                        <span className="line-clamp-1">{ent.address || 'TP. Pleiku, Gia Lai'}</span>
                      </div>

                      <p className="text-xs text-[#5A635B] dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                        {ent.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <div className="pt-3 border-t border-[#E8EBE5] dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[#8A948C] dark:text-slate-400">
                        <Clock size={13} />
                        {ent.openHours || 'Mở cả ngày'}
                      </span>
                      <span className="font-bold text-[#C26D38] dark:text-amber-400">
                        {(!ent.budget || ent.budget === 0) 
                          ? 'Miễn phí vé' 
                          : `${Number(ent.budget).toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}
