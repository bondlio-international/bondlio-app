'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  ClipboardList,
  Link2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LogOut,
  Menu,
  Settings,
  X,
} from 'lucide-react'
import { LangProvider } from '@/lib/LangContext'
import { useLang } from '@/lib/LangContext'

const menuItems = [
  { href: '/dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { href: '/dashboard/employers', label: 'İşverenler', icon: Building2 },
  { href: '/dashboard/candidates', label: 'Adaylar', icon: Users },
  { href: '/dashboard/agents', label: 'Aracılar', icon: Handshake },
  { href: '/dashboard/requests', label: 'Talepler', icon: ClipboardList },
  { href: '/dashboard/matches', label: 'Eşleşmeler', icon: Link2 },
  { href: '/dashboard/income', label: 'Gelirler', icon: TrendingUp },
  { href: '/dashboard/expenses', label: 'Giderler', icon: TrendingDown },
  { href: '/dashboard/reports', label: 'Raporlar', icon: BarChart3 },
  { href: '/dashboard/admin', icon: Settings, label: 'Admin' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LangProvider>
      <DashboardInner>{children}</DashboardInner>
    </LangProvider>
  )
}

function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { lang, toggleLang } = useLang()

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const closeSidebar = () => {
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#F7F6FB' }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 shadow-sm transition-all duration-300 h-full"
        style={{
          width: sidebarOpen ? '240px' : isMobile ? '0px' : '64px',
          minWidth: sidebarOpen ? '240px' : isMobile ? '0px' : '64px',
          background: '#fff',
          borderRight: '1px solid #ede9e3',
          position: isMobile ? 'fixed' : 'relative',
          zIndex: isMobile ? 30 : 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid #ede9e3' }}>
          {sidebarOpen ? (
            <img src="/bondlio-logo.png" alt="Bondlio" className="h-10 w-auto" />
          ) : (
            !isMobile && <img src="/bondlio-icon.png" alt="Bondlio" className="h-9 w-auto" />
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl mb-0.5 transition-all"
                style={isActive ? { background: '#E8673A', color: '#fff' } : { color: '#4A4A4A' }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#fdf1ec'
                    e.currentTarget.style.color = '#E8673A'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#4A4A4A'
                  }
                }}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #ede9e3' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all"
            style={{ color: '#4A4A4A' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fdf1ec'
              e.currentTarget.style.color = '#E8673A'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#4A4A4A'
            }}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Header */}
        <header
          className="bg-white px-4 py-3 flex items-center gap-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #ede9e3' }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: '#4A4A4A' }}
          >
            {isMobile && sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1 className="font-semibold text-sm flex-1 truncate" style={{ color: '#4A4A4A' }}>
            {menuItems.find((m) => m.href === pathname)?.label ?? 'Bondlio'}
          </h1>

          <div className="flex items-center gap-1 p-1 rounded-lg flex-shrink-0"
            style={{ background: '#F7F6FB', border: '1px solid #ede9e3' }}>
            <button
              onClick={() => lang !== 'tr' && toggleLang()}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                background: lang === 'tr' ? '#E8673A' : 'transparent',
                color: lang === 'tr' ? '#fff' : '#9CA3AF',
              }}>
              TR
            </button>
            <button
              onClick={() => lang !== 'en' && toggleLang()}
              className="px-2.5 py-1 rounded-md text-xs font-semibold transition-all"
              style={{
                background: lang === 'en' ? '#E8673A' : 'transparent',
                color: lang === 'en' ? '#fff' : '#9CA3AF',
              }}>
              EN
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {children}
        </main>
      </div>
    </div>
  )
}