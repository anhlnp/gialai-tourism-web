import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Star, Navigation, Camera, Users, Sparkles, ExternalLink } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import ImageGalleryModal from '../components/ImageGalleryModal'

export default function Stay() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [galleryModal, setGalleryModal] = useState({ isOpen: false, images: [], title: '' })

  const params = search ? { search } : {}
  const { data: rawStays, loading } = useApi('/accommodations', { params })

  // Filtering based on category
  const filteredStays = useMemo(() => {
    if (!rawStays) return []
    return rawStays.filter((stay) => {
      if (selectedCategory === 'all') return true
      const type = (stay.stayType || '').toLowerCase()
      if (selectedCategory === 'homestay') {
        return type.includes('homestay') || type.includes('farmstay') || type.includes('camp')
      }
      if (selectedCategory === 'luxury') {
        return type.includes('4 sao') || type.includes('5 sao') || type.includes('resort')
      }
      if (selectedCategory === 'standard') {
        return type.includes('3 sao') || (!type.includes('homestay') && !type.includes('4 sao') && !type.includes('5 sao') && !type.includes('resort'))
      }
      return true
    })
  }, [rawStays, selectedCategory])

  const openGallery = (stay, e) => {
    if (e) e.stopPropagation()
    const imgs = stay.imageUrls && stay.imageUrls.length > 0 ? stay.imageUrls : [stay.imageUrl].filter(Boolean)
    setGalleryModal({
      isOpen: true,
      images: imgs,
      title: stay.name
    })
  }

  const getMapsUrl = (stay) => {
    const query = `${stay.name} ${stay.address || 'Gia Lai'}`
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  return (
    <div className="page" style={{ minHeight: '100vh', paddingBottom: '60px' }}>
      <div className="container section">
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
            <Sparkles size={16} />
            <span>Nơi Nghỉ Dưỡng & Trải Nghiệm Bản Địa</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '10px', color: 'var(--color-text)' }}>
            Lưu Trú & Homestay
          </h1>
          <p style={{ color: 'var(--color-text-2)', fontSize: '1.05rem', maxWidth: '720px' }}>
            Khám phá các homestay view thung lũng thông mộng mơ, farmstay sinh thái chân núi lửa và khách sạn trung tâm cao cấp tại Gia Lai.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <div className="search-bar" style={{ maxWidth: '100%' }}>
            <Search size={20} className="search-icon" />
            <input
              placeholder="Tìm homestay, farmstay, khách sạn theo tên hoặc địa chỉ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { id: 'all', label: 'Tất cả cơ sở' },
              { id: 'homestay', label: '🏡 Homestay & Farmstay sinh thái' },
              { id: 'luxury', label: '⭐ Khách sạn 4-5 sao & Resort' },
              { id: 'standard', label: '🏢 Khách sạn tiện nghi 3 sao' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  fontSize: '0.9rem',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  border: '1px solid',
                  borderColor: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-border)',
                  background: selectedCategory === cat.id ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: selectedCategory === cat.id ? '#ffffff' : 'var(--color-text-2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedCategory === cat.id ? '0 4px 12px rgba(5, 150, 105, 0.25)' : 'none'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accommodation Cards Grid */}
        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '26px' }}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 380, borderRadius: '16px' }} />
            ))
          ) : filteredStays.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-3)' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Không tìm thấy nơi lưu trú phù hợp</p>
              <p style={{ fontSize: '0.9rem' }}>Thử tìm kiếm với từ khóa khác như "Homestay", "Pleiku", "Farmstay"</p>
            </div>
          ) : (
            filteredStays.map((stay, i) => {
              const photoCount = stay.imageUrls?.length || (stay.imageUrl ? 1 : 0)
              const hasMultiplePhotos = photoCount > 1

              return (
                <motion.div
                  key={stay.id || i}
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
                  {/* Image area with photo album trigger */}
                  <div
                    className="card-image"
                    style={{ height: '220px', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
                    onClick={(e) => openGallery(stay, e)}
                    title="Nhấn để xem toàn bộ album ảnh"
                  >
                    <img
                      src={stay.imageUrl || (stay.imageUrls && stay.imageUrls[0]) || 'https://placehold.co/600x400/1e293b/94a3b8?text=Homestay'}
                      alt={stay.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Stay type badge */}
                    <span
                      className="card-badge"
                      style={{
                        top: 12,
                        left: 12,
                        background: 'rgba(15, 23, 42, 0.82)',
                        color: '#34d399',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        backdropFilter: 'blur(8px)',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      {stay.stayType || 'Lưu trú'}
                    </span>

                    {/* Rating badge */}
                    {stay.ratingAvg && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          background: 'rgba(15, 23, 42, 0.82)',
                          backdropFilter: 'blur(8px)',
                          padding: '4px 10px',
                          borderRadius: '999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#fbbf24',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          border: '1px solid rgba(251, 191, 36, 0.3)'
                        }}
                      >
                        <Star size={13} fill="#fbbf24" color="#fbbf24" />
                        <span>{stay.ratingAvg}</span>
                      </span>
                    )}

                    {/* Photo count indicator badge */}
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
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <Camera size={13} />
                      <span>{photoCount} ảnh</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '18px' }}>
                    {/* Stay Name */}
                    <h3
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        marginBottom: '8px',
                        color: 'var(--color-text)',
                        lineHeight: 1.35
                      }}
                    >
                      {stay.name}
                    </h3>

                    {/* Address with icon */}
                    {stay.address && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px',
                          color: 'var(--color-text-2)',
                          fontSize: '0.85rem',
                          marginBottom: '10px',
                          lineHeight: 1.4
                        }}
                      >
                        <MapPin size={15} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {stay.address}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {stay.description && (
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
                        {stay.description}
                      </p>
                    )}

                    {/* Suitable For Tags */}
                    {stay.suitableFor && stay.suitableFor.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                        {stay.suitableFor.map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'var(--color-bg-3)',
                              color: 'var(--color-text-2)',
                              fontSize: '0.74rem',
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontWeight: 500
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price and Action Bar */}
                    <div
                      style={{
                        marginTop: 'auto',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-3)', fontWeight: 500 }}>
                          Giá tham khảo
                        </div>
                        <div className="price" style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          {stay.budget || stay.pricePerNight || 'Liên hệ'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {hasMultiplePhotos && (
                          <button
                            onClick={(e) => openGallery(stay, e)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid var(--color-border)',
                              background: 'var(--color-bg-3)',
                              color: 'var(--color-text)',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'background 0.2s ease'
                            }}
                            title="Xem tất cả ảnh"
                          >
                            <Camera size={14} />
                            <span>Album</span>
                          </button>
                        )}

                        <a
                          href={getMapsUrl(stay)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--color-primary)',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                            transition: 'opacity 0.2s ease'
                          }}
                        >
                          <Navigation size={14} />
                          <span>Chỉ đường</span>
                        </a>
                      </div>
                    </div>
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
