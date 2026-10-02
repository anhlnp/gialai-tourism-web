import { useNavigate } from 'react-router-dom'
import { Star, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

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
        <img src={imageUrl || 'https://placehold.co/400x250/1e293b/64748b?text=No+Image'} alt={name} loading="lazy" />
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
