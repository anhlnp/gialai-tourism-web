import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { useApi } from '../hooks/useApi'

export default function Stay() {
  const [search, setSearch] = useState('')
  const params = search ? { search } : {}
  const { data: stays, loading } = useApi('/accommodations', { params })

  return (
    <div className="page">
      <div className="container section">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Lưu trú</h1>
        <p style={{ color: 'var(--color-text-2)', marginBottom: '32px' }}>
          Tìm nơi nghỉ ngơi lý tưởng cho hành trình của bạn
        </p>

        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input placeholder="Tìm khách sạn, homestay..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="cards-grid">
          {loading ? [...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />) :
            stays?.map((stay, i) => (
              <motion.div key={stay.id} className="card"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="card-image">
                  <img src={stay.imageUrl || 'https://placehold.co/400x250/1e293b/64748b?text=Stay'} alt={stay.name} loading="lazy" />
                </div>
                <div className="card-body">
                  <h3>{stay.name}</h3>
                  {stay.description && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{stay.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {stay.budget && <span className="price">{stay.budget}</span>}
                    {stay.regions?.length > 0 && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{stay.regions.join(', ')}</span>}
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
