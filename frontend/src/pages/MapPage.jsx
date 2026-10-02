import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, Navigation, Compass, Layers, Star, MapPin, X, ExternalLink, Ticket, Clock } from 'lucide-react'
import { useApi } from '../hooks/useApi'

// Helper component to control map programmatic movement
function MapController({ targetPos, targetZoom }) {
  const map = useMap()
  useEffect(() => {
    if (targetPos) {
      map.flyTo(targetPos, targetZoom || 14, { duration: 1.2 })
    }
  }, [targetPos, targetZoom, map])
  return null
}

// Map Tile Layers (Free, Fast, No API Key required, Google Maps & OSM)
const MAP_LAYERS = {
  streets: {
    name: 'Đường phố',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  satellite: {
    name: 'Vệ tinh',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite',
    maxZoom: 20
  },
  terrain: {
    name: 'Địa hình',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
    maxZoom: 20
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
}

// Generate stylish SVG map pin based on category
function createCustomPin(category = '', isSelected = false) {
  let pinColor = '#10b981' // Green default
  const cat = (category || '').toLowerCase()

  if (cat.includes('biển') || cat.includes('đảo') || cat.includes('hồ')) {
    pinColor = '#0284c7' // Blue
  } else if (cat.includes('văn hóa') || cat.includes('làng') || cat.includes('lễ hội')) {
    pinColor = '#f59e0b' // Amber
  } else if (cat.includes('tâm linh') || cat.includes('chùa') || cat.includes('nhà thờ') || cat.includes('di tích')) {
    pinColor = '#e11d48' // Rose/Red
  } else if (cat.includes('thác') || cat.includes('núi') || cat.includes('rừng')) {
    pinColor = '#059669' // Emerald
  }

  const size = isSelected ? 42 : 34
  const scale = isSelected ? 'scale(1.2)' : 'scale(1)'

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      transform: ${scale};
      transition: all 0.25s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
        <path d="M18 3C11.3726 3 6 8.37258 6 15C6 23.25 18 33 18 33C18 33 30 23.25 30 15C30 8.37258 24.6274 3 18 3Z" fill="${pinColor}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="18" cy="15" r="5" fill="#ffffff"/>
      </svg>
    </div>
  `

  return L.divIcon({
    className: 'custom-map-pin',
    html: html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4]
  })
}

export default function MapPage() {
  const { data: locations } = useApi('/locations?limit=200')
  const navigate = useNavigate()

  const defaultCenter = [14.05, 108.05] // Pleiku / Gia Lai
  const [activeLayer, setActiveLayer] = useState('streets')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [userPos, setUserPos] = useState(null)

  const validLocations = useMemo(() => {
    return locations?.filter(l => l.lat && l.lng) || []
  }, [locations])

  // Extract distinct categories
  const categories = useMemo(() => {
    const cats = new Set(validLocations.map(l => l.category).filter(Boolean))
    return ['ALL', ...Array.from(cats)]
  }, [validLocations])

  // Filtered locations by search query and category
  const filteredLocations = useMemo(() => {
    return validLocations.filter(loc => {
      const matchCat = selectedCategory === 'ALL' || loc.category === selectedCategory
      const matchSearch = !searchQuery.trim() ||
        loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.district?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCat && matchSearch
    })
  }, [validLocations, selectedCategory, searchQuery])

  // Navigate to location on map
  const handleSelectLocation = (loc) => {
    setSelectedLoc(loc)
    setFlyTarget({ pos: [loc.lat, loc.lng], zoom: 15 })
  }

  // Geolocation button
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude]
          setUserPos(coords)
          setFlyTarget({ pos: coords, zoom: 15 })
        },
        (err) => {
          alert('Không thể lấy vị trí hiện tại: ' + err.message)
        }
      )
    } else {
      alert('Trình duyệt không hỗ trợ định vị GPS.')
    }
  }

  // Reset to full Gia Lai view
  const handleResetView = () => {
    setSelectedLoc(null)
    setFlyTarget({ pos: defaultCenter, zoom: 9 })
  }

  return (
    <div className="map-page" style={{ position: 'relative', width: '100%', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>
      
      {/* ── Search & Filter Floating Panel ── */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 1000,
        width: 'calc(100% - 32px)',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'auto'
      }}>
        {/* Search Input Box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--color-bg-card, #ffffff)',
          borderRadius: 12,
          padding: '8px 14px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
          gap: 10
        }}>
          <Search size={18} style={{ color: 'var(--color-text-2, #64748b)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm điểm du lịch, huyện, thắng cảnh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              color: 'var(--color-text, #1e293b)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {categories.slice(0, 8).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                whiteSpace: 'nowrap',
                padding: '6px 14px',
                borderRadius: 9999,
                fontSize: '0.8rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: selectedCategory === cat ? 'var(--color-primary, #059669)' : 'var(--color-bg-card, #ffffff)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--color-text, #334155)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            >
              {cat === 'ALL' ? 'Tất cả' : cat}
            </button>
          ))}
        </div>

        {/* Search Results Dropdown List if typing */}
        {searchQuery.trim() && (
          <div style={{
            background: 'var(--color-bg-card, #ffffff)',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            maxHeight: 280,
            overflowY: 'auto',
            border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {filteredLocations.length === 0 ? (
              <div style={{ padding: 16, fontSize: '0.9rem', color: '#64748b', textAlign: 'center' }}>
                Không tìm thấy địa điểm phù hợp
              </div>
            ) : (
              filteredLocations.slice(0, 10).map(loc => (
                <div
                  key={loc.id}
                  onClick={() => {
                    handleSelectLocation(loc)
                    setSearchQuery('')
                  }}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--color-border, rgba(0,0,0,0.06))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(5, 150, 105, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <MapPin size={16} style={{ color: 'var(--color-primary, #059669)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {loc.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-2, #64748b)' }}>
                      {loc.district} {loc.category ? `• ${loc.category}` : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Layer Switcher & Quick Map Actions (Top Right) ── */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'flex-end'
      }}>
        {/* Layer Switcher Toggle Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--color-bg-card, #ffffff)',
              color: 'var(--color-text, #1e293b)',
              border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: '0.85rem',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              cursor: 'pointer'
            }}
          >
            <Layers size={18} color="var(--color-primary, #059669)" />
            <span>{MAP_LAYERS[activeLayer].name}</span>
          </button>

          {/* Layer Options Popup */}
          {showLayerMenu && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: 'var(--color-bg-card, #ffffff)',
              borderRadius: 12,
              padding: 6,
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              minWidth: 160,
              zIndex: 1001
            }}>
              {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveLayer(key)
                    setShowLayerMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: activeLayer === key ? 'rgba(5, 150, 105, 0.12)' : 'transparent',
                    color: activeLayer === key ? 'var(--color-primary, #059669)' : 'var(--color-text, #334155)',
                    fontWeight: activeLayer === key ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{layer.name}</span>
                  {activeLayer === key && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary, #059669)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          title="Toàn cảnh Gia Lai"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--color-bg-card, #ffffff)',
            color: 'var(--color-text, #1e293b)',
            border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
        >
          <Compass size={20} color="var(--color-primary, #059669)" />
        </button>

        {/* GPS My Location Button */}
        <button
          onClick={handleGetLocation}
          title="Vị trí của tôi"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--color-bg-card, #ffffff)',
            color: 'var(--color-text, #1e293b)',
            border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
        >
          <Navigation size={20} color="#0284c7" />
        </button>
      </div>

      {/* ── Main Leaflet Map Container ── */}
      <MapContainer
        center={defaultCenter}
        zoom={9}
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <MapController targetPos={flyTarget?.pos} targetZoom={flyTarget?.zoom} />

        {/* Dynamic Tile Layer (Google Maps / OpenStreetMap - 100% Free & No API key needed) */}
        <TileLayer
          key={activeLayer}
          url={MAP_LAYERS[activeLayer].url}
          attribution={MAP_LAYERS[activeLayer].attribution}
          maxZoom={MAP_LAYERS[activeLayer].maxZoom}
        />

        {/* User GPS Pin */}
        {userPos && (
          <Marker
            position={userPos}
            icon={L.divIcon({
              className: 'user-gps-marker',
              html: `<div style="width: 20px; height: 20px; background: #0284c7; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 10px rgba(2, 132, 199, 0.8);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            })}
          >
            <Popup>
              <strong>Vị trí của bạn</strong>
            </Popup>
          </Marker>
        )}

        {/* All Location Markers with Custom Pins */}
        {filteredLocations.map(loc => {
          const isSelected = selectedLoc?.id === loc.id
          return (
            <Marker
              key={loc.id}
              position={[loc.lat, loc.lng]}
              icon={createCustomPin(loc.category, isSelected)}
              eventHandlers={{
                click: () => {
                  setSelectedLoc(loc)
                }
              }}
            >
              <Popup>
                <div style={{ minWidth: 220, maxWidth: 280, padding: 4 }}>
                  {loc.imageUrl && (
                    <img
                      src={loc.imageUrl}
                      alt={loc.name}
                      style={{
                        width: '100%',
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 8,
                        marginBottom: 8
                      }}
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                  <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                    {loc.name}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} color="#059669" />
                    <span>{loc.district}</span>
                  </div>
                  {loc.avgRating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{loc.avgRating} ({loc.reviewCount || 10} đánh giá)</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => navigate(`/destination/${loc.id}`)}
                      style={{
                        flex: 1,
                        padding: '6px 10px',
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      Xem chi tiết
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        padding: '6px 10px',
                        background: '#0284c7',
                        color: '#ffffff',
                        borderRadius: 6,
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      <Navigation size={13} />
                      Chỉ đường
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* ── Selected Location Card (Google Maps Style Drawer at Bottom-Left) ── */}
      {selectedLoc && (
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 16,
          zIndex: 1000,
          width: 'calc(100% - 32px)',
          maxWidth: 400,
          background: 'var(--color-bg-card, #ffffff)',
          borderRadius: 16,
          boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
          border: '1px solid var(--color-border, rgba(0,0,0,0.1))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Card Image Banner */}
          <div style={{ position: 'relative', height: 140, background: '#1e293b' }}>
            <img
              src={selectedLoc.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'}
              alt={selectedLoc.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb' }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)'
            }} />
            <button
              onClick={() => setSelectedLoc(null)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)'
              }}
            >
              <X size={16} />
            </button>
            {selectedLoc.category && (
              <span style={{
                position: 'absolute',
                bottom: 10,
                left: 12,
                background: 'rgba(5, 150, 105, 0.9)',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 600,
                backdropFilter: 'blur(4px)'
              }}>
                {selectedLoc.category}
              </span>
            )}
          </div>

          {/* Card Body */}
          <div style={{ padding: '14px 16px' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text, #1e293b)' }}>
              {selectedLoc.name}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-text-2, #64748b)', marginBottom: 8 }}>
              <MapPin size={14} color="var(--color-primary, #059669)" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedLoc.address || selectedLoc.district}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.82rem', marginBottom: 14, flexWrap: 'wrap' }}>
              {selectedLoc.avgRating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontWeight: 600 }}>
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <span>{selectedLoc.avgRating} ({selectedLoc.reviewCount || 10})</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600 }}>
                <Ticket size={14} />
                <span>
                  {(!selectedLoc.budget || selectedLoc.budget === 0 || selectedLoc.budget === '0')
                    ? 'Miễn phí vé'
                    : typeof selectedLoc.budget === 'number'
                      ? `${selectedLoc.budget.toLocaleString('vi-VN')} đ`
                      : selectedLoc.budget}
                </span>
              </div>
              {selectedLoc.bestTime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b' }}>
                  <Clock size={14} />
                  <span>{Array.isArray(selectedLoc.bestTime) ? selectedLoc.bestTime.join(', ') : selectedLoc.bestTime}</span>
                </div>
              )}
            </div>

            {/* Action Buttons: View Detail & Directions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate(`/destination/${selectedLoc.id}`)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'var(--color-primary, #059669)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <ExternalLink size={15} />
                Xem chi tiết
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLoc.lat},${selectedLoc.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#0284c7',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textDecoration: 'none'
                }}
              >
                <Navigation size={15} />
                Chỉ đường
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Slide-up keyframe animation style */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
