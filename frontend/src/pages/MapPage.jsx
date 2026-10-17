import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { 
  Search, Navigation, Compass, Layers, Star, MapPin, X, 
  ExternalLink, Ticket, Clock, Info, ChevronRight, LocateFixed, Plus, Minus
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { DEFAULT_DESTINATION_THUMB } from '../constants/placeholders'

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

// Map Tile Layers
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

// Haversine distance calculator in KM
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371 // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return (R * c).toFixed(1)
}

// Stitch Forest Green Custom Map Pin
function createCustomPin(category = '', isSelected = false) {
  const pinColor = isSelected ? '#C26D38' : '#246B4A'
  const size = isSelected ? 40 : 32
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
      <svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
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

  const defaultCenter = [13.98, 108.6] // Trung tâm hành lang Rừng & Biển Gia Lai Mới
  const [activeLayer, setActiveLayer] = useState('streets')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('ALL') // 'ALL' | 'Cao nguyên' | 'Duyên hải'
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [flyTarget, setFlyTarget] = useState(null)
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [userPos, setUserPos] = useState(null)

  const validLocations = useMemo(() => {
    return locations?.filter(l => l.lat && l.lng) || []
  }, [locations])

  // Categories
  const categories = useMemo(() => {
    const cats = new Set(validLocations.map(l => l.category).filter(Boolean))
    return ['ALL', ...Array.from(cats)]
  }, [validLocations])

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return validLocations.filter(loc => {
      const matchRegion = selectedRegion === 'ALL' || 
        loc.geographicRegion === selectedRegion || 
        (selectedRegion === 'Duyên hải' && (loc.legacyProvince === 'Bình Định' || ['Thành phố Quy Nhơn', 'Huyện Tây Sơn', 'Huyện Tuy Phước', 'Huyện Phù Cát', 'Thị xã An Nhơn', 'Huyện Phù Mỹ'].includes(loc.district))) ||
        (selectedRegion === 'Cao nguyên' && (loc.legacyProvince === 'Gia Lai' || !['Thành phố Quy Nhơn', 'Huyện Tây Sơn', 'Huyện Tuy Phước', 'Huyện Phù Cát', 'Thị xã An Nhơn', 'Huyện Phù Mỹ'].includes(loc.district)))
      const matchCat = selectedCategory === 'ALL' || loc.category === selectedCategory
      const matchSearch = !searchQuery.trim() ||
        loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.district?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchRegion && matchCat && matchSearch
    })
  }, [validLocations, selectedRegion, selectedCategory, searchQuery])

  // Select location on map
  const handleSelectLocation = (loc) => {
    setSelectedLoc(loc)
    setFlyTarget({ pos: [loc.lat, loc.lng], zoom: 15 })
  }

  // Geolocation
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

  // Reset view to Gia Lai province
  const handleResetView = () => {
    setSelectedLoc(null)
    setFlyTarget({ pos: defaultCenter, zoom: 9 })
  }

  return (
    <div className="relative w-full h-[calc(100vh-136px)] lg:h-[calc(100vh-68px)] overflow-hidden bg-[#FAFAF7]">
      {/* ── Top Floating Search & Filter Pill Bar (Stitch Frosted Glass) ── */}
      <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-[420px] z-[1000] flex flex-col gap-2 pointer-events-auto">
        {/* Search Pill */}
        <div className="h-12 rounded-full backdrop-blur-md bg-white/95 px-4 flex items-center gap-2.5 border border-[#E8EBE5] shadow-md focus-within:border-[#246B4A]/50 focus-within:ring-2 focus-within:ring-[#246B4A]/10 transition-all">
          <Search size={18} className="text-[#246B4A] shrink-0" />
          <input
            type="text"
            placeholder="Tìm danh lam, thác nước, di tích trên bản đồ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#1A1D1A] placeholder:text-[#8A948C] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#8A948C] hover:text-[#1A1D1A] p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Region & Corridor Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => {
              setSelectedRegion('ALL')
              setFlyTarget({ pos: [13.98, 108.6], zoom: 8.5 })
            }}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs active:scale-95 transition-all ${
              selectedRegion === 'ALL'
                ? 'bg-[#1A1D1A] text-white border border-[#1A1D1A]'
                : 'bg-white/90 border border-[#E8EBE5] text-[#5A635B] hover:bg-white'
            }`}
          >
            Toàn tỉnh mới (43)
          </button>
          <button
            onClick={() => {
              setSelectedRegion('Cao nguyên')
              setFlyTarget({ pos: [13.98, 108.0], zoom: 10 })
            }}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs active:scale-95 transition-all ${
              selectedRegion === 'Cao nguyên'
                ? 'bg-[#246B4A] text-white border border-[#246B4A]'
                : 'bg-white/90 border border-[#E8EBE5] text-[#246B4A] hover:bg-white'
            }`}
          >
            Cao nguyên (30)
          </button>
          <button
            onClick={() => {
              setSelectedRegion('Duyên hải')
              setFlyTarget({ pos: [13.82, 109.18], zoom: 11 })
            }}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs active:scale-95 transition-all ${
              selectedRegion === 'Duyên hải'
                ? 'bg-[#1E40AF] text-white border border-[#1E40AF]'
                : 'bg-white/90 border border-[#E8EBE5] text-[#1E40AF] hover:bg-white'
            }`}
          >
            Duyên hải (13)
          </button>
        </div>

        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.slice(0, 7).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs active:scale-95 transition-all ${
                selectedCategory === cat
                  ? 'bg-[#C26D38] text-white border border-[#C26D38]'
                  : 'bg-white/90 border border-[#E8EBE5] text-[#5A635B] hover:bg-white'
              }`}
            >
              {cat === 'ALL' ? 'Tất cả loại hình' : cat}
            </button>
          ))}
        </div>

        {/* Search Results Dropdown List if typing */}
        {searchQuery.trim() && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl max-h-64 overflow-y-auto border border-[#E8EBE5] flex flex-col">
            {filteredLocations.length === 0 ? (
              <div className="p-4 text-xs text-[#8A948C] text-center">
                Không tìm thấy điểm đến nào phù hợp
              </div>
            ) : (
              filteredLocations.slice(0, 8).map(loc => (
                <div
                  key={loc.id}
                  onClick={() => {
                    handleSelectLocation(loc)
                    setSearchQuery('')
                  }}
                  className="px-4 py-2.5 hover:bg-[#F2FCF2] cursor-pointer flex items-center justify-between border-b border-[#E8EBE5]/60 last:border-b-0 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#1A1D1A]">{loc.name}</h4>
                    <span className="text-[11px] text-[#5A635B]">{loc.district || loc.address || 'Gia Lai'}</span>
                  </div>
                  <ChevronRight size={14} className="text-[#8A948C]" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Floating Right Side Controls (Stitch Minimalist Round Controls) ── */}
      <div className="absolute right-3 sm:right-4 top-3 sm:top-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
        {/* Layer Switcher Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#E8EBE5] text-[#1A1D1A] flex items-center justify-center shadow-md hover:bg-white active:scale-95 transition-all"
            title="Lớp bản đồ"
          >
            <Layers size={18} className="text-[#246B4A]" />
          </button>

          {showLayerMenu && (
            <div className="absolute top-0 right-12 bg-white rounded-2xl p-1.5 shadow-xl border border-[#E8EBE5] flex flex-col gap-1 min-w-[140px] z-[1001]">
              {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveLayer(key)
                    setShowLayerMenu(false)
                  }}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-left transition-all ${
                    activeLayer === key
                      ? 'bg-[#EAF3EB] text-[#246B4A]'
                      : 'text-[#5A635B] hover:bg-[#FAFAF7]'
                  }`}
                >
                  <span>{layer.name}</span>
                  {activeLayer === key && <span className="w-1.5 h-1.5 rounded-full bg-[#246B4A]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS My Location */}
        <button
          onClick={handleGetLocation}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#E8EBE5] text-[#246B4A] flex items-center justify-center shadow-md hover:bg-white active:scale-95 transition-all"
          title="Vị trí của tôi"
        >
          <LocateFixed size={18} />
        </button>

        {/* Reset View Compass */}
        <button
          onClick={handleResetView}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md border border-[#E8EBE5] text-[#C26D38] flex items-center justify-center shadow-md hover:bg-white active:scale-95 transition-all"
          title="Toàn cảnh Gia Lai"
        >
          <Compass size={18} />
        </button>
      </div>

      {/* ── Main Leaflet Map Container ── */}
      <MapContainer
        center={defaultCenter}
        zoom={9}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <MapController targetPos={flyTarget?.pos} targetZoom={flyTarget?.zoom} />

        <TileLayer
          key={activeLayer}
          url={MAP_LAYERS[activeLayer].url}
          attribution={MAP_LAYERS[activeLayer].attribution}
          maxZoom={MAP_LAYERS[activeLayer].maxZoom}
        />

        {/* User GPS Marker */}
        {userPos && (
          <Marker
            position={userPos}
            icon={L.divIcon({
              className: 'user-gps-marker',
              html: `<div style="width: 18px; height: 18px; background: #246B4A; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 0 12px rgba(36, 107, 74, 0.8);"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            })}
          >
            <Popup>
              <strong>Vị trí của bạn</strong>
            </Popup>
          </Marker>
        )}

        {/* Location Markers */}
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
                <div className="p-1 min-w-[200px]">
                  {loc.imageUrl && (
                    <img
                      src={loc.imageUrl}
                      alt={loc.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                  <h4 className="font-bold text-xs text-[#1A1D1A] mb-1">{loc.name}</h4>
                  <p className="text-[11px] text-[#5A635B] mb-2">{loc.district || 'Gia Lai'}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/destinations/${loc.id}`)}
                      className="flex-1 py-1 px-2 rounded-lg bg-[#246B4A] text-white text-xs font-semibold"
                    >
                      Chi tiết
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1 px-2 rounded-lg bg-[#C26D38] text-white text-xs font-semibold text-center"
                    >
                      Chỉ đường
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {/* ── Stitch Editorial Destination Preview Card (Bottom Drawer) ── */}
      {selectedLoc && (
        <div className="absolute left-3 right-3 sm:left-4 sm:right-auto sm:w-[400px] bottom-[80px] md:bottom-4 z-[1000] pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-3.5 border border-[#E8EBE5] transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Main Destination Info Header */}
            <div className="flex gap-3 items-start">
              {/* Thumbnail 104x78 */}
              <div className="relative w-[104px] h-[78px] rounded-2xl overflow-hidden shrink-0 bg-[#E8EBE5]">
                <img
                  src={selectedLoc.imageUrl || DEFAULT_DESTINATION_THUMB}
                  alt={selectedLoc.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.currentTarget.src = DEFAULT_DESTINATION_THUMB }}
                />
                <span className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                  {selectedLoc.category || 'Thắng cảnh'}
                </span>
              </div>

              {/* Typography Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-[10px] font-bold text-[#246B4A] uppercase tracking-wide">
                      {selectedLoc.district || 'Gia Lai'}
                    </span>
                    <span className="text-[10px] font-bold text-[#C26D38]">
                      {(!selectedLoc.budget || selectedLoc.budget === 0 || selectedLoc.budget === '0') ? 'Miễn phí vé' : selectedLoc.budget}
                    </span>
                  </div>
                  <h3 className="font-editorial text-sm font-bold text-[#1A1D1A] truncate leading-tight">
                    {selectedLoc.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#5A635B] mt-1">
                  <div className="flex items-center text-[#C26D38] font-bold">
                    <Star size={13} fill="#C26D38" />
                    <span className="ml-0.5 text-xs">{selectedLoc.avgRating || selectedLoc.rating || 4.8}</span>
                  </div>
                  <span>•</span>
                  <span>
                    {userPos
                      ? `Cách bạn ${getDistanceFromLatLonInKm(userPos[0], userPos[1], selectedLoc.lat, selectedLoc.lng)} km`
                      : (selectedLoc.district || 'Gia Lai')}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedLoc(null)}
                className="w-6 h-6 rounded-full bg-[#FAFAF7] hover:bg-[#E8EBE5] text-[#8A948C] flex items-center justify-center shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            {/* Dual Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#E8EBE5]">
              <button
                onClick={() => navigate(`/destinations/${selectedLoc.id}`)}
                className="h-9 rounded-full border border-[#E8EBE5] hover:bg-[#FAFAF7] text-[#1A1D1A] text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Info size={14} className="text-[#5A635B]" />
                <span>Xem chi tiết</span>
              </button>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLoc.lat},${selectedLoc.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 rounded-full bg-[#246B4A] hover:bg-[#1E573C] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Navigation size={14} />
                <span>Chỉ đường</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
