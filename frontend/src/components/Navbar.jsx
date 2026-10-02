import { NavLink } from 'react-router-dom'
import { Compass, UtensilsCrossed, Hotel, Map, CalendarDays, MessageCircle, Mountain, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark'
    }
    return false
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <nav className="navbar">
      <div className="container">
        <NavLink to="/" className="navbar-brand">
          <span className="brand-icon"><Mountain size={20} color="#fff" /></span>
          Du Lịch Gia Lai
        </NavLink>
        <ul className="navbar-links">
          <li><NavLink to="/explore" className={({ isActive }) => isActive ? 'active' : ''}><Compass size={16} /> Khám phá</NavLink></li>
          <li><NavLink to="/food" className={({ isActive }) => isActive ? 'active' : ''}><UtensilsCrossed size={16} /> Ẩm thực</NavLink></li>
          <li><NavLink to="/stay" className={({ isActive }) => isActive ? 'active' : ''}><Hotel size={16} /> Lưu trú</NavLink></li>
          <li><NavLink to="/map" className={({ isActive }) => isActive ? 'active' : ''}><Map size={16} /> Bản đồ</NavLink></li>
          <li><NavLink to="/planner" className={({ isActive }) => isActive ? 'active' : ''}><CalendarDays size={16} /> Lộ trình</NavLink></li>
          <li><NavLink to="/chat" className={({ isActive }) => isActive ? 'active' : ''}><MessageCircle size={16} /> AI Trợ lý</NavLink></li>
        </ul>
        <button className="theme-toggle" onClick={() => setDark(d => !d)} title={dark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  )
}
