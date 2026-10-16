import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Compass, Trash2, MapPin, Star, ArrowRight, Heart } from 'lucide-react'

export default function Saved() {
  const [savedItems, setSavedItems] = useState([])
  const [activeTab, setActiveTab] = useState('ALL')

  useEffect(() => {
    loadSaved()
  }, [])

  const loadSaved = () => {
    try {
      const data = JSON.parse(localStorage.getItem('saved_places') || '[]')
      setSavedItems(data)
    } catch {
      setSavedItems([])
    }
  }

  const removeItem = (id) => {
    const next = savedItems.filter(item => item.id !== id)
    setSavedItems(next)
    localStorage.setItem('saved_places', JSON.stringify(next))
  }

  const clearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách đã lưu?')) {
      setSavedItems([])
      localStorage.removeItem('saved_places')
    }
  }

  const filteredItems = savedItems.filter(item => {
    if (activeTab === 'ALL') return true
    if (activeTab === 'LOCATION') return item.type === 'location' || !item.type
    if (activeTab === 'FOOD') return item.type === 'food'
    if (activeTab === 'STAY') return item.type === 'stay'
    return true
  })

  return (
    <div className="container pb-24 md:pb-12" style={{ paddingTop: '28px', maxWidth: '1280px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontWeight: 700,
            color: 'var(--color-terracotta)'
          }}>
            Bộ sưu tập cá nhân
          </span>
          <h1 className="font-editorial" style={{ fontSize: '2.2rem', margin: '4px 0 6px 0', color: 'var(--color-text)' }}>
            Địa điểm <span className="editorial-italic">đã lưu</span>
          </h1>
          <p style={{ color: 'var(--color-text-3)', fontSize: '0.95rem' }}>
            Những điểm dừng chân, mỹ vị và chốn nghỉ ngơi bạn đã yêu thích
          </p>
        </div>

        {savedItems.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)',
              color: 'var(--color-text-3)',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={14} /> Xóa tất cả
          </button>
        )}
      </div>

      {/* Filter Tabs if there are items */}
      {savedItems.length > 0 && (
        <div className="filter-chips-row" style={{ marginBottom: '24px' }}>
          <button
            className={`chip-pill ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            Tất cả ({savedItems.length})
          </button>
          <button
            className={`chip-pill ${activeTab === 'LOCATION' ? 'active' : ''}`}
            onClick={() => setActiveTab('LOCATION')}
          >
            Điểm đến ({savedItems.filter(i => i.type === 'location' || !i.type).length})
          </button>
          <button
            className={`chip-pill ${activeTab === 'FOOD' ? 'active' : ''}`}
            onClick={() => setActiveTab('FOOD')}
          >
            Ẩm thực ({savedItems.filter(i => i.type === 'food').length})
          </button>
          <button
            className={`chip-pill ${activeTab === 'STAY' ? 'active' : ''}`}
            onClick={() => setActiveTab('STAY')}
          >
            Lưu trú ({savedItems.filter(i => i.type === 'stay').length})
          </button>
        </div>
      )}

      {/* Empty State (Stitch Screen c5e67f586c0b4c3ea9ddc8786e252e8c) */}
      {filteredItems.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Bookmark size={32} />
          </div>
          <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>
            Chưa có địa điểm nào được lưu
          </h2>
          <p style={{ color: 'var(--color-text-3)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
            Khám phá vẻ đẹp hùng vĩ của đại ngàn Gia Lai và lưu lại những danh lam thắng cảnh, quán ăn ngon hoặc homestay cho chuyến đi của bạn.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/explore"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: 'var(--color-primary)',
                color: '#fff',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 600,
                fontSize: '13.5px',
                textDecoration: 'none'
              }}
            >
              <Compass size={16} /> Khám phá điểm đến
            </Link>
            <Link
              to="/map"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                borderRadius: 'var(--radius-pill)',
                fontWeight: 600,
                fontSize: '13.5px',
                textDecoration: 'none'
              }}
            >
              <MapPin size={16} /> Mở bản đồ du lịch
            </Link>
          </div>
        </div>
      ) : (
        /* Saved Items Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {filteredItems.map(item => (
            <div
              key={item.id}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform var(--transition-fast)'
              }}
            >
              {/* Image Header */}
              <div style={{ height: '170px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={item.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'
                  }}
                />
                <button
                  onClick={() => removeItem(item.id)}
                  title="Bỏ lưu"
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--color-accent-rose)'
                  }}
                >
                  <Trash2 size={16} />
                </button>

                {item.category && (
                  <span style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(8px)',
                    color: 'var(--color-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)'
                  }}>
                    {item.category}
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text)' }}>
                    {item.name}
                  </h3>
                  {item.address && (
                    <p style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--color-text-3)', margin: '0 0 8px 0' }}>
                      <MapPin size={13} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.address}</span>
                    </p>
                  )}
                  {item.description && (
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--color-text-2)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-border-light)'
                }}>
                  {item.ratingAvg && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--color-terracotta)' }}>
                      <Star size={13} fill="var(--color-terracotta)" />
                      {item.ratingAvg}
                    </span>
                  )}

                  <Link
                    to={item.type === 'food' ? '/food' : item.type === 'stay' ? '/stay' : `/destination/${item.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      textDecoration: 'none'
                    }}
                  >
                    Xem chi tiết <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
