import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  UtensilsCrossed,
  Clock,
  MapPin,
  Navigation,
  Camera,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Store,
  ArrowRight
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import ImageGalleryModal from '../components/ImageGalleryModal'

function parseEatery(raw) {
  if (!raw) return { name: '', address: '', hours: '', query: '' }

  // Format: Name (Address - Hours)
  let m = raw.match(/^(.*?)\s*\((.*?)\)$/)
  if (m) {
    const name = m[1].trim()
    const inner = m[2].trim()
    const parts = inner.split(' - ')
    if (parts.length >= 2) {
      const hours = parts[parts.length - 1].trim()
      const address = parts.slice(0, -1).join(' - ').trim()
      return { name, address, hours, query: `${name} ${address}` }
    }
    return { name, address: inner, hours: '', query: `${name} ${inner}` }
  }

  // Format: Name - Address (Hours)
  m = raw.match(/^(.*?)\s*-\s*(.*?)\s*\((.*?)\)$/)
  if (m) {
    const name = m[1].trim()
    const address = m[2].trim()
    const hours = m[3].trim()
    return { name, address, hours, query: `${name} ${address}` }
  }

  return { name: raw, address: '', hours: '', query: raw }
}

export default function Food() {
  const [search, setSearch] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [expandedEateries, setExpandedEateries] = useState({})
  const [galleryModal, setGalleryModal] = useState({ isOpen: false, images: [], title: '' })
  const [savedIds, setSavedIds] = useState([])

  const params = search ? { search } : {}
  const { data: rawDishes, loading } = useApi('/dishes', { params })

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
      setSavedIds(saved.map(item => item.id))
    } catch {
      setSavedIds([])
    }
  }, [])

  const toggleSave = (dish, e) => {
    e.stopPropagation()
    try {
      const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
      const dishId = dish.id || dish.dishId
      let next
      if (savedIds.includes(dishId)) {
        next = saved.filter(item => item.id !== dishId)
        setSavedIds(savedIds.filter(id => id !== dishId))
      } else {
        next = [
          ...saved,
          {
            id: dishId,
            name: dish.name,
            imageUrl: dish.imageUrl,
            budget: dish.budget,
            type: 'food',
            description: dish.description
          }
        ]
        setSavedIds([...savedIds, dishId])
      }
      localStorage.setItem('saved_places', JSON.stringify(next))
    } catch (err) {
      console.error(err)
    }
  }

  // Filter dishes
  const filteredDishes = useMemo(() => {
    if (!rawDishes) return []
    return rawDishes.filter((dish) => {
      if (selectedFilter === 'all') return true
      const meal = (dish.mealTime || '').toLowerCase()
      const taste = (dish.tasteType || '').toLowerCase()

      if (selectedFilter === 'morning') return meal.includes('sáng')
      if (selectedFilter === 'main') return meal.includes('trưa') || meal.includes('tối')
      if (selectedFilter === 'snack') return meal.includes('vặt') || meal.includes('nhâm nhi') || meal.includes('chiều')
      if (selectedFilter === 'trend') return taste.includes('hot_trend') || taste.includes('trend')
      return true
    })
  }, [rawDishes, selectedFilter])

  const toggleExpand = (dishId) => {
    setExpandedEateries((prev) => ({
      ...prev,
      [dishId]: !prev[dishId]
    }))
  }

  const openGallery = (dish, e) => {
    if (e) e.stopPropagation()
    const imgs = dish.imageUrls && dish.imageUrls.length > 0 ? dish.imageUrls : [dish.imageUrl].filter(Boolean)
    setGalleryModal({
      isOpen: true,
      images: imgs,
      title: dish.name
    })
  }

  const getMapsUrl = (query) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query + ' Gia Lai')}`
  }

  return (
    <div className="page" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        {/* ── Header (Stitch Screen 5) ── */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-terracotta)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '4px' }}>
            <UtensilsCrossed size={14} />
            <span>Mỹ vị đại ngàn • Thổ nhưỡng Tây Nguyên</span>
          </div>
          <h1 className="font-editorial" style={{ fontSize: '2.2rem', margin: '2px 0 6px 0', color: 'var(--color-text)' }}>
            Ẩm thực <span className="editorial-italic">Gia Lai</span>
          </h1>
          <p style={{ color: 'var(--color-text-3)', fontSize: '0.95rem', margin: 0, maxWidth: '640px' }}>
            Khám phá hương vị phở khô hai tô trứ danh, gà nướng than hồng cơm lam ống nứa và bò một nắng muối kiến vàng Krông Pa.
          </p>
        </div>

        {/* ── Search Bar Pill ── */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-pill)',
            padding: '6px 16px',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <Search size={18} style={{ color: 'var(--color-primary)', marginRight: '10px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Tìm món ăn, đặc sản hoặc quán ngon Gia Lai..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                background: 'transparent',
                color: 'var(--color-text)',
                fontSize: '14px',
                fontFamily: 'var(--font-body)'
              }}
            />
          </div>
        </div>

        {/* ── Filter Chips Row ── */}
        <div className="filter-chips-row" style={{ marginBottom: '28px' }}>
          {[
            { id: 'all', label: 'Tất cả món đặc sản' },
            { id: 'morning', label: 'Bữa sáng phố núi' },
            { id: 'main', label: 'Bữa chính (Trưa/Tối)' },
            { id: 'snack', label: 'Ăn vặt & Cà phê' },
            { id: 'trend', label: 'Món Hot Trend' }
          ].map((cat) => (
            <button
              key={cat.id}
              className={`chip-pill ${selectedFilter === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Dishes Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ height: '320px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-3)' }} className="skeleton" />
            ))}
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="empty-state-card">
            <h3 className="font-display" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Không tìm thấy món ăn</h3>
            <p style={{ color: 'var(--color-text-3)', fontSize: '0.9rem' }}>Vui lòng thử lại với từ khóa tìm kiếm khác.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredDishes.map((dish) => {
              const dishId = dish.id || dish.dishId
              const isSaved = savedIds.includes(dishId)
              const hasPhotos = dish.imageUrls && dish.imageUrls.length > 1
              const eateries = dish.suggestedEateries || []
              const isExpanded = !!expandedEateries[dishId]

              return (
                <div
                  key={dishId}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {/* Card Image */}
                  <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800'}
                      alt={dish.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />

                    {/* Bookmark Toggle */}
                    <button
                      onClick={(e) => toggleSave(dish, e)}
                      aria-label="Lưu món ăn"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        background: isSaved ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(8px)',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSaved ? '#ffffff' : 'var(--color-text)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <Bookmark size={16} fill={isSaved ? '#ffffff' : 'none'} />
                    </button>

                    {/* Meal Time Badge */}
                    {dish.mealTime && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(8px)',
                        color: 'var(--color-primary)',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)'
                      }}>
                        {dish.mealTime}
                      </span>
                    )}

                    {/* Gallery button */}
                    {hasPhotos && (
                      <button
                        onClick={(e) => openGallery(dish, e)}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          background: 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(6px)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 'var(--radius-pill)',
                          padding: '3px 9px',
                          fontSize: '11px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Camera size={12} /> {dish.imageUrls.length} ảnh
                      </button>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                          {dish.name}
                        </h3>
                        {dish.tasteType && (
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: dish.tasteType === 'HOT_TREND' ? 'var(--color-terracotta-soft)' : 'var(--color-primary-light)',
                            color: dish.tasteType === 'HOT_TREND' ? 'var(--color-terracotta)' : 'var(--color-primary)'
                          }}>
                            {dish.tasteType === 'HOT_TREND' ? 'Hot Trend' : 'Truyền thống'}
                          </span>
                        )}
                      </div>

                      {dish.budget && (
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-terracotta)', marginBottom: '8px' }}>
                          {dish.budget}
                        </div>
                      )}

                      {dish.description && (
                        <p style={{
                          fontSize: '13px',
                          color: 'var(--color-text-2)',
                          lineHeight: 1.5,
                          margin: '0 0 14px 0'
                        }}>
                          {dish.description}
                        </p>
                      )}
                    </div>

                    {/* Eateries List */}
                    {eateries.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '12px' }}>
                        <div
                          onClick={() => toggleExpand(dishId)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            color: 'var(--color-primary)',
                            fontSize: '12.5px',
                            fontWeight: 600,
                            userSelect: 'none'
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Store size={14} /> Gợi ý {eateries.length} quán ngon
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>

                        {/* Expanded Eateries List */}
                        {isExpanded && (
                          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {eateries.map((raw, idx) => {
                              const eInfo = parseEatery(raw)
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    background: 'var(--color-bg-3)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '9px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '8px'
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text)' }}>
                                      {eInfo.name}
                                    </div>
                                    {eInfo.address && (
                                      <div style={{ fontSize: '11px', color: 'var(--color-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {eInfo.address}
                                      </div>
                                    )}
                                  </div>

                                  <a
                                    href={getMapsUrl(eInfo.query)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '11px',
                                      color: 'var(--color-primary)',
                                      fontWeight: 600,
                                      textDecoration: 'none',
                                      background: '#ffffff',
                                      padding: '4px 8px',
                                      borderRadius: 'var(--radius-pill)',
                                      border: '1px solid var(--color-border)',
                                      flexShrink: 0
                                    }}
                                  >
                                    <Navigation size={11} /> Chỉ đường
                                  </a>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ImageGalleryModal
        isOpen={galleryModal.isOpen}
        images={galleryModal.images}
        title={galleryModal.title}
        onClose={() => setGalleryModal({ isOpen: false, images: [], title: '' })}
      />
    </div>
  )
}
