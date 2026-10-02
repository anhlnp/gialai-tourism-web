import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useApi } from '../hooks/useApi'

export default function MapPage() {
  const { data: locations } = useApi('/locations?limit=200')
  const navigate = useNavigate()

  const center = [14.05, 108.05] // Trung tâm tỉnh Gia Lai (khu vực Pleiku - Chư Păh)
  const validLocations = locations?.filter(l => l.lat && l.lng) || []

  return (
    <div className="map-page">
      <MapContainer center={center} zoom={9} style={{ height: 'calc(100vh - 72px)', width: '100%' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CARTO</a>'
        />
        {validLocations.map(loc => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <strong>{loc.name}</strong>
                <br />
                <span style={{ fontSize: '0.85em', color: '#666' }}>{loc.district}</span>
                {loc.budget && <><br /><span style={{ color: '#10b981', fontWeight: 600 }}>{loc.budget}</span></>}
                <br />
                <button
                  onClick={() => navigate(`/destination/${loc.id}`)}
                  style={{ marginTop: 8, padding: '4px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Xem chi tiết
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
