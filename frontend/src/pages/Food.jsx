import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, UtensilsCrossed, Clock, MapPin, Navigation, Camera, Sparkles, ChevronDown, ChevronUp, Store } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import ImageGalleryModal from '../components/ImageGalleryModal'

function parseEatery(raw) {
  if (!raw) return { name: '', address: '', hours: '', query: '' }
  
  // Format 1: Name (Address - Hours)
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

  // Format 2: Name - Address (Hours)
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

  const params = search ? { search } : {}
  const { data: rawDishes, loading } = useApi('/dishes', { params })

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
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  return (
    <div className="page" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <div className="container section">
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(234, 88, 12, 0.1)', color: '#ea580c', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
            <Sparkles size={16} />
            <span>Tinh Hoa Ẩm Thực Phố Núi Gia Lai</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px', color: 'var(--color-text)' }}>
            Ẩm Thực Đặc Sản & Quán Ăn Đề Xuất
          </h1>
          <p style={{ color: 'var(--color-text-2)', fontSize: '1.05rem', maxWidth: '720px' }}>
            Khám phá 25 món ăn trứ danh Gia Lai kèm địa chỉ quán ăn nổi tiếng, giờ mở cửa và chỉ đường Google Maps chính xác nhất.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <div className="search-bar" style={{ maxWidth: '100%' }}>
            <Search size={20} className="search-icon" />
            <input
              placeholder="Tìm món ngon, tên quán ăn đề xuất (Phở hai tô, Gà nướng bazan, Bún cua...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { id: 'all', label: 'Tất cả đặc sản' },
              { id: 'morning', label: '🌅 Bữa sáng' },
              { id: 'main', label: '🍗 Bữa trưa & tối' },
              { id: 'snack', label: '🍢 Ăn vặt & Nhâm nhi' },
              { id: 'trend', label: '🔥 Món Hot Trend' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setSelectedFilter(chip.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: selectedFilter === chip.id ? 700 : 500,
                  border: '1px solid',
                  borderColor: selectedFilter === chip.id ? '#ea580c' : 'var(--color-border)',
                  background: selectedFilter === chip.id ? '#ea580c' : 'var(--color-surface)',
                  color: selectedFilter === chip.id ? '#ffffff' : 'var(--color-text-2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedFilter === chip.id ? '0 4px 12px rgba(234, 88, 12, 0.25)' : 'none'
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dishes Cards Grid */}
        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '26px' }}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 420, borderRadius: '16px' }} />
            ))
          ) : filteredDishes.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-3)' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Không tìm thấy món ăn phù hợp</p>
              <p style={{ fontSize: '0.9rem' }}>Thử tìm kiếm với từ khóa khác như "Phở khô", "Gà nướng", "Cà phê"</p>
            </div>
          ) : (
            filteredDishes.map((dish, i) => {
              const eateries = (dish.suggestedEateries || []).map(parseEatery)
              const photoCount = dish.imageUrls?.length || (dish.imageUrl ? 1 : 0)
              const hasMultiplePhotos = photoCount > 1
              const isExpanded = !!expandedEateries[dish.id || i]

              return (
                <motion.div
                  key={dish.id || i}
                  className="card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    position: 'relative'
                  }}
                >
                  {/* Dish Image */}
                  <div
                    className="card-image"
                    style={{ height: '210px', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                    onClick={(e) => openGallery(dish, e)}
                    title="Nhấn để xem album ảnh món ăn"
                  >
                    <img
                      src={dish.imageUrl || (dish.imageUrls && dish.imageUrls[0]) || 'https://placehold.co/600x400/1e293b/94a3b8?text=Food'}
                      alt={dish.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600'
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Meal time badge */}
                    {dish.mealTime && (
                      <span
                        className="card-badge"
                        style={{
                          top: 12,
                          left: 12,
                          background: 'rgba(15, 23, 42, 0.85)',
                          color: '#f97316',
                          border: '1px solid rgba(249, 115, 22, 0.3)',
                          backdropFilter: 'blur(8px)',
                          fontWeight: 600,
                          fontSize: '0.8rem'
                        }}
                      >
                        {dish.mealTime}
                      </span>
                    )}

                    {/* Photo count indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        background: 'rgba(0, 0, 0, 0.72)',
                        backdropFilter: 'blur(6px)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        border: '1px solid rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <Camera size={13} />
                      <span>{photoCount} ảnh</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '18px' }}>
                    {/* Dish Name */}
                    <h3
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        marginBottom: '6px',
                        color: 'var(--color-text)',
                        lineHeight: 1.35
                      }}
                    >
                      {dish.name}
                    </h3>

                    {/* Description */}
                    {dish.description && (
                      <p
                        style={{
                          fontSize: '0.88rem',
                          color: 'var(--color-text-2)',
                          marginBottom: '12px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.5
                        }}
                      >
                        {dish.description}
                      </p>
                    )}

                    {/* Price Range */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span className="price" style={{ fontSize: '1rem', fontWeight: 800, color: '#ea580c' }}>
                        {dish.budget || 'Giá tham khảo bình dân'}
                      </span>
                      {dish.regions && dish.regions.length > 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', fontWeight: 500 }}>
                          {dish.regions.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* SECTION: Quán ăn đề xuất */}
                    {eateries.length > 0 && (
                      <div
                        style={{
                          background: 'var(--color-bg-3)',
                          borderRadius: '12px',
                          padding: '14px',
                          marginTop: 'auto',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        {/* Section Title */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text)' }}>
                            <UtensilsCrossed size={15} color="#ea580c" />
                            <span>Quán ăn đề xuất ({eateries.length})</span>
                          </div>

                          {eateries.length > 1 && (
                            <button
                              onClick={() => toggleExpand(dish.id || i)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ea580c',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                padding: 0
                              }}
                            >
                              <span>{isExpanded ? 'Thu gọn' : `+${eateries.length - 1} quán khác`}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>

                        {/* Primary Eatery (Always visible) */}
                        {(() => {
                          const top = eateries[0]
                          return (
                            <div
                              style={{
                                background: 'var(--color-surface)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                border: '1px solid var(--color-border)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                  {top.name}
                                </div>
                                <a
                                  href={getMapsUrl(top.query)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(234, 88, 12, 0.1)',
                                    color: '#ea580c',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    flexShrink: 0
                                  }}
                                  title="Mở chỉ đường trên Google Maps"
                                >
                                  <Navigation size={12} />
                                  <span>Bản đồ</span>
                                </a>
                              </div>

                              {top.address && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.8rem', color: 'var(--color-text-2)', lineHeight: 1.35 }}>
                                  <MapPin size={13} color="var(--color-text-3)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                  <span>{top.address}</span>
                                </div>
                              )}

                              {top.hours && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.76rem', color: 'var(--color-text-3)' }}>
                                  <Clock size={12} />
                                  <span>{top.hours}</span>
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {/* Expanded Eateries List */}
                        <AnimatePresence>
                          {isExpanded && eateries.length > 1 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', overflow: 'hidden' }}
                            >
                              {eateries.slice(1).map((eat, eIdx) => (
                                <div
                                  key={eIdx}
                                  style={{
                                    background: 'var(--color-surface)',
                                    borderRadius: '8px',
                                    padding: '10px 12px',
                                    border: '1px solid var(--color-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '5px'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)' }}>
                                      {eat.name}
                                    </div>
                                    <a
                                      href={getMapsUrl(eat.query)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '3px 8px',
                                        borderRadius: '6px',
                                        background: 'rgba(234, 88, 12, 0.1)',
                                        color: '#ea580c',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        flexShrink: 0
                                      }}
                                      title="Mở chỉ đường trên Google Maps"
                                    >
                                      <Navigation size={12} />
                                      <span>Bản đồ</span>
                                    </a>
                                  </div>

                                  {eat.address && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', fontSize: '0.78rem', color: 'var(--color-text-2)', lineHeight: 1.35 }}>
                                      <MapPin size={13} color="var(--color-text-3)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                      <span>{eat.address}</span>
                                    </div>
                                  )}

                                  {eat.hours && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
                                      <Clock size={12} />
                                      <span>{eat.hours}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Lightbox Photo Gallery Modal */}
      <ImageGalleryModal
        isOpen={galleryModal.isOpen}
        images={galleryModal.images}
        title={galleryModal.title}
        onClose={() => setGalleryModal({ isOpen: false, images: [], title: '' })}
      />
    </div>
  )
}
