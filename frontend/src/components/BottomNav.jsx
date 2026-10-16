import { NavLink } from 'react-router-dom'
import { Compass, MapPin, CalendarDays, Sparkles, Bookmark } from 'lucide-react'

export default function BottomNav() {
  return (
    <nav className="stitch-bottom-nav" aria-label="Thanh điều hướng chính">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `stitch-tab-item ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon-wrap">
          <Compass size={20} />
        </span>
        <span>Khám phá</span>
      </NavLink>

      <NavLink
        to="/map"
        className={({ isActive }) => `stitch-tab-item ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon-wrap">
          <MapPin size={20} />
        </span>
        <span>Bản đồ</span>
      </NavLink>

      <NavLink
        to="/planner"
        className={({ isActive }) => `stitch-tab-item ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon-wrap">
          <CalendarDays size={20} />
        </span>
        <span>Lịch trình</span>
      </NavLink>

      <NavLink
        to="/chat"
        className={({ isActive }) => `stitch-tab-item ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon-wrap">
          <Sparkles size={20} />
        </span>
        <span>Trợ lý AI</span>
      </NavLink>

      <NavLink
        to="/saved"
        className={({ isActive }) => `stitch-tab-item ${isActive ? 'active' : ''}`}
      >
        <span className="tab-icon-wrap">
          <Bookmark size={20} />
        </span>
        <span>Đã lưu</span>
      </NavLink>
    </nav>
  )
}
