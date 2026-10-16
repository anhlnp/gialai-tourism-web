import { NavLink } from 'react-router-dom'
import { 
  Compass, UtensilsCrossed, Hotel, Map, CalendarDays, 
  Sparkles, Mountain, Sun, Moon, Flame, Bookmark, Search, MapPin
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark'
    }
    return false
  })

  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const updateCount = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('saved_places') || '[]')
        setSavedCount(saved.length)
      } catch {
        setSavedCount(0)
      }
    }
    updateCount()
    window.addEventListener('storage', updateCount)
    return () => window.removeEventListener('storage', updateCount)
  }, [])

  const navLinks = [
    { to: '/explore', label: 'Khám phá', icon: Compass },
    { to: '/events', label: 'Lễ hội', icon: Flame },
    { to: '/food', label: 'Ẩm thực', icon: UtensilsCrossed },
    { to: '/stay', label: 'Lưu trú', icon: Hotel },
    { to: '/map', label: 'Bản đồ', icon: Map },
    { to: '/planner', label: 'Lộ trình', icon: CalendarDays },
    { to: '/chat', label: 'AI Trợ lý', icon: Sparkles },
    { to: '/saved', label: 'Đã lưu', icon: Bookmark, badge: savedCount > 0 ? savedCount : null },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAFAF7]/92 dark:bg-slate-900/92 backdrop-blur-md border-b border-[#E8EBE5] dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <NavLink 
          to="/" 
          className="flex items-center gap-2.5 shrink-0 group py-1"
          aria-label="Trang chủ Du Lịch Gia Lai"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#246B4A] to-[#194E36] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <Mountain size={20} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-[16px] sm:text-[17px] leading-tight text-[#1A1D1A] dark:text-slate-100 group-hover:text-[#246B4A] transition-colors">
              Du Lịch Gia Lai
            </span>
            <span className="font-sans text-[10.5px] font-medium tracking-wider uppercase text-[#6E756F] dark:text-slate-400">
              Gia Lai Explorer
            </span>
          </div>
        </NavLink>

        {/* Desktop Navigation Links (>= 1024px) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5" aria-label="Điều hướng chính">
          {navLinks.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-sans font-medium transition-all
                ${isActive 
                  ? 'bg-[#EAF2EC] text-[#246B4A] font-semibold dark:bg-[#246B4A]/25 dark:text-emerald-300 shadow-2xs' 
                  : 'text-[#404942] dark:text-slate-300 hover:text-[#246B4A] hover:bg-[#F2F7F3] dark:hover:bg-slate-800 dark:hover:text-emerald-400'
                }
              `}
            >
              <Icon size={15} className="shrink-0" />
              <span>{label}</span>
              {badge !== null && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#246B4A] text-white text-[10px] font-bold">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Right Section Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick AI CTA Button on Desktop */}
          <NavLink
            to="/chat"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#246B4A] hover:bg-[#194E36] text-white text-[12.5px] font-sans font-medium shadow-xs active:scale-95 transition-all"
            title="Trò chuyện với Cố vấn Du lịch AI"
          >
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span>Hỏi AI</span>
          </NavLink>

          {/* Quick Search Button on Mobile (< 1024px) */}
          <NavLink
            to="/explore"
            className="lg:hidden w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-[#E8EBE5] dark:border-slate-700 flex items-center justify-center text-[#6E756F] dark:text-slate-300 hover:text-[#246B4A] active:scale-95 transition-all shadow-2xs"
            aria-label="Tìm kiếm điểm đến"
            title="Tìm kiếm điểm đến"
          >
            <Search size={17} />
          </NavLink>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setDark(d => !d)}
            className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 border border-[#E8EBE5] dark:border-slate-700 flex items-center justify-center text-[#6E756F] dark:text-slate-300 hover:text-[#246B4A] hover:border-[#246B4A]/40 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title={dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            aria-label="Chuyển đổi giao diện sáng/tối"
          >
            {dark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
        </div>

      </div>
    </header>
  )
}
