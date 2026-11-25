'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Lang = 'tr' | 'en'

type LangContextType = {
  lang: Lang
  toggleLang: () => void
  t: (item: { name: string; name_en?: string }) => string
  userRole: string
}

// Context default:
const LangContext = createContext<LangContextType>({
  lang: 'tr',
  toggleLang: () => { },
  t: (item) => item.name,
  userRole: '',  // ← 'agent' değil ''
})


export function LangProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [lang, setLang] = useState<Lang>('tr')

  const [userRole, setUserRole] = useState<string>('') 

  useEffect(() => {
    const saved = localStorage.getItem('bondlio_lang') as Lang
    if (saved) setLang(saved)

    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', user.id)
          .single()
        if (profile) setUserRole(profile.user_role)
      }
    }
    fetchRole()
  }, [])

  const toggleLang = () => {
    const next = lang === 'tr' ? 'en' : 'tr'
    setLang(next)
    localStorage.setItem('bondlio_lang', next)
  }

  const t = (item: { name: string; name_en?: string }) => {
    if (lang === 'en' && item.name_en) return item.name_en
    return item.name
  }

  return (
    <LangContext.Provider value={{ lang, toggleLang, t, userRole }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}