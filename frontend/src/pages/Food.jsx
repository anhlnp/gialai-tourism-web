import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useApi } from '../hooks/useApi'

export default function Food() {
  const [search, setSearch] = useState('')
  const params = search ? { search } : {}
  const { data: dishes, loading } = useApi('/dishes', { params })

  return (
    <div className="page">
      <div className="container section">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Ẩm thực Đặc sản</h1>
        <p style={{ color: 'var(--color-text-2)', marginBottom: '32px' }}>
          Trải nghiệm hương vị độc đáo và phong phú của ẩm thực đặc sản cao nguyên Gia Lai
        </p>

        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input placeholder="Tìm món ăn..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="cards-grid">
          {loading ? [...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />) :
            dishes?.map((dish, i) => (
              <motion.div key={dish.id} className="card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="card-image">
                  <img src={dish.imageUrl || 'https://placehold.co/400x250/1e293b/64748b?text=Food'} alt={dish.name} loading="lazy" />
                  {dish.mealTime && <span className="card-badge">{dish.mealTime}</span>}
                </div>
                <div className="card-body">
                  <h3>{dish.name}</h3>
                  {dish.description && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{dish.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {dish.budget && <span className="price">{dish.budget}</span>}
                    {dish.regions?.length > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{dish.regions.join(', ')}</span>}
                  </div>
                </div>
              </motion.div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
