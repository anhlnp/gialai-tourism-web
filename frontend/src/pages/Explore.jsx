import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, Sparkles, BookOpen, Layers, MapPin, Star, Clock, 
  ArrowLeft, Map as MapIcon, Bookmark, SlidersHorizontal, X, ArrowRight, AlertCircle
} from 'lucide-react'
import { useApi, getApi } from '../hooks/useApi'

export default function Explore() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState('filter') // 'filter' | 'fulltext' | 'semantic' | 'hybrid'
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [sortBy, setSortBy] = useState('rating') // 'rating' | 'name'
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
      return saved.map(p => p.id)
    } catch {
      return []
    }
  })

  const toggleSave = (loc, e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
      const exists = saved.some(p => p.id === loc.id)
      let next
      if (exists) {
        next = saved.filter(p => p.id !== loc.id)
      } else {
        next = [...saved, {
          id: loc.id,
          name: loc.name,
          category: loc.category || 'Điểm du lịch',
          district: loc.district || loc.address || 'Gia Lai',
          image_url: loc.image_url,
          rating: loc.rating || 4.8,
          description: loc.description || ''
        }]
      }
      localStorage.setItem('saved_places', JSON.stringify(next))
      setSavedIds(next.map(p => p.id))
    } catch (err) {
      console.error('Error toggling save place:', err)
    }
  }

  const params = {}
  if (search && searchMode === 'filter') params.search = search
  if (selectedCategory) params.category = selectedCategory
  if (selectedDistrict) params.region = selectedDistrict

  const { data: defaultLocations, loading: defaultLoading, error: defaultError, refetch } = useApi('/locations', { params })
  const { data: categories } = useApi('/locations/categories')
  const { data: districts } = useApi('/locations/districts')

  // Search xử lý khi ở chế độ Fulltext, Semantic hoặc Hybrid
  useEffect(() => {
    if (!search.trim() || searchMode === 'filter') {
      setSearchResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        let endpoint = `/search/fulltext?q=${encodeURIComponent(search.trim())}`
        if (searchMode === 'semantic') {
          endpoint = `/search/semantic?q=${encodeURIComponent(search.trim())}`
        } else if (searchMode === 'hybrid') {
          endpoint = `/search/hybrid?q=${encodeURIComponent(search.trim())}`
        }
        const data = await getApi(endpoint)
        setSearchResults(data)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, searchMode])

  let displayLocations = searchResults !== null ? searchResults : (defaultLocations || [])
  
  // Áp dụng Sort phía client
  displayLocations = [...displayLocations].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    return 0
  })

  const loading = defaultLoading || searching

  return (
    <div className="min-h-screen bg-[#FAFAF7] pb-24 md:pb-12 text-[#1A1D1A]">
      {/* Top Filter & Search Header */}
      <header className="sticky top-[68px] z-30 bg-[#FAFAF7]/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[#E8EBE5] dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#1A1D1A] hover:bg-[#E8EBE5]/60 active:scale-95 transition-all"
                title="Quay lại"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="font-editorial text-2xl font-bold text-[#1A1D1A] leading-tight">
                  Điểm du lịch
                </h1>
                <p className="text-xs text-[#5A635B]">
                  Khám phá những danh lam, di tích và cảnh quan Gia Lai
                </p>
              </div>
            </div>

            <Link
              to="/map"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8EBE5] text-[#246B4A] hover:bg-[#F2FCF2] text-xs font-semibold shadow-xs active:scale-95 transition-all"
            >
              <MapIcon size={15} />
              <span>Bản đồ</span>
            </Link>
          </div>

          {/* Search Bar Input */}
          <div className="relative mb-3">
            <div className="w-full h-11 bg-white border border-[#E8EBE5] focus-within:border-[#246B4A] focus-within:ring-2 focus-within:ring-[#246B4A]/10 rounded-2xl px-3.5 flex items-center gap-2.5 shadow-xs transition-all">
              <Search size={18} className="text-[#246B4A] shrink-0" />
              <input
                type="text"
                placeholder={
                  searchMode === 'fulltext'
                    ? "Tìm kiếm toàn văn (thác nước, núi lửa, di tích Tây Sơn...)"
                    : searchMode === 'semantic'
                    ? "Hỏi ngữ nghĩa AI (nơi yên tĩnh ngắm hoàng hôn, di tích tiền sử...)"
                    : searchMode === 'hybrid'
                    ? "Tìm kiếm kết hợp từ khóa và ngữ nghĩa..."
                    : "Tìm danh lam thắng cảnh, di tích, thác nước..."
                }
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent border-none text-sm text-[#1A1D1A] placeholder:text-[#8A948C] focus:outline-none"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="text-[#8A948C] hover:text-[#1A1D1A] p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Search Mode Pill Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 pt-0.5">
            <button
              onClick={() => { setSearchMode('filter'); setSearchResults(null); }}
              className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                searchMode === 'filter'
                  ? 'bg-[#246B4A] text-white shadow-xs'
                  : 'bg-white border border-[#E8EBE5] text-[#5A635B] hover:bg-[#F0F4EC]'
              }`}
            >
              <Layers size={13} /> Lọc chuẩn
            </button>
            <button
              onClick={() => setSearchMode('fulltext')}
              className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                searchMode === 'fulltext'
                  ? 'bg-[#246B4A] text-white shadow-xs'
                  : 'bg-white border border-[#E8EBE5] text-[#5A635B] hover:bg-[#F0F4EC]'
              }`}
            >
              <BookOpen size={13} /> Fulltext BM25
            </button>
            <button
              onClick={() => setSearchMode('semantic')}
              className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                searchMode === 'semantic'
                  ? 'bg-[#246B4A] text-white shadow-xs'
                  : 'bg-white border border-[#E8EBE5] text-[#5A635B] hover:bg-[#F0F4EC]'
              }`}
            >
              <Sparkles size={13} /> Semantic AI
            </button>
            <button
              onClick={() => setSearchMode('hybrid')}
              className={`shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                searchMode === 'hybrid'
                  ? 'bg-[#246B4A] text-white shadow-xs'
                  : 'bg-white border border-[#E8EBE5] text-[#5A635B] hover:bg-[#F0F4EC]'
              }`}
            >
              <Search size={13} /> Hybrid
            </button>
          </div>

          {/* Primary Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap pt-1 pb-1">
            <button
              onClick={() => setSelectedCategory('')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !selectedCategory
                  ? 'bg-[#246B4A] text-white'
                  : 'bg-white border border-[#E8EBE5] text-[#5A635B] hover:bg-[#F0F4EC]'
              }`}
            >
              Tất cả
            </button>
            {categories?.map(c => (
              <button
                key={c.id || c.name}
                onClick={() => setSelectedCategory(selectedCategory === c.name ? '' : c.name)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === c.name
                    ? 'bg-[#246B4A] text-white'
                    : 'bg-white border border-[#E8EBE5] text-[#5A635B] hover:bg-[#F0F4EC]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Secondary District & Sort Filters */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E8EBE5]/80 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <select
                value={selectedDistrict}
                onChange={e => setSelectedDistrict(e.target.value)}
                className="bg-white border border-[#E8EBE5] rounded-full px-3 py-1 text-xs text-[#5A635B] focus:outline-none focus:border-[#246B4A]"
              >
                <option value="">Khu vực: Toàn tỉnh</option>
                {districts?.map(d => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-white border border-[#E8EBE5] rounded-full px-3 py-1 text-xs text-[#5A635B] focus:outline-none focus:border-[#246B4A]"
              >
                <option value="rating">Sắp xếp: Đánh giá cao nhất</option>
                <option value="name">Sắp xếp: Tên A-Z</option>
              </select>
            </div>

            <span className="text-[11px] text-[#8A948C] shrink-0">
              {displayLocations.length} địa điểm
            </span>
          </div>
        </div>
      </header>

      {/* Main Content List */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white rounded-2xl border border-[#E8EBE5] overflow-hidden animate-pulse">
                <div className="w-full aspect-[16/10] bg-[#E8EBE5]" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-[#E8EBE5] rounded w-3/4" />
                  <div className="h-4 bg-[#E8EBE5] rounded w-1/2" />
                  <div className="h-12 bg-[#E8EBE5] rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : defaultError && displayLocations.length === 0 ? (
          <div className="empty-state-card text-center my-8 p-6 bg-red-50/50 border border-red-200 rounded-2xl max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3 text-red-600">
              <AlertCircle size={26} />
            </div>
            <h3 className="font-editorial text-lg font-bold text-red-900 mb-1">
              Không thể tải dữ liệu điểm đến
            </h3>
            <p className="text-xs text-red-700 max-w-sm mx-auto mb-4">
              {defaultError}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-full bg-[#246B4A] text-white text-xs font-semibold hover:bg-[#1E573C] transition-all"
            >
              Thử lại kết nối
            </button>
          </div>
        ) : displayLocations.length === 0 ? (
          <div className="empty-state-card text-center my-8">
            <div className="w-14 h-14 rounded-full bg-[#E8EBE5] flex items-center justify-center mx-auto mb-3 text-[#5A635B]">
              <Search size={26} />
            </div>
            <h3 className="font-editorial text-lg font-bold text-[#1A1D1A] mb-1">
              Không tìm thấy địa điểm phù hợp
            </h3>
            <p className="text-xs text-[#5A635B] max-w-sm mx-auto mb-4">
              Hãy thử xóa bộ lọc tìm kiếm hoặc chuyển sang chế độ Semantic Search để tìm kiếm theo ngữ nghĩa thông minh.
            </p>
            <button
              onClick={() => {
                setSearch('')
                setSelectedCategory('')
                setSelectedDistrict('')
                setSearchResults(null)
              }}
              className="px-4 py-2 rounded-full bg-[#246B4A] text-white text-xs font-semibold hover:bg-[#1E573C] transition-all"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayLocations.map(loc => {
              const isSaved = savedIds.includes(loc.id)
              const cardImage = loc.imageUrl || loc.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop'
              const isFree = loc.budget === 0 || loc.budget === '0' || loc.budget === 'Miễn phí' || loc.ticket_price === 'Miễn phí' || loc.ticket_price === 0
              const ratingDisplay = loc.avgRating || loc.rating || 4.8
              const timeDisplay = loc.bestTime || loc.best_time_to_visit || loc.opening_hours || 'Mở cả ngày'

              return (
                <article
                  key={loc.id}
                  className="bg-white rounded-2xl border border-[#E8EBE5] overflow-hidden flex flex-col hover:border-[#246B4A]/40 transition-all shadow-xs group"
                >
                  {/* Card Image Thumbnail */}
                  <div className="relative w-full aspect-[16/10] bg-[#E8EBE5] overflow-hidden">
                    <img
                      src={cardImage}
                      alt={loc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => {
                        e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop'
                      }}
                    />
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
                      <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[#1A1D1A] text-[11px] font-semibold border border-white/60 shadow-xs">
                        {loc.category || 'Điểm đến'}
                      </span>
                      {isFree ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#246B4A]/90 text-white text-[11px] font-medium backdrop-blur-xs">
                          Miễn phí vé
                        </span>
                      ) : null}
                    </div>

                    {/* Bookmark Button */}
                    <button
                      onClick={e => toggleSave(loc, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#246B4A] border border-white/60 active:scale-90 transition-transform shadow-sm"
                      title={isSaved ? 'Bỏ lưu' : 'Lưu địa điểm'}
                    >
                      <Bookmark size={18} fill={isSaved ? '#246B4A' : 'none'} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Link
                          to={`/destinations/${loc.id}`}
                          className="font-editorial text-lg font-bold text-[#1A1D1A] group-hover:text-[#246B4A] transition-colors leading-snug line-clamp-1"
                        >
                          {loc.name}
                        </Link>
                        <div className="flex items-center gap-1 shrink-0 text-[#C26D38] font-bold text-xs">
                          <Star size={14} fill="#C26D38" />
                          <span>{ratingDisplay}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[#5A635B] mb-2">
                        <MapPin size={13} className="text-[#246B4A] shrink-0" />
                        <span className="line-clamp-1">{loc.district || loc.address || 'Gia Lai'}</span>
                      </div>

                      <p className="text-xs text-[#5A635B] line-clamp-2 leading-relaxed">
                        {loc.description || 'Thắng cảnh thiên nhiên và di sản văn hóa đặc sắc tại vùng đất đại ngàn Gia Lai.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E8EBE5] flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[#8A948C]">
                        <Clock size={13} />
                        {timeDisplay}
                      </span>
                      <Link
                        to={`/destinations/${loc.id}`}
                        className="inline-flex items-center gap-1 text-[#246B4A] font-semibold hover:underline"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
