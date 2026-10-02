import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin,
  Star,
  Clock,
  Ticket,
  DollarSign,
  UtensilsCrossed,
  Hotel,
  ArrowRight,
  Navigation,
  ChevronLeft,
  Share2,
  Calendar
} from 'lucide-react'
import { useApi } from '../hooks/useApi'

export default function DestinationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useApi(`/locations/${id}`)

  if (loading) {
    return (
      <div className="page container" style={{ paddingTop: 96, paddingBottom: 48 }}>
        <div className="skeleton" style={{ height: 420, borderRadius: 20, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
      </div>
    )
  }

  if (!data || data.error) {
    return (
      <div className="page container" style={{ paddingTop: 120, textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: 16 }}>Không tìm thấy điểm đến</h1>
        <p style={{ color: 'var(--color-text-2)', marginBottom: 24 }}>Điểm đến có thể đã thay đổi mã định danh hoặc đang cập nhật dữ liệu.</p>
        <button
          onClick={() => navigate('/explore')}
          className="btn btn-primary"
        >
          Quay lại trang Khám phá
        </button>
      </div>
    )
  }

  // Format best time string/array
  const bestTimeStr = Array.isArray(data.bestTime)
    ? data.bestTime.join(' • ')
    : data.bestTime

  // Format budget / ticket price
  const isFree = data.budget === 0 || data.budget === '0' || data.ticketPrice === 0 || !data.budget
  const budgetFormatted = isFree
    ? 'Miễn phí vé vào cổng'
    : typeof data.budget === 'number'
      ? `${data.budget.toLocaleString('vi-VN')} đ`
      : data.budget

  // Google Maps directions URL
  const googleMapsUrl = (data.lat && data.lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${data.lat},${data.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.name + ' Gia Lai')}`

  return (
    <div className="page" style={{ paddingTop: 72 }}>
      {/* ── Breadcrumb Bar ── */}
      <div style={{ background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)', padding: '10px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-2)',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6
              }}
            >
              <ChevronLeft size={16} /> Quay lại
            </button>
            <span style={{ color: 'var(--color-text-3, #94a3b8)' }}>/</span>
            <Link to="/explore" style={{ color: 'var(--color-text-2)', textDecoration: 'none' }}>
              Khám phá
            </Link>
            <span style={{ color: 'var(--color-text-3, #94a3b8)' }}>/</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
              {data.name}
            </span>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: data.name, url: window.location.href })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Đã sao chép liên kết vào bộ nhớ tạm!')
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: '0.82rem',
              color: 'var(--color-text-2)',
              cursor: 'pointer'
            }}
          >
            <Share2 size={14} /> Chia sẻ
          </button>
        </div>
      </div>

      {/* ── Hero Banner with Deep High-Contrast Overlay ── */}
      <div className="detail-hero" style={{
        position: 'relative',
        height: '56vh',
        minHeight: 440,
        overflow: 'hidden',
        background: '#0f172a'
      }}>
        <img
          src={data.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'}
          alt={data.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' }}
        />

        {/* Multi-stop Deep Contrast Gradient Overlay (Ensures 100% text clarity) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.6) 45%, rgba(15, 23, 42, 0.96) 100%)',
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: 36
        }}>
          <motion.div
            className="container"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Category Tag */}
            {data.category && (
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #059669, #0284c7)',
                  color: '#ffffff',
                  padding: '6px 16px',
                  borderRadius: 9999,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
                }}>
                  {data.category}
                </span>
              </div>
            )}

            {/* Destination Name (High contrast crisp white) */}
            <h1 style={{
              fontSize: 'clamp(1.9rem, 4vw, 2.9rem)',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.25,
              marginBottom: 16,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)'
            }}>
              {data.name}
            </h1>

            {/* High-Contrast Glassmorphic Subtitle Badges */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 10
            }}>
              {/* District Badge */}
              {data.district && (
                <div className="detail-meta-pill" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  color: '#ffffff',
                  padding: '7px 16px',
                  borderRadius: 9999,
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
                }}>
                  <MapPin size={16} color="#34d399" />
                  <span>{data.district}</span>
                </div>
              )}

              {/* Rating Badge */}
              <div className="detail-meta-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: 9999,
                fontSize: '0.92rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
              }}>
                <Star size={16} fill="#fbbf24" color="#fbbf24" />
                <span>{data.avgRating || 4.8} ({data.reviewCount || 15} đánh giá)</span>
              </div>

              {/* Best Time Badge */}
              {bestTimeStr && (
                <div className="detail-meta-pill" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  color: '#ffffff',
                  padding: '7px 16px',
                  borderRadius: 9999,
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
                }}>
                  <Clock size={16} color="#38bdf8" />
                  <span>{bestTimeStr}</span>
                </div>
              )}

              {/* Ticket Price / Budget Badge */}
              <div className="detail-meta-pill" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: isFree ? 'rgba(5, 150, 105, 0.85)' : 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: isFree ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: 9999,
                fontSize: '0.92rem',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)'
              }}>
                <Ticket size={16} color={isFree ? '#ffffff' : '#4ade80'} />
                <span>{budgetFormatted}</span>
              </div>

              {/* Direct Google Maps Navigation Button in Hero */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#0284c7',
                  color: '#ffffff',
                  padding: '7px 18px',
                  borderRadius: 9999,
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Navigation size={16} />
                Chỉ đường Google Maps
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content Body ── */}
      <div className="container" style={{ paddingBottom: 64 }}>
        
        {/* Quick Info Strip */}
        <div style={{
          marginTop: -24,
          position: 'relative',
          zIndex: 10,
          background: 'var(--color-bg-card)',
          borderRadius: 16,
          padding: '20px 24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid var(--color-border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Địa chỉ chi tiết
            </div>
            <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <span>{data.address || `${data.name}, ${data.district}, Tỉnh Gia Lai`}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Thời gian lý tưởng
            </div>
            <div style={{ fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="#0284c7" style={{ flexShrink: 0 }} />
              <span>{bestTimeStr || 'Quanh năm / Sáng sớm'}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Giá vé tham quan
            </div>
            <div style={{ fontWeight: 600, color: isFree ? 'var(--color-primary)' : 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ticket size={16} color={isFree ? 'var(--color-primary)' : '#f59e0b'} style={{ flexShrink: 0 }} />
              <span>{budgetFormatted}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lộ trình di chuyển
            </div>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                color: '#0284c7',
                textDecoration: 'none'
              }}
            >
              Mở trên Google Maps <ArrowRight size={15} />
            </a>
          </div>
        </div>

        {/* Description Section */}
        {data.description && (
          <motion.section
            className="detail-section"
            style={{ marginTop: 32 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16, color: 'var(--color-text)' }}>
              Giới thiệu điểm đến
            </h2>
            <div style={{
              background: 'var(--color-bg-card)',
              borderRadius: 16,
              padding: '24px 28px',
              border: '1px solid var(--color-border)',
              lineHeight: 1.9,
              fontSize: '1.08rem',
              color: 'var(--color-text)',
              whiteSpace: 'pre-line'
            }}>
              {data.description}
            </div>
          </motion.section>
        )}

        {/* Nearby Food Section */}
        {data.nearbyDishes?.length > 0 && (
          <section className="detail-section" style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                <UtensilsCrossed size={22} color="var(--color-primary)" />
                Ẩm thực & Đặc sản lân cận
              </h2>
              <Link to="/food" style={{ fontSize: '0.9rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                Xem tất cả món ngon &rarr;
              </Link>
            </div>

            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {data.nearbyDishes.map((dish, i) => (
                <motion.div
                  key={dish.id || i}
                  className="card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="card-image" style={{ height: 160 }}>
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947'}
                      alt={dish.name}
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1544025162-d76694265947' }}
                    />
                    {dish.distanceKm && <span className="card-badge">{dish.distanceKm} km</span>}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{dish.name}</h3>
                    {dish.tasteType && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--color-text-2)', marginBottom: 8 }}>
                        {dish.tasteType}
                      </div>
                    )}
                    {dish.budget && (
                      <div className="price" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {dish.budget}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Nearby Stay Section */}
        {data.nearbyStays?.length > 0 && (
          <section className="detail-section" style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                <Hotel size={22} color="#0284c7" />
                Khách sạn & Homestay gần đây
              </h2>
              <Link to="/stay" style={{ fontSize: '0.9rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
                Xem tất cả lưu trú &rarr;
              </Link>
            </div>

            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {data.nearbyStays.map((stay, i) => (
                <motion.div
                  key={stay.id || i}
                  className="card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="card-image" style={{ height: 160 }}>
                    <img
                      src={stay.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'}
                      alt={stay.name}
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945' }}
                    />
                    {stay.distanceKm && <span className="card-badge">{stay.distanceKm} km</span>}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{stay.name}</h3>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-2)', marginBottom: 8 }}>
                      {stay.stayType || 'Lưu trú'}
                    </div>
                    {stay.budget && (
                      <div className="price" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0284c7' }}>
                        {stay.budget}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Connected Journey Locations */}
        {data.connectedLocations?.length > 0 && (
          <section className="detail-section" style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
              <ArrowRight size={22} color="#f59e0b" />
              Điểm kết nối tiếp theo trong hành trình
            </h2>

            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
              {data.connectedLocations.map((loc, i) => (
                <motion.div
                  key={loc.id || i}
                  className="card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/destination/${loc.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="card-image" style={{ height: 160 }}>
                    <img
                      src={loc.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'}
                      alt={loc.name}
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' }}
                    />
                    {loc.distanceKm && <span className="card-badge">{loc.distanceKm} km</span>}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{loc.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: 'var(--color-text-2)' }}>
                      <MapPin size={13} color="var(--color-primary)" />
                      <span>{loc.district}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
