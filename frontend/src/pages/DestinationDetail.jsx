import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, Star, Clock, DollarSign, UtensilsCrossed, Hotel, ArrowRight } from 'lucide-react'
import { useApi } from '../hooks/useApi'

export default function DestinationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, loading } = useApi(`/locations/${id}`)

  if (loading) return (
    <div className="page container section">
      <div className="skeleton" style={{ height: 400, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 200 }} />
    </div>
  )

  if (!data || data.error) return (
    <div className="page container section">
      <h1>Không tìm thấy điểm đến</h1>
    </div>
  )

  return (
    <div className="page">
      {/* Hero Image */}
      <div className="detail-hero">
        <img src={data.imageUrl || 'https://placehold.co/1920x600/1e293b/64748b?text=No+Image'} alt={data.name} />
        <div className="overlay">
          <motion.div className="detail-info container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {data.category && <span className="card-badge" style={{ marginBottom: 8, display: 'inline-block' }}>{data.category}</span>}
            <h1>{data.name}</h1>
            <div className="meta" style={{ fontSize: '1rem', gap: 20 }}>
              {data.district && <span><MapPin size={16} /> {data.district}</span>}
              {data.avgRating > 0 && <span className="rating"><Star size={16} /> {data.avgRating} ({data.reviewCount} đánh giá)</span>}
              {data.bestTime && <span><Clock size={16} /> {data.bestTime}</span>}
              {data.budget && <span><DollarSign size={16} /> {data.budget}</span>}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Description */}
        {data.description && (
          <motion.section className="detail-section"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            <h2>Giới thiệu</h2>
            <p style={{ color: 'var(--color-text-2)', lineHeight: 1.8, fontSize: '1.05rem' }}>{data.description}</p>
          </motion.section>
        )}

        {/* Nearby Food */}
        {data.nearbyDishes?.length > 0 && (
          <section className="detail-section">
            <h2><UtensilsCrossed size={20} /> Ẩm thực gần đây</h2>
            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {data.nearbyDishes.map((dish, i) => (
                <motion.div key={dish.id} className="card"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="card-image" style={{ height: 150 }}>
                    <img src={dish.imageUrl || 'https://placehold.co/300x150/1e293b/64748b?text=Food'} alt={dish.name} />
                    {dish.distanceKm && <span className="card-badge">{dish.distanceKm} km</span>}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '0.95rem' }}>{dish.name}</h3>
                    {dish.budget && <div className="price" style={{ fontSize: '0.85rem' }}>{dish.budget}</div>}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Nearby Stay */}
        {data.nearbyStays?.length > 0 && (
          <section className="detail-section">
            <h2><Hotel size={20} /> Lưu trú gần đây</h2>
            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {data.nearbyStays.map((stay, i) => (
                <motion.div key={stay.id} className="card"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="card-image" style={{ height: 150 }}>
                    <img src={stay.imageUrl || 'https://placehold.co/300x150/1e293b/64748b?text=Hotel'} alt={stay.name} />
                    {stay.distanceKm && <span className="card-badge">{stay.distanceKm} km</span>}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '0.95rem' }}>{stay.name}</h3>
                    {stay.budget && <div className="price" style={{ fontSize: '0.85rem' }}>{stay.budget}</div>}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Connected Locations */}
        {data.connectedLocations?.length > 0 && (
          <section className="detail-section">
            <h2><ArrowRight size={20} /> Tiếp tục hành trình</h2>
            <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {data.connectedLocations.map((loc, i) => (
                <motion.div key={loc.id} className="card"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/destination/${loc.id}`)}
                >
                  <div className="card-image" style={{ height: 150 }}>
                    <img src={loc.imageUrl || 'https://placehold.co/300x150/1e293b/64748b?text=Location'} alt={loc.name} />
                    {loc.distanceKm && <span className="card-badge">{loc.distanceKm} km</span>}
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '0.95rem' }}>{loc.name}</h3>
                    <div className="meta"><MapPin size={14} /> {loc.district}</div>
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
