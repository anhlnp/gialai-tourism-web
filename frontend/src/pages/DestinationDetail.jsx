import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin,
  Star,
  Clock,
  Ticket,
  UtensilsCrossed,
  Hotel,
  ArrowRight,
  Navigation,
  ChevronLeft,
  Share2,
  Bookmark,
  Calendar,
  Sparkles,
  Camera,
  Check,
  Quote
} from 'lucide-react'
import { useApi } from '../hooks/useApi'

export default function DestinationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useApi(`/locations/${id}`)
  const [isSaved, setIsSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
      setIsSaved(saved.some(item => item.id === id))
    } catch {
      setIsSaved(false)
    }
  }, [id])

  const toggleSave = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
      let next
      if (isSaved) {
        next = saved.filter(item => item.id !== id)
        setIsSaved(false)
      } else {
        next = [
          ...saved,
          {
            id: data.id || id,
            name: data.name,
            imageUrl: data.imageUrl,
            district: data.district,
            category: data.category,
            address: data.address,
            description: data.description,
            ratingAvg: data.avgRating,
            type: 'location'
          }
        ]
        setIsSaved(true)
      }
      localStorage.setItem('saved_places', JSON.stringify(next))
    } catch (e) {
      console.error(e)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: data?.name || 'Du Lịch Gia Lai',
        text: data?.description || '',
        url: window.location.href
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '80px', paddingBottom: '40px', maxWidth: '1200px' }}>
        <div style={{ height: '380px', borderRadius: 'var(--radius-xl)', background: 'var(--color-bg-3)', marginBottom: '24px' }} className="skeleton" />
        <div style={{ height: '120px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-3)', marginBottom: '16px' }} className="skeleton" />
        <div style={{ height: '200px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-3)' }} className="skeleton" />
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="container" style={{ paddingTop: '100px', textAlign: 'center', maxWidth: '600px' }}>
        <h1 className="font-editorial" style={{ fontSize: '2rem', marginBottom: '12px' }}>Không tìm thấy điểm đến</h1>
        <p style={{ color: 'var(--color-text-3)', marginBottom: '24px' }}>Điểm đến có thể đang được cập nhật thông tin trên Đồ thị Tri thức.</p>
        <button onClick={() => navigate('/explore')} className="btn btn-primary">
          Quay lại danh sách Khám phá
        </button>
      </div>
    )
  }

  const bestTimeStr = Array.isArray(data.bestTime)
    ? data.bestTime.join(' • ')
    : (data.bestTime || 'Sáng sớm hoặc Hoàng hôn')

  const isFree = data.budget === 0 || data.budget === '0' || data.ticketPrice === 0 || !data.budget
  const budgetFormatted = isFree
    ? 'Miễn phí vé'
    : typeof data.budget === 'number'
      ? `${data.budget.toLocaleString('vi-VN')} đ`
      : data.budget

  const googleMapsUrl = (data.lat && data.lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.name + ' Gia Lai')}`

  const galleryImages = (data.imageUrls && data.imageUrls.length > 0)
    ? data.imageUrls
    : (data.imageUrl ? [data.imageUrl] : [])

  return (
    <div className="pb-24 md:pb-20">
      {/* ── 1. CINEMATIC FULL-BLEED HERO (Stitch Screen 3) ── */}
      <section style={{ position: 'relative', width: '100%', minHeight: '420px', overflow: 'hidden' }}>
        <img
          src={data.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'}
          alt={data.name}
          style={{ width: '100%', height: '440px', objectFit: 'cover' }}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800' }}
        />

        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, var(--color-bg) 100%)'
        }} />

        {/* Floating Top Controls (Glassmorphic) */}
        <div className="container" style={{
          position: 'absolute',
          top: '16px',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Quay lại"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <ChevronLeft size={22} />
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleSave}
              aria-label={isSaved ? 'Bỏ lưu điểm đến' : 'Lưu điểm đến'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: isSaved ? 'var(--color-primary)' : 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSaved ? '#ffffff' : 'var(--color-text)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Bookmark size={18} fill={isSaved ? '#ffffff' : 'none'} />
            </button>

            <button
              onClick={handleShare}
              aria-label="Chia sẻ"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {copied ? <Check size={18} color="var(--color-primary)" /> : <Share2 size={18} />}
            </button>
          </div>
        </div>

        {/* Floating Badges Bottom Hero */}
        <div className="container" style={{
          position: 'absolute',
          bottom: '18px',
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {data.category && (
              <span style={{
                background: 'rgba(255,255,255,0.92)',
                color: 'var(--color-primary)',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                backdropFilter: 'blur(8px)',
                boxShadow: 'var(--shadow-xs)'
              }}>
                {data.category}
              </span>
            )}
            <span style={{
              background: 'rgba(255,255,255,0.92)',
              color: 'var(--color-text)',
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              backdropFilter: 'blur(8px)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <Star size={13} fill="var(--color-terracotta)" color="var(--color-terracotta)" />
              {data.avgRating || 4.8}
            </span>
          </div>

          {data.district && (
            <span style={{
              background: 'rgba(255,255,255,0.85)',
              color: 'var(--color-text-2)',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              backdropFilter: 'blur(8px)'
            }}>
              {data.district}
            </span>
          )}
        </div>
      </section>

      {/* ── 2. DESTINATION IDENTITY & QUICK FACT STRIP ── */}
      <div className="container" style={{ maxWidth: '1200px', marginTop: '20px' }}>
        <div>
          <span style={{
            color: 'var(--color-terracotta)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontSize: '11px',
            fontWeight: 700
          }}>
            Kỳ quan Đại Ngàn Gia Lai
          </span>
          <h1 className="font-editorial" style={{
            fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
            fontWeight: 400,
            lineHeight: 1.2,
            margin: '4px 0 8px 0',
            color: 'var(--color-text)'
          }}>
            {data.name}
          </h1>

          {data.address && (
            <p style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-text-3)',
              fontSize: '13px',
              margin: '0 0 16px 0'
            }}>
              <MapPin size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <span>{data.address}</span>
            </p>
          )}
        </div>

        {/* Fact Strip (3 Columns) */}
        <div className="fact-strip">
          <div className="fact-strip-col">
            <div className="fact-strip-label">Giờ ngắm đẹp</div>
            <div className="fact-strip-val">{bestTimeStr}</div>
            <div className="fact-strip-sub">Khoảnh khắc vàng</div>
          </div>

          <div className="fact-strip-divider" />

          <div className="fact-strip-col">
            <div className="fact-strip-label">Vé tham quan</div>
            <div className="fact-strip-val" style={{ color: isFree ? 'var(--color-primary)' : 'var(--color-terracotta)' }}>
              {budgetFormatted}
            </div>
            <div className="fact-strip-sub">Quy chuẩn địa phương</div>
          </div>

          <div className="fact-strip-divider" />

          <div className="fact-strip-col">
            <div className="fact-strip-label">Địa hạt quản lý</div>
            <div className="fact-strip-val">{data.district || 'Gia Lai'}</div>
            <div className="fact-strip-sub">Cao nguyên Bazan</div>
          </div>
        </div>

        {/* ── 3. EDITORIAL NARRATIVE (Khảo cứu & Biên khảo) ── */}
        <section style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }} />
            <h2 className="font-display" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
              Khảo cứu & Biên khảo địa danh
            </h2>
          </div>

          <p style={{
            fontSize: '14.5px',
            lineHeight: 1.8,
            color: 'var(--color-text-2)',
            textAlign: 'justify',
            margin: 0
          }}>
            {data.description || 'Thắng cảnh tiêu biểu của tỉnh Gia Lai mang đậm dấu ấn địa chất bazan núi lửa cổ đại và không gian văn hóa cồng chiêng Tây Nguyên.'}
          </p>

          <div className="editorial-quote">
            <Quote size={24} style={{ position: 'absolute', top: '10px', right: '12px', opacity: 0.15, color: 'var(--color-primary)' }} />
            "Không gian đại ngàn Gia Lai giao hòa giữa trầm tích triệu năm của đất mẹ bazan và bản sắc ngàn đời của đồng bào Jrai, Bahnar bên bếp lửa nhà rông."
          </div>
        </section>

        {/* ── 4. MULTI-PERSPECTIVE GALLERY (Bộ ảnh thực địa) ── */}
        {galleryImages.length > 0 && (
          <section style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <span style={{ color: 'var(--color-terracotta)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '10px', fontWeight: 700 }}>
                  Thị giác
                </span>
                <h3 className="font-editorial" style={{ fontSize: '1.45rem', margin: '2px 0 0 0', color: 'var(--color-text)' }}>
                  Góc nhìn thực tế <span className="editorial-italic">{data.name}</span>
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--color-text-3)' }}>
                {galleryImages.length} tư liệu ảnh
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              {galleryImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  style={{
                    height: idx === 0 ? '220px' : '180px',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-xs)',
                    gridColumn: idx === 0 && galleryImages.length > 2 ? 'span 2' : 'span 1'
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`${data.name} - ảnh ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 5. KNOWLEDGE NETWORK (Neo4j GraphRAG Relations) ── */}
        <section style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Sparkles size={18} color="var(--color-primary)" />
            <h3 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
              Mạng lưới Tri thức Gia Lai (Neo4j GraphRAG)
            </h3>
          </div>
          <p style={{ color: 'var(--color-text-3)', fontSize: '12.5px', marginBottom: '20px' }}>
            Hệ thống thực thể địa lý, ẩm thực đặc sản & cơ sở lưu trú được liên kết trực tiếp trên Đồ thị Tri thức.
          </p>

          {/* Cluster A: Món ăn đặc sản lân cận (NEAR_EATERY) */}
          {data.nearbyDishes?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--color-terracotta)' }}>
                  1. Ẩm thực gắn liền thổ nhưỡng ([:NEAR_EATERY])
                </span>
                <Link to="/food" style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>Xem tất cả món ngon &rarr;</Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {data.nearbyDishes.map((dish, i) => (
                  <div
                    key={dish.id || i}
                    onClick={() => navigate('/food')}
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'}
                      alt={dish.name}
                      style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {dish.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-terracotta)', fontWeight: 600 }}>
                        {dish.budget || 'Đặc sản Gia Lai'}
                      </div>
                      {dish.distanceKm && (
                        <div style={{ fontSize: '10.5px', color: 'var(--color-text-3)' }}>
                          Cách {dish.distanceKm} km
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cluster B: Cơ sở lưu trú gần đây (NEAR_STAY) */}
          {data.nearbyStays?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--color-primary)' }}>
                  2. Khách sạn & Homestay lân cận ([:NEAR_STAY])
                </span>
                <Link to="/stay" style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>Xem tất cả &rarr;</Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {data.nearbyStays.map((stay, i) => (
                  <div
                    key={stay.id || i}
                    onClick={() => navigate('/stay')}
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={stay.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'}
                      alt={stay.name}
                      style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {stay.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {stay.budget || stay.stayType || 'Homestay'}
                      </div>
                      {stay.distanceKm && (
                        <div style={{ fontSize: '10.5px', color: 'var(--color-text-3)' }}>
                          Cách {stay.distanceKm} km
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cluster C: Sự kiện lễ hội (HAS_EVENT) */}
          {data.events?.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: '#0284c7' }}>
                  3. Lễ hội & Di sản gắn liền ([:HAS_EVENT])
                </span>
                <Link to="/events" style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>Xem tất cả &rarr;</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                {data.events.map((evt, i) => (
                  <div
                    key={evt.id || i}
                    style={{
                      background: 'var(--color-bg-3)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)' }}>{evt.name}</span>
                      <span style={{ fontSize: '11px', background: 'var(--color-surface)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {evt.time || 'Định kỳ'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-2)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {evt.highlight || evt.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cluster D: Điểm vui chơi lân cận (NEAR_ENTERTAINMENT) */}
          {data.entertainments?.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--color-terracotta)' }}>
                  4. Điểm vui chơi & Giải trí lân cận ([:NEAR_ENTERTAINMENT])
                </span>
                <Link to="/events" style={{ fontSize: '12px', color: 'var(--color-terracotta)', fontWeight: 600 }}>Xem tất cả &rarr;</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {data.entertainments.map((ent, i) => (
                  <div
                    key={ent.id || i}
                    style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    {ent.imageUrl && (
                      <img
                        src={ent.imageUrl}
                        alt={ent.name}
                        style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ent.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-terracotta)', fontWeight: 600 }}>
                        {ent.type || 'Giải trí'}
                      </div>
                      {ent.openHours && (
                        <div style={{ fontSize: '10.5px', color: 'var(--color-text-3)' }}>
                          {ent.openHours}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── 6. FLOATING BOTTOM ACTION BAR (Native Mobile / Android / Web) ── */}
      <div className="stitch-floating-action-bar">
        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '600px' }}>
          <button
            onClick={() => navigate('/planner')}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              padding: '11px 16px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <Calendar size={16} /> Thêm vào lộ trình
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              padding: '11px 16px',
              borderRadius: 'var(--radius-pill)',
              fontWeight: 600,
              fontSize: '13px',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <Navigation size={15} color="var(--color-primary)" /> Chỉ đường
          </a>

          <button
            onClick={() => navigate(`/chat?prompt=${encodeURIComponent(`Hãy tư vấn chi tiết về điểm đến ${data.name} tại Gia Lai`)}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-terracotta-soft)',
              border: '1px solid var(--color-terracotta)',
              color: 'var(--color-terracotta)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title="Hỏi AI về điểm này"
          >
            <Sparkles size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
