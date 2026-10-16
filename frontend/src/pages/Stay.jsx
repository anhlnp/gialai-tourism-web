import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  MapPin,
  Star,
  Navigation,
  Camera,
  Users,
  Sparkles,
  Bookmark,
  Map as MapIcon,
  Check,
  Phone,
  ArrowRight
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import ImageGalleryModal from '../components/ImageGalleryModal'

export default function Stay() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDistrict, setSelectedDistrict] = useState('all')
  const [galleryModal, setGalleryModal] = useState({ isOpen: false, images: [], title: '' })
  const [savedIds, setSavedIds] = useState([])
  const navigate = useNavigate()

  const params = search ? { search } : {}
  const { data: rawStays, loading } = useApi('/accommodations', { params })

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
      setSavedIds(saved.map(item => item.id))
    } catch {
      setSavedIds([])
    }
  }, [])

  const toggleSave = (stay, e) => {
    e.stopPropagation()
    try {
      const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
      const stayId = stay.id || stay.accId
      let next
      if (savedIds.includes(stayId)) {
        next = saved.filter(item => item.id !== stayId)
        setSavedIds(savedIds.filter(id => id !== stayId))
      } else {
        next = [
          ...saved,
          {
            id: stayId,
            name: stay.name,
            imageUrl: stay.imageUrl,
            address: stay.address,
            budget: stay.budget || stay.pricePerNight,
            ratingAvg: stay.ratingAvg,
            type: 'stay',
            description: stay.description
          }
        ]
        setSavedIds([...savedIds, stayId])
      }
      localStorage.setItem('saved_places', JSON.stringify(next))
    } catch (err) {
      console.error(err)
    }
  }

  // Filtering based on category & district
  const filteredStays = useMemo(() => {
    if (!rawStays) return []
    return rawStays.filter((stay) => {
      // Type filter
      if (selectedCategory !== 'all') {
        const type = (stay.stayType || '').toLowerCase()
        if (selectedCategory === 'homestay') {
          if (!type.includes('homestay') && !type.includes('farmstay') && !type.includes('camp')) return false
        } else if (selectedCategory === 'hotel') {
          if (!type.includes('khách sạn') && !type.includes('hotel')) return false
        } else if (selectedCategory === 'resort') {
          if (!type.includes('resort') && !type.includes('4 sao') && !type.includes('5 sao')) return false
        }
      }

      // District filter
      if (selectedDistrict !== 'all') {
        const addr = (stay.address || '').toLowerCase()
        if (!addr.includes(selectedDistrict.toLowerCase())) return false
      }

      return true
    })
  }, [rawStays, selectedCategory, selectedDistrict])

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
    <div className="page" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        {/* ── Header (Stitch Screen 4) ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              <Sparkles size={14} />
              <span>Chốn nghỉ dưỡng & Lưu trú bản địa</span>
            </div>
            <h1 className="font-editorial" style={{ fontSize: '2.2rem', margin: '4px 0 6px 0', color: 'var(--color-text)' }}>
              Khách sạn & <span className="editorial-italic">Homestay</span>
            </h1>
            <p style={{ color: 'var(--color-text-3)', fontSize: '0.95rem', margin: 0 }}>
              Tìm nơi nghỉ ngơi hoàn hảo giữa phố núi sương mù, thung lũng thông reo và farmstay sinh thái
            </p>
          </div>

          <button
            onClick={() => navigate('/map')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-border)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <MapIcon size={16} /> Xem trên Bản đồ
          </button>
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
              placeholder="Tìm homestay, farmstay, khách sạn theo tên hoặc địa chỉ..."
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

        {/* ── Type Filter Pills ── */}
        <div className="filter-chips-row" style={{ marginBottom: '12px' }}>
          {[
            { id: 'all', label: 'Tất cả cơ sở' },
            { id: 'hotel', label: 'Khách sạn trung tâm' },
            { id: 'homestay', label: 'Homestay & Farmstay' },
            { id: 'resort', label: 'Resort & Cao cấp' }
          ].map((cat) => (
            <button
              key={cat.id}
              className={`chip-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── District Secondary Pills ── */}
        <div className="filter-chips-row" style={{ marginBottom: '28px' }}>
          {[
            { id: 'all', label: 'Toàn tỉnh Gia Lai' },
            { id: 'pleiku', label: 'TP. Pleiku' },
            { id: 'chư păh', label: 'Chư Păh' },
            { id: 'kbang', label: 'K\'Bang' },
            { id: 'đắk đoa', label: 'Đắk Đoa' }
          ].map((dist) => (
            <button
              key={dist.id}
              className={`chip-pill ${selectedDistrict === dist.id ? 'active' : ''}`}
              onClick={() => setSelectedDistrict(dist.id)}
              style={{ fontSize: '11.5px', padding: '4px 12px' }}
            >
              {dist.label}
            </button>
          ))}
        </div>

        {/* ── Stays Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ height: '300px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-3)' }} className="skeleton" />
            ))}
          </div>
        ) : filteredStays.length === 0 ? (
          <div className="empty-state-card">
            <h3 className="font-display" style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Không tìm thấy cơ sở lưu trú</h3>
            <p style={{ color: 'var(--color-text-3)', fontSize: '0.9rem' }}>Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc khác.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredStays.map((stay) => {
              const stayId = stay.id || stay.accId
              const isSaved = savedIds.includes(stayId)
              const hasPhotos = stay.imageUrls && stay.imageUrls.length > 1

              return (
                <div
                  key={stayId}
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
                      src={stay.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'}
                      alt={stay.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />

                    {/* Bookmark Toggle */}
                    <button
                      onClick={(e) => toggleSave(stay, e)}
                      aria-label="Lưu nơi lưu trú"
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

                    {/* Type Badge */}
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
                      {stay.stayType || 'Lưu trú'}
                    </span>

                    {/* Gallery button if multi-photo */}
                    {hasPhotos && (
                      <button
                        onClick={(e) => openGallery(stay, e)}
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
                        <Camera size={12} /> {stay.imageUrls.length} ảnh
                      </button>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                          {stay.name}
                        </h3>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: 'var(--color-terracotta)' }}>
                          <Star size={13} fill="var(--color-terracotta)" />
                          {stay.ratingAvg || 4.8}
                        </span>
                      </div>

                      {stay.address && (
                        <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-3)', margin: '0 0 10px 0' }}>
                          <MapPin size={13} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stay.address}</span>
                        </p>
                      )}

                      {stay.description && (
                        <p style={{
                          fontSize: '13px',
                          color: 'var(--color-text-2)',
                          lineHeight: 1.5,
                          margin: '0 0 12px 0',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {stay.description}
                        </p>
                      )}

                      {/* Suitable tags */}
                      {stay.suitableFor && stay.suitableFor.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          {stay.suitableFor.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '10.5px',
                                background: 'var(--color-bg-3)',
                                color: 'var(--color-text-2)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-pill)'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--color-border-light)'
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-3)', fontWeight: 600 }}>Giá tham khảo</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: '14.5px', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {stay.budget || stay.pricePerNight || 'Liên hệ'}
                        </div>
                      </div>

                      <a
                        href={getMapsUrl(stay)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '7px 14px',
                          background: 'var(--color-bg-3)',
                          color: 'var(--color-primary)',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '12px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid var(--color-border)'
                        }}
                      >
                        <Navigation size={13} /> Chỉ đường
                      </a>
                    </div>
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
