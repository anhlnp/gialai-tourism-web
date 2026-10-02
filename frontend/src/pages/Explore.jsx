import { useState, useEffect } from 'react'
import { Search, Sparkles, BookOpen, Layers, MapPin, Star, Clock } from 'lucide-react'
import { useApi, getApi } from '../hooks/useApi'
import DestinationCard from '../components/DestinationCard.jsx'

export default function Explore() {
  const [search, setSearch] = useState('')
  const [searchMode, setSearchMode] = useState('filter') // 'filter' | 'fulltext' | 'semantic' | 'hybrid'
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  const params = {}
  if (search && searchMode === 'filter') params.search = search
  if (selectedCategory) params.category = selectedCategory
  if (selectedDistrict) params.region = selectedDistrict

  const { data: defaultLocations, loading: defaultLoading } = useApi('/locations', { params })
  const { data: categories } = useApi('/locations/categories')
  const { data: districts } = useApi('/locations/districts')

  // Xử lý tìm kiếm nâng cao khi chọn mode Fulltext, Semantic hoặc Hybrid
  useEffect(() => {
    if (!search.trim() || searchMode === 'filter') {
      setSearchResults(null)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        let endpoint = `/search/fulltext?q=${encodeURIComponent(search.trim())}`
        if (searchMode === 'semantic') {
          endpoint = `/search/semantic?q=${encodeURIComponent(search.trim())}`
        } else if (searchMode === 'hybrid') {
          endpoint = `/search/hybrid?q=${encodeURIComponent(search.trim())}`
        }
        const data = await getApi(endpoint)
        setSearchResults(data)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, searchMode])

  const locations = searchResults !== null ? searchResults : defaultLocations
  const loading = defaultLoading || searching

  return (
    <div className="page">
      <div className="container section">
        <h1 style={{ fontSize: '2.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text)' }}>
          Khám phá Du lịch Tỉnh Gia Lai
        </h1>
        <p style={{ color: 'var(--color-text-2)', marginBottom: '24px', fontSize: '1.05rem' }}>
          Tra cứu danh thắng, di tích lịch sử và văn hóa chính thống của tỉnh Gia Lai trên Đồ thị Tri thức
        </p>

        {/* Search Mode Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${searchMode === 'filter' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: '20px' }}
            onClick={() => { setSearchMode('filter'); setSearchResults(null); }}
          >
            <Layers size={14} style={{ marginRight: 6 }} /> Danh mục & Lọc cơ bản
          </button>
          <button
            className={`btn ${searchMode === 'fulltext' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: '20px' }}
            onClick={() => setSearchMode('fulltext')}
          >
            <BookOpen size={14} style={{ marginRight: 6 }} /> Fulltext Search (Toàn văn)
          </button>
          <button
            className={`btn ${searchMode === 'semantic' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: '20px' }}
            onClick={() => setSearchMode('semantic')}
          >
            <Sparkles size={14} style={{ marginRight: 6 }} /> Semantic Search (Embedding)
          </button>
          <button
            className={`btn ${searchMode === 'hybrid' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: '20px' }}
            onClick={() => setSearchMode('hybrid')}
          >
            <Search size={14} style={{ marginRight: 6 }} /> Hybrid Search (Kết hợp)
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar" style={{ marginBottom: '28px' }}>
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder={
              searchMode === 'fulltext'
                ? "Nhập từ khóa tìm kiếm toàn văn (ví dụ: núi lửa, thác nước, di tích Tây Sơn...)"
                : searchMode === 'semantic'
                ? "Nhập câu hỏi hoặc ngữ nghĩa (ví dụ: nơi yên bình ngắm hoàng hôn, di tích tiền sử, săn mây sáng sớm...)"
                : searchMode === 'hybrid'
                ? "Tìm kiếm kết hợp từ khóa và ngữ nghĩa embedding..."
                : "Tìm kiếm tên điểm đến Gia Lai..."
            }
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {searchMode !== 'filter' && (
          <div style={{
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.2)',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            color: 'var(--color-primary)'
          }}>
            {searchMode === 'fulltext' && '🔍 Chế độ Fulltext Search: Truy vấn chỉ mục toàn văn trên Neo4j theo thuật toán BM25.'}
            {searchMode === 'semantic' && '✨ Chế độ Semantic Search: Truy vấn ngữ nghĩa dùng Vector Embedding và độ tương đồng Cosine.'}
            {searchMode === 'hybrid' && '⚡ Chế độ Hybrid Search: Kết hợp chuẩn hóa điểm giữa Fulltext Search và Vector Embedding.'}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
          {/* Filters Sidebar */}
          <div className="filters">
            <div className="filter-group">
              <h3>Danh mục chính thống</h3>
              <span
                className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                Tất cả loại hình
              </span>
              {categories?.map(c => (
                <span
                  key={c.id}
                  className={`filter-chip ${selectedCategory === c.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === c.name ? '' : c.name)}
                >
                  {c.name}
                </span>
              ))}
            </div>

            <div className="filter-group">
              <h3>Huyện / Thị xã / Thành phố</h3>
              <span
                className={`filter-chip ${!selectedDistrict ? 'active' : ''}`}
                onClick={() => setSelectedDistrict('')}
              >
                Toàn tỉnh Gia Lai
              </span>
              {districts?.map(d => (
                <span
                  key={d.id}
                  className={`filter-chip ${selectedDistrict === d.name ? 'active' : ''}`}
                  onClick={() => setSelectedDistrict(selectedDistrict === d.name ? '' : d.name)}
                >
                  {d.name} {d.locationCount ? `(${d.locationCount})` : ''}
                </span>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          <div>
            {loading ? (
              <div className="cards-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 300, borderRadius: 16 }} />
                ))}
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--color-text-2)', marginBottom: '16px', fontSize: '0.9rem' }}>
                  Tìm thấy <strong>{locations?.length || 0}</strong> điểm đến Gia Lai phù hợp
                </p>
                <div className="cards-grid">
                  {locations?.map((loc, i) => (
                    <DestinationCard
                      key={loc.id || i}
                      index={i}
                      {...loc}
                      imageUrl={loc.imageUrl}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
