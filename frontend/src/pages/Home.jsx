import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Compass, CalendarDays, MessageCircle, MapPin, Utensils, Star, Trees, Landmark, Users, Sun } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import DestinationCard from '../components/DestinationCard.jsx'

export default function Home() {
  const { data: stats } = useApi('/stats')
  const { data: featured } = useApi('/featured')
  const navigate = useNavigate()

  return (
    <div className="page">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg">
          <img src="https://cdn.xanhsm.com/2025/03/8d98d60d-bien-ho-pleiku-13.jpg" alt="Biển Hồ T'Nưng Gia Lai" />
        </div>
        <motion.div className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1>Đồ Thị Tri Thức Du Lịch Gia Lai</h1>
          <p>
            Khám phá vẻ đẹp Biển Hồ T'Nưng, miệng núi lửa Chư Đang Ya, thác Phú Cường và không gian văn hóa Cồng chiêng Tây Nguyên qua hệ thống tìm kiếm thông minh Fulltext & Vector Embedding.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/explore')}>
              <Compass size={18} /> Khám phá điểm đến
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/chat')}>
              <MessageCircle size={18} /> Trợ lý AI GraphRAG
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      {stats && (
        <section className="container">
          <motion.div className="stats-bar"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="stat-item">
              <div className="number">{stats.locations}</div>
              <div className="label">Điểm du lịch chính thống</div>
            </div>
            <div className="stat-item">
              <div className="number">{stats.dishes}</div>
              <div className="label">Đặc sản ẩm thực</div>
            </div>
            <div className="stat-item">
              <div className="number">{stats.stays}</div>
              <div className="label">Cơ sở lưu trú</div>
            </div>
            <div className="stat-item">
              <div className="number">{stats.districts}</div>
              <div className="label">Huyện / Thị xã / TP</div>
            </div>
          </motion.div>
        </section>
      )}

      {/* ── 4 Official Categories from Gia Lai Tourism Portal ── */}
      <section className="container section">
        <div className="section-header">
          <h2>4 Danh mục Du lịch Chính thống Tỉnh Gia Lai</h2>
          <Link to="/explore">Xem tất cả →</Link>
        </div>
        <div className="region-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <motion.div className="region-card mountain" whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/explore?category=Điểm du lịch sinh thái, danh lam thắng cảnh tự nhiên')}>
            <img src="https://gialai.info/wp-content/uploads/2023/02/anh-3-3-3135.jpg" alt="Sinh thái tự nhiên" />
            <div className="overlay">
              <Trees size={20} style={{ marginBottom: 4 }} />
              <div>Sinh thái & Thắng cảnh tự nhiên</div>
            </div>
          </motion.div>

          <motion.div className="region-card transition" whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/explore?category=Di tích Lịch sử - Văn hóa - Khảo cổ')}>
            <img src="https://dulichkbang.com/wp-content/uploads/2022/02/cong-khu-di-tich-tay-son-thuong-dao-an-khe-gia-lai-800x400.jpg" alt="Di tích Lịch sử" />
            <div className="overlay">
              <Landmark size={20} style={{ marginBottom: 4 }} />
              <div>Di tích Lịch sử - Khảo cổ</div>
            </div>
          </motion.div>

          <motion.div className="region-card culture" whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/explore?category=Văn hóa Dân tộc, Làng nghề & Lễ hội truyền thống')}>
            <img src="https://media.gody.vn/images/gia-lai/chua-minh-thanh/11-2016/20161101090033-chua-minh-thanh-gody(3).jpg" alt="Văn hóa Dân tộc" />
            <div className="overlay">
              <Users size={20} style={{ marginBottom: 4 }} />
              <div>Bản sắc Dân tộc & Lễ hội</div>
            </div>
          </motion.div>

          <motion.div className="region-card park" whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/explore?category=Công viên & Không gian cảnh quan công cộng')}>
            <img src="https://vstatic.vietnam.vn/vietnam/resource/IMAGE/2024/11/12/quang-truong-dai-doan-ket.jpg" alt="Công viên cảnh quan" />
            <div className="overlay">
              <Sun size={20} style={{ marginBottom: 4 }} />
              <div>Công viên & Cảnh quan đô thị</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Destinations ── */}
      {featured?.locations && (
        <section className="container section">
          <div className="section-header">
            <h2>Điểm đến nổi bật tại Gia Lai</h2>
            <Link to="/explore">Xem tất cả →</Link>
          </div>
          <div className="cards-grid">
            {featured.locations.map((loc, i) => (
              <DestinationCard key={loc.id || i} index={i} {...loc} />
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Food ── */}
      {featured?.dishes && (
        <section className="container section">
          <div className="section-header">
            <h2>Ẩm thực đặc sản Gia Lai (Thông tin bổ sung)</h2>
            <Link to="/food">Xem tất cả →</Link>
          </div>
          <div className="cards-grid">
            {featured.dishes.map((dish, i) => (
              <motion.div key={dish.id || i} className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate('/food')}
              >
                <div className="card-image">
                  <img src={dish.imageUrl || 'https://placehold.co/400x250/1e293b/64748b?text=Food'} alt={dish.name} loading="lazy" />
                </div>
                <div className="card-body">
                  <h3>{dish.name}</h3>
                  {dish.budget && <div className="price">{dish.budget}</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="container section" style={{ textAlign: 'center', paddingBottom: '80px' }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Sẵn sàng khám phá Gia Lai?</h2>
          <p style={{ color: 'var(--color-text-2)', marginBottom: '24px' }}>
            Hỏi đáp tự nhiên với trợ lý AI được tăng cường Đồ thị Tri thức (GraphRAG)
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>
            <MessageCircle size={18} /> Trò chuyện với AI ngay
          </button>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer container">
        <p>© 2026 Du Lịch Tỉnh Gia Lai — Hệ Thống Đồ Thị Tri Thức & Tìm Kiếm Thông Minh (Neo4j & GraphRAG)</p>
      </footer>
    </div>
  )
}
