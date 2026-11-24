'use client'

import { createContext, useContext, useState, useEffect } from 'react'

type Lang = 'tr' | 'en'

const LangContext = createContext<{
  lang: Lang
  toggleLang: () => void
  t: (item: { name: string; name_en?: string }) => string
}>({
  lang: 'tr',
  toggleLang: () => {},
  t: (item) => item.name,
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('tr')

  useEffect(() => {
    const saved = localStorage.getItem('bondlio_lang') as Lang
    if (saved) setLang(saved)
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
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}