import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sun, Moon, Menu, GraduationCap, Bell, User } from 'lucide-react'
import logo from '@/assets/LOGO.png'

export default function Header(){
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = userRaw ? JSON.parse(userRaw) : null

  // Fetch unread notifications count and update badge
  async function refreshBadge(){
    try {
      const badge = document.getElementById('notif-badge')
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token) { if (badge) badge.classList.add('hidden'); return }
      const api = (await import('../services/api.js')).default
      const res = await api.getUnreadNotificationsCount()
      const count = res?.count ?? 0
      if (badge) {
        badge.textContent = String(count)
        badge.classList.toggle('hidden', count === 0)
      }
    } catch {}
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    const saved = localStorage.getItem('theme')

    // Respect saved preference if present
    if (saved === 'dark') {
      root.classList.add('dark')
      setIsDark(true)
    } else if (saved === 'light') {
      root.classList.remove('dark')
      setIsDark(false)
    } else {
      // Fallback: use system preference if available; default to dark for broader consistency
      const hasMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      const prefersDark = hasMatchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : true
      root.classList.toggle('dark', prefersDark)
      setIsDark(prefersDark)
    }

    // Initial fetch
    refreshBadge()

    // Optional: refresh on visibility change
    function onVis(){ if (!document.hidden) refreshBadge() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Re-fetch badge when route or auth status changes (e.g., after login/logout)
  useEffect(() => {
    refreshBadge()
  }, [location.pathname, token])

  function toggleDark(){
    const root = document.documentElement
    const next = !root.classList.contains('dark')
    root.classList.toggle('dark', next)
    setIsDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  async function logout(){
    try {
      const api = (await import('../services/api.js')).default
      await api.logout()
    } catch {}
    navigate('/login', { replace: true })
  }

  const NavAuth = () => (
    token && user ? (
      <>
        {user?.user_type !== 'admin' && (
          <Link to="/dashboard" className="inline-flex md:hidden px-3 py-2 text-sm rounded-lg transition
            bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white">
            لوحة الطالب
          </Link>
        )}
        {user?.user_type === 'admin' && (
          <>
            <Link to="/admin" className={`md:hidden px-3 py-2 text-sm rounded-lg transition ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-black/10 border-black/20 hover:bg-black/20 text-black'}`}>لوحة المشرف</Link>
            <Link to="/admin/manage" className={`md:hidden px-3 py-2 text-sm rounded-lg transition ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-black/10 border-black/20 hover:bg-black/20 text-black'}`}>الإدارة</Link>
          </>
        )}
        <Link to="/notifications" className="relative p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition" aria-label="الإشعارات">
          <Bell className="w-5 h-5" />
          <span id="notif-badge" className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] leading-5 text-center hidden"></span>
        </Link>
        <Link to="/profile" className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition" aria-label="الملف الشخصي">
          <User className="w-5 h-5" />
        </Link>
        <button onClick={logout} className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition">تسجيل الخروج</button>
      </>
    ) : (
      <>
        <Link
          to="/login"
          className={[
            'px-3 py-2 text-sm rounded-lg transition border',
            location.pathname === '/'
              ? `${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-black/10 border-black/20 hover:bg-black/20 text-black'}`
              : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white'
          ].join(' ')}
        >
          تسجيل الدخول
        </Link>
        <Link to="/register" className="px-3 py-2 text-sm rounded-lg btn-primary hover:bg-primary/90 transition">إنشاء حساب</Link>
      </>
    )
  )

  return (
    <header
      className={[
        'w-full sticky top-0 z-50 border-b shadow-sm transition-colors',
        // Solid fallback, then semi-transparent if backdrop supported
        'bg-white/90 dark:bg-gray-900/90 supports-[-webkit-backdrop-filter]:bg-white/60 supports-[-webkit-backdrop-filter]:dark:bg-gray-900/60 supports-[-webkit-backdrop-filter]:backdrop-blur',
        'supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-900/60 supports-[backdrop-filter]:backdrop-blur',
        location.pathname === '/'
          ? 'border-black/5 dark:border-white/10'
          : 'text-gray-900 dark:text-white border-black/5 dark:border-white/10'
      ].join(' ')}
      dir="rtl"
    >
      <div className="nurso-container py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="relative inline-block">
              <span className="absolute -inset-1 rounded-full bg-white/30 blur-md hidden sm:block" />
              <img src={logo} alt="شعار Team Nursopedia" className="w-9 h-9 rounded-full object-cover relative hover:opacity-90 transition-opacity" />
            </span>
            <span className={[
              'text-lg sm:text-xl font-extrabold tracking-tight',
              location.pathname === '/'
                ? 'text-black dark:text-white supports-[background-clip:text]:bg-gradient-to-r supports-[background-clip:text]:from-black/90 supports-[background-clip:text]:via-black/80 supports-[background-clip:text]:to-black/70 supports-[background-clip:text]:dark:from-white supports-[background-clip:text]:dark:via-white/90 supports-[background-clip:text]:dark:to-white/80 supports-[background-clip:text]:bg-clip-text supports-[background-clip:text]:text-transparent'
                : 'text-gray-900 dark:text-white'
            ].join(' ')}>
              Team Nursopedia
            </span>
          </Link>
          {token && user && (
            <>
              {user?.user_type !== 'admin' && (
                <Link
                  to="/dashboard"
                  className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-primary text-white hover:bg-primary/90 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>لوحة الطالب</span>
                </Link>
              )}
              {user?.user_type === 'admin' && (
                <>
                  {user?.user_type === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-primary text-white hover:bg-primary/90 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition"
                      >
                        لوحة المشرف
                      </Link>
                      <Link
                        to="/admin/manage"
                        className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full bg-primary text-white hover:bg-primary/90 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition"
                      >
                        الإدارة
                      </Link>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Desktop nav */}
        <nav className={`hidden md:flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
          <button onClick={toggleDark} aria-label="تبديل الوضع" className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 text-black dark:text-white transition">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <NavAuth />
        </nav>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-2">
          <button onClick={toggleDark} aria-label="تبديل الوضع" className={`p-2 rounded-lg transition ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-black'}`}>
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setMobileOpen(v => !v)} aria-label="القائمة" className={`p-2 rounded-lg transition ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-black/10 border-black/20 text-black'}`}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={`md:hidden border-t backdrop-blur animate-fade-in ${isDark ? 'border-white/10 bg-white/10 text-white' : 'border-black/10 bg-black/10 text-black'}`}>
          <div className="nurso-container py-3 flex flex-col gap-3">
            <NavAuth />
          </div>
        </div>
      )}
    </header>
  )
}