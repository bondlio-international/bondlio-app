'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#F7F6FB' }}>
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-md p-8"
        style={{ border: '1px solid #ede9e3' }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-8">
            <img src="/bondlio-logo-login.png" alt="Bondlio" className="h-40 w-auto py-2" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5"
              style={{ color: '#4A4A4A' }}>E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid #ede9e3', color: '#4A4A4A', background: '#F7F6FB' }}
              onFocus={e => e.target.style.borderColor = '#E8673A'}
              onBlur={e => e.target.style.borderColor = '#ede9e3'}
              placeholder="ornek@bondlio.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5"
              style={{ color: '#4A4A4A' }}>Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ border: '1.5px solid #ede9e3', color: '#4A4A4A', background: '#F7F6FB' }}
              onFocus={e => e.target.style.borderColor = '#E8673A'}
              onBlur={e => e.target.style.borderColor = '#ede9e3'}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: '#E8673A' }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}