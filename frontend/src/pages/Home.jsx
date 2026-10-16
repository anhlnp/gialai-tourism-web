import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Compass,
  CalendarDays,
  Sparkles,
  MapPin,
  Search,
  Star,
  Trees,
  Landmark,
  Users,
  Sun,
  ArrowRight,
  Utensils,
  Hotel
} from 'lucide-react'
import { useApi } from '../hooks/useApi'
import DestinationCard from '../components/DestinationCard.jsx'

export default function Home() {
  const { data: stats } = useApi('/stats')
  const { data: featured } = useApi('/featured')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCat, setSelectedCat] = useState('ALL')
  const navigate = useNavigate()

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const categories = [
    { id: 'ALL', name: 'Tất cả điểm đến', icon: Compass },
    { id: 'NATURE', name: 'Sinh thái & Núi lửa', icon: Trees, query: 'Điểm du lịch sinh thái, danh lam thắng cảnh tự nhiên' },
    { id: 'HISTORY', name: 'Di tích Lịch sử', icon: Landmark, query: 'Di tích Lịch sử - Văn hóa - Khảo cổ' },
    { id: 'CULTURE', name: 'Văn hóa Cồng chiêng', icon: Users, query: 'Văn hóa Dân tộc, Làng nghề & Lễ hội truyền thống' },
    { id: 'PARK', name: 'Cảnh quan Đô thị', icon: Sun, query: 'Công viên & Không gian cảnh quan công cộng' },
  ]

  return (
    <div className="page pb-24 md:pb-12" style={{ paddingTop: '16px' }}>
      <div className="container" style={{ maxWidth: '1280px' }}>
        {/* ── Top Editorial Header (Stitch Screen 1) ── */}
        <section style={{ marginBottom: '22px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            <MapPin size={14} />
            <span>Gia Lai • Tây Nguyên</span>
          </div>

          <h1 className="font-editorial" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 400, lineHeight: 1.15, margin: '6px 0 8px 0', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Chạm vào <span className="editorial-italic">đại ngàn</span>
          </h1>

          <p style={{ color: 'var(--color-text-3)', fontSize: '0.95rem', maxWidth: '520px', lineHeight: 1.6, margin: 0 }}>
            Hôm nay bạn muốn lắng nghe thanh âm nào của phố núi? Khám phá vẻ đẹp kỳ vĩ của Biển Hồ, miệng núi lửa bazan triệu năm và văn hóa bản địa qua Đồ thị Tri thức Neo4j & GraphRAG.
          </p>
        </section>

        {/* ── Floating Search Pill ── */}
        <section style={{ marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%', maxWidth: '640px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-pill)',
              padding: '6px 10px 6px 18px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'border-color var(--transition-fast)'
            }}>
              <Search size={18} style={{ color: 'var(--color-primary)', marginRight: '10px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Tìm thác nước, đồi chè, cà phê, núi lửa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  background: 'transparent',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontFamily: 'var(--font-body)'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background var(--transition-fast)'
                }}
              >
                Tìm kiếm
              </button>
            </div>
          </form>
        </section>

        {/* ── Filter Chips Row ── */}
        <section style={{ marginBottom: '28px' }}>
          <div className="filter-chips-row">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isSelected = selectedCat === cat.id
              return (
                <button
                  key={cat.id}
                  className={`chip-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCat(cat.id)
                    if (cat.query) {
                      navigate(`/explore?category=${encodeURIComponent(cat.query)}`)
                    } else if (cat.id === 'ALL') {
                      navigate('/explore')
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icon size={14} />
                  <span>{cat.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Hero Feature Destination: Biển Hồ T'Nưng ── */}
        <section style={{ marginBottom: '36px' }}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              minHeight: '360px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '24px',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/destination/LOC_BIENHO')}
          >
            <img
              src="https://cdn.xanhsm.com/2025/03/8d98d60d-bien-ho-pleiku-13.jpg"
              alt="Biển Hồ T'Nưng"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0
              }}
            />
            {/* Gradient Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(20, 26, 22, 0.92) 0%, rgba(20, 26, 22, 0.4) 50%, rgba(0,0,0,0.15) 100%)',
              zIndex: 1
            }} />

            {/* Content over image */}
            <div style={{ position: 'relative', zIndex: 2, color: '#ffffff' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.92)',
                  color: 'var(--color-primary)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '11px',
                  fontWeight: 700,
                  backdropFilter: 'blur(8px)'
                }}>
                  Kỳ quan Đại Ngàn
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.85)',
                  color: 'var(--color-text)',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Star size={12} fill="var(--color-terracotta)" color="var(--color-terracotta)" />
                  4.9 (1.2k đánh giá)
                </span>
              </div>

              <h2 className="font-editorial" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 6px 0', color: '#ffffff' }}>
                Biển Hồ T'Nưng — Đôi mắt Pleiku
              </h2>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.88)', maxWidth: '600px', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                Miệng núi lửa cổ đại triệu năm phẳng lặng tựa gương soi giữa cao nguyên bazan, rợp bóng hàng thông trăm tuổi trầm mặc.
              </p>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  Khám phá điểm đến <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── AI Discovery / GraphRAG Banner ── */}
        <section style={{ marginBottom: '36px' }}>
          <div style={{
            background: 'var(--color-primary-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                <Sparkles size={14} />
                <span>Trợ lý AI • GraphRAG Kiến thức Đồ thị</span>
              </div>
              <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--color-text)' }}>
                Hỏi đáp hành trình & Gợi ý thông minh
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-text-2)', lineHeight: 1.5, margin: 0 }}>
                Hệ thống truy xuất ngữ nghĩa từ cơ sở dữ liệu Neo4j, tự động kết nối địa danh, đặc sản ẩm thực và cơ sở lưu trú gần nhất cho bạn.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/chat')}
                style={{ padding: '10px 20px', fontSize: '13px' }}
              >
                <Sparkles size={16} /> Hỏi AI ngay
              </button>
              <button
                className="btn btn-outline"
                onClick={() => navigate('/planner')}
                style={{ padding: '10px 18px', fontSize: '13px' }}
              >
                <CalendarDays size={16} /> Tạo lộ trình
              </button>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        {stats && (
          <section style={{ marginBottom: '36px' }}>
            <div className="stats-bar" style={{ borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
              <div className="stat-item">
                <div className="number">{stats.locations}</div>
                <div className="label">Điểm đến danh thắng</div>
              </div>
              <div className="stat-item">
                <div className="number">{stats.dishes}</div>
                <div className="label">Mỹ vị đặc sản</div>
              </div>
              <div className="stat-item">
                <div className="number">{stats.stays}</div>
                <div className="label">Khách sạn & Homestay</div>
              </div>
              <div className="stat-item">
                <div className="number">{stats.districts}</div>
                <div className="label">Huyện / Thị xã / TP</div>
              </div>
            </div>
          </section>
        )}

        {/* ── 4 Official Categories ── */}
        <section style={{ marginBottom: '40px' }}>
          <div className="section-header" style={{ marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-terracotta)', fontWeight: 700 }}>
                Bản thể học du lịch
              </span>
              <h2 className="font-editorial" style={{ fontSize: '1.65rem', margin: '2px 0 0 0', color: 'var(--color-text)' }}>
                4 Nhóm Danh mục <span className="editorial-italic">Chính thống</span>
              </h2>
            </div>
            <Link to="/explore" style={{ fontSize: '13px', fontWeight: 600 }}>Xem tất cả →</Link>
          </div>

          <div className="region-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
            <motion.div className="region-card mountain" whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/explore?category=Điểm du lịch sinh thái, danh lam thắng cảnh tự nhiên')}>
              <img src="https://gialai.info/wp-content/uploads/2023/02/anh-3-3-3135.jpg" alt="Sinh thái tự nhiên" />
              <div className="overlay">
                <Trees size={22} style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 700 }}>Sinh thái & Núi lửa</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Hồ T'Nưng, Chư Đang Ya, Thác K50</div>
              </div>
            </motion.div>

            <motion.div className="region-card transition" whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/explore?category=Di tích Lịch sử - Văn hóa - Khảo cổ')}>
              <img src="https://dulichkbang.com/wp-content/uploads/2022/02/cong-khu-di-tich-tay-son-thuong-dao-an-khe-gia-lai-800x400.jpg" alt="Di tích Lịch sử" />
              <div className="overlay">
                <Landmark size={22} style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 700 }}>Di tích Lịch sử - Khảo cổ</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Tây Sơn Thượng Đạo, Rộc Tưng - Gò Đá</div>
              </div>
            </motion.div>

            <motion.div className="region-card culture" whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/explore?category=Văn hóa Dân tộc, Làng nghề & Lễ hội truyền thống')}>
              <img src="https://media.gody.vn/images/gia-lai/chua-minh-thanh/11-2016/20161101090033-chua-minh-thanh-gody(3).jpg" alt="Văn hóa Dân tộc" />
              <div className="overlay">
                <Users size={22} style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 700 }}>Bản sắc Dân tộc & Lễ hội</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Không gian Cồng chiêng, Chùa Minh Thành</div>
              </div>
            </motion.div>

            <motion.div className="region-card park" whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/explore?category=Công viên & Không gian cảnh quan công cộng')}>
              <img src="https://vstatic.vietnam.vn/vietnam/resource/IMAGE/2024/11/12/quang-truong-dai-doan-ket.jpg" alt="Công viên cảnh quan" />
              <div className="overlay">
                <Sun size={22} style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 700 }}>Công viên & Không gian đô thị</div>
                <div style={{ fontSize: '11px', opacity: 0.85 }}>Quảng trường Đại Đoàn Kết, Diên Hồng</div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Featured Destinations Grid ── */}
        {featured?.locations && (
          <section style={{ marginBottom: '40px' }}>
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-primary)', fontWeight: 700 }}>
                  Danh lam tiêu biểu
                </span>
                <h2 className="font-editorial" style={{ fontSize: '1.65rem', margin: '2px 0 0 0', color: 'var(--color-text)' }}>
                  Điểm đến <span className="editorial-italic">nổi bật</span>
                </h2>
              </div>
              <Link to="/explore" style={{ fontSize: '13px', fontWeight: 600 }}>Tất cả ({stats?.locations || 30}) →</Link>
            </div>
            <div className="cards-grid">
              {featured.locations.slice(0, 6).map((loc, i) => (
                <DestinationCard key={loc.id || i} index={i} {...loc} />
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Food ── */}
        {featured?.dishes && (
          <section style={{ marginBottom: '40px' }}>
            <div className="section-header" style={{ marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-terracotta)', fontWeight: 700 }}>
                  Thổ nhưỡng & Hương vị
                </span>
                <h2 className="font-editorial" style={{ fontSize: '1.65rem', margin: '2px 0 0 0', color: 'var(--color-text)' }}>
                  Mỹ vị ẩm thực <span className="editorial-italic">Gia Lai</span>
                </h2>
              </div>
              <Link to="/food" style={{ fontSize: '13px', fontWeight: 600 }}>Xem tất cả ({stats?.dishes || 30}) →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              {featured.dishes.slice(0, 4).map((dish, i) => (
                <motion.div
                  key={dish.id || i}
                  whileHover={{ y: -4 }}
                  onClick={() => navigate('/food')}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ height: '160px', overflow: 'hidden' }}>
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'}
                      alt={dish.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
                        {dish.name}
                      </h4>
                      {dish.budget && (
                        <span style={{ fontSize: '12px', color: 'var(--color-terracotta)', fontWeight: 600 }}>
                          {dish.budget}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Xem địa chỉ quán ngon <ArrowRight size={12} />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
