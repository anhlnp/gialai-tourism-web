import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, UtensilsCrossed, Hotel, Loader2 } from 'lucide-react'
import { postApi } from '../hooks/useApi'
import { useApi } from '../hooks/useApi'

export default function Planner() {
  const [days, setDays] = useState(2)
  const [region, setRegion] = useState('')
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const { data: districts } = useApi('/locations/districts')

  const generatePlan = async () => {
    setLoading(true)
    const result = await postApi('/planner', { days, region: region || null })
    setPlan(result)
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="container section">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Lên Lộ trình</h1>
        <p style={{ color: 'var(--color-text-2)', marginBottom: '32px' }}>
          Để hệ thống gợi ý lộ trình tối ưu cho chuyến đi của bạn
        </p>

        {/* Configuration */}
        <div className="planner-step">
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', display: 'block', marginBottom: 8 }}>Số ngày</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(d => (
                  <button key={d}
                    className={`filter-chip ${days === d ? 'active' : ''}`}
                    onClick={() => setDays(d)}
                  >{d} ngày</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--color-text-2)', display: 'block', marginBottom: 8 }}>Khu vực</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={`filter-chip ${!region ? 'active' : ''}`} onClick={() => setRegion('')}>Tất cả</span>
                {districts?.map(d => (
                  <span key={d.id} className={`filter-chip ${region === d.name ? 'active' : ''}`}
                    onClick={() => setRegion(region === d.name ? '' : d.name)}>{d.name}</span>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={generatePlan} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <CalendarDays size={18} />}
              {loading ? 'Đang lên kế hoạch...' : 'Tạo lộ trình'}
            </button>
          </div>
        </div>

        {/* Results */}
        {plan?.itinerary && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {plan.itinerary.map(day => (
              <div key={day.day} className="planner-step" style={{ marginTop: 24 }}>
                <h2 style={{ fontSize: '1.3rem', marginBottom: 20, color: 'var(--color-primary)' }}>
                  Ngày {day.day}
                </h2>
                <div className="timeline">
                  {day.locations.map((loc, i) => (
                    <div key={loc.id} className="timeline-item">
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        {loc.imageUrl && (
                          <img src={loc.imageUrl} alt={loc.name}
                            style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                        )}
                        <div>
                          <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{loc.name}</h3>
                          <div className="meta" style={{ fontSize: '0.85rem' }}>
                            <span><MapPin size={14} /> {loc.district}</span>
                            {loc.bestTime && <span>{loc.bestTime}</span>}
                            {loc.budget && <span className="price">{loc.budget}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Food suggestions */}
                  {day.food?.length > 0 && (
                    <div className="timeline-item">
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-accent-amber)', marginBottom: 8 }}>
                        <UtensilsCrossed size={14} /> Gợi ý ẩm thực
                      </h4>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {day.food.map(f => (
                          <span key={f.name} className="filter-chip">{f.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stay suggestion */}
                  {day.stay && (
                    <div className="timeline-item">
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-region-sea)', marginBottom: 8 }}>
                        <Hotel size={14} /> Nghỉ đêm
                      </h4>
                      <span className="filter-chip active">{day.stay.name}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
