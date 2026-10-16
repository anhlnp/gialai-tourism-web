import { useNavigate } from 'react-router-dom'
import { Star, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

const DEFAULT_THUMB = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect fill='%23174B36' width='400' height='250'/%3E%3Cpath d='M50 190 L160 80 L230 140 L300 70 L370 190 Z' fill='%23246B4A'/%3E%3Ctext x='50%25' y='86%25' text-anchor='middle' fill='%23FAFAF7' font-size='14' font-family='sans-serif'%3EDu l%E1%BB%8Bch Gia Lai%3C/text%3E%3C/svg%3E"

export default function DestinationCard({ id, name, imageUrl, district, category, rating, budget, score, searchType, index = 0 }) {
  const navigate = useNavigate()

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      onClick={() => navigate(`/destination/${id}`)}
    >
      <div className="card-image">
        <img 
          src={imageUrl || DEFAULT_THUMB} 
          alt={name} 
          loading="lazy" 
          onError={(e) => { e.currentTarget.src = DEFAULT_THUMB }}
        />
        {category && <span className="card-badge">{category}</span>}
        {score && (
          <span className="card-badge" style={{ right: 12, left: 'auto', background: 'rgba(16, 185, 129, 0.9)' }}>
            Điểm: {score}
          </span>
        )}
      </div>
      <div className="card-body">
        <h3>{name}</h3>
        <div className="meta">
          {district && <span><MapPin size={14} /> {district}</span>}
          {rating > 0 && (
            <span className="rating"><Star size={14} /> {rating}</span>
          )}
        </div>
        {budget ? <div className="price">{typeof budget === 'number' ? (budget === 0 ? 'Miễn phí' : `${budget.toLocaleString()}đ`) : budget}</div> : null}
      </div>
    </motion.div>
  )
}
