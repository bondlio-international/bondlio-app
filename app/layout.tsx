import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Bondlio',
  description: 'Bondlio Operasyon',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={nunito.className}>
      <body className="min-h-screen" style={{ background: '#F7F6FB' }}>
        {children}
      </body>
    </html>
  )
}