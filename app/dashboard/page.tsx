'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Building2, Handshake, Link2, Bell, AlertTriangle, Clock, TrendingUp, TrendingDown, FileText } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({
    candidates: 0,
    employers: 0,
    agents: 0,
    matches_active: 0,
    matches_passive: 0,
    requests_open: 0,
    replacement: 0,
    pending_commission: 0,
  })
  const [incomeByCurrency, setIncomeByCurrency] = useState<Record<string, { total: number; paid: number }>>({})
  const [expenseByCurrency, setExpenseByCurrency] = useState<Record<string, number>>({})
  const [alerts, setAlerts] = useState<any[]>([])
  const [replacements, setReplacements] = useState<any[]>([])
  const [recentMatches, setRecentMatches] = useState<any[]>([])
  const [openRequests, setOpenRequests] = useState<any[]>([])
  const [availabilityStats, setAvailabilityStats] = useState<Record<string, number>>({})
  const [nationalityStats, setNationalityStats] = useState<Record<string, number>>({})
  const [expenseCategoryStats, setExpenseCategoryStats] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const twoDaysLater = new Date()
    twoDaysLater.setDate(twoDaysLater.getDate() + 2)
    const twoDaysStr = twoDaysLater.toISOString().split('T')[0]
    const todayStr = new Date().toISOString().split('T')[0]


    const [
      { count: candidates },
      { count: employers },
      { count: agents },
      { count: matches_active },
      { count: matches_passive },
      { count: requests_open },
      { count: replacement },
      { count: pending_commission },
      { data: incomeData },
      { data: expenseData },
      { data: alertData },
      { data: replacementData },
      { data: matchData },
      { data: requestData },
      { data: availData },
      { data: natData },
      { data: expCatData },
    ] = await Promise.all([
      supabase.from('candidates').select('*', { count: 'exact', head: true }),
      supabase.from('employers').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_active', false),
      supabase.from('requests').select('*', { count: 'exact', head: true }).not('stage', 'in', '("Yerleşti","Anlaşamadılar","Vazgeçti")'),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('replacement_requested', true),
      supabase.from('matches').select('*', { count: 'exact', head: true }).or('employer_agent_paid.eq.false,candidate_agent_paid.eq.false').eq('is_active', true),
      supabase.from('income').select('total_amount, paid_amount, currency'),
      supabase.from('expenses').select('amount, currency'),
      supabase.from('requests').select('id, employers(full_name), alert_date, stage').lte('alert_date', twoDaysStr).gte('alert_date', todayStr).order('alert_date'),
      supabase.from('matches').select('id, employers(full_name), candidates(full_name)').eq('replacement_requested', true).limit(5),
      supabase.from('matches').select('id, employers(full_name), candidates(full_name), status, start_date, bondlio_fee, fee_currency').order('created_at', { ascending: false }).limit(5),
      supabase.from('requests').select('id, employers(full_name), service, stage, desired_start').not('stage', 'in', '("Yerleşti","Anlaşamadılar","Vazgeçti")').order('created_at', { ascending: false }).limit(5),
      supabase.from('candidates').select('availability'),
      supabase.from('candidates').select('nationality'),
      supabase.from('expenses').select('category, amount, currency'),
    ])

    // Gelir özeti
    const inc: Record<string, { total: number; paid: number }> = {}
    incomeData?.forEach(i => {
      const cur = i.currency || 'USD'
      if (!inc[cur]) inc[cur] = { total: 0, paid: 0 }
      inc[cur].total += i.total_amount || 0
      inc[cur].paid += i.paid_amount || 0
    })

    // Gider özeti
    const exp: Record<string, number> = {}
    expenseData?.forEach(e => {
      const cur = e.currency || 'USD'
      if (!exp[cur]) exp[cur] = 0
      exp[cur] += e.amount || 0
    })

    setCounts({
      candidates: candidates ?? 0,
      employers: employers ?? 0,
      agents: agents ?? 0,
      matches_active: matches_active ?? 0,
      matches_passive: matches_passive ?? 0,
      requests_open: requests_open ?? 0,
      replacement: replacement ?? 0,
      pending_commission: pending_commission ?? 0,
    })
    setIncomeByCurrency(inc)
    setExpenseByCurrency(exp)
    setAlerts(alertData ?? [])
    setReplacements(replacementData ?? [])
    setRecentMatches(matchData ?? [])
    setOpenRequests(requestData ?? [])
    // Availability dağılımı
    const avail: Record<string, number> = {}
    availData?.forEach(c => {
      const a = c.availability || 'Belirtilmemiş'
      avail[a] = (avail[a] || 0) + 1
    })
    setAvailabilityStats(avail)

    // Uyruk dağılımı
    const nat: Record<string, number> = {}
    natData?.forEach(c => {
      const n = c.nationality?.split('/')[0].trim() || 'Belirtilmemiş'
      nat[n] = (nat[n] || 0) + 1
    })
    setNationalityStats(nat)

    // Kategori bazlı gider
    const expCat: Record<string, Record<string, number>> = {}
    expCatData?.forEach(e => {
      const cat = e.category?.split('/')[0].trim() || 'Diğer'
      const cur = e.currency || 'USD'
      if (!expCat[cat]) expCat[cat] = {}
      if (!expCat[cat][cur]) expCat[cat][cur] = 0
      expCat[cat][cur] += e.amount || 0
    })
    setExpenseCategoryStats(expCat)
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    'Devam Ediyor': '#10B981',
    'Sözleşme Bitti': '#3B82F6',
    'Dikkat': '#F59E0B',
    'Tehlike Çanları': '#EF4444',
    'Ayrıldı - Aile Kaynaklı': '#F59E0B',
    'Ayrıldı - Çalışan Kaynaklı': '#F97316',
    'Kaçtı': '#7F1D1D',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-4">

        {/* Aday Durumları — Pie */}
        <div className="bg-white rounded-2xl" style={{ border: '1px solid #ede9e3' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #ede9e3' }}>
            <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Aday Durumları</p>
          </div>
          <div className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0">
              <PieChart width={140} height={140}>
                <Pie
                  data={Object.entries(availabilityStats).map(([name, value]) => ({ name: name.split('/')[0].trim(), value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value">
                  {Object.keys(availabilityStats).map((_, i) => (
                    <Cell key={i} fill={['#E8673A', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][i % 6]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </div>
            <div className="flex-1 space-y-1.5">
              {Object.entries(availabilityStats).sort((a, b) => b[1] - a[1]).map(([status, count], i) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: ['#E8673A', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][i % 6] }} />
                    <span className="text-xs" style={{ color: '#4A4A4A' }}>{status.split('/')[0].trim()}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#4A4A4A' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Uyruk Dağılımı — Pie */}
        <div className="bg-white rounded-2xl" style={{ border: '1px solid #ede9e3' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #ede9e3' }}>
            <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Uyruk Dağılımı</p>
          </div>
          <div className="p-4 flex items-center gap-4">
            <div className="flex-shrink-0">
              <PieChart width={140} height={140}>
                <Pie
                  data={Object.entries(nationalityStats).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value]) => ({ name: name.split('/')[0].trim(), value }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value">
                  {Object.keys(nationalityStats).slice(0, 7).map((_, i) => (
                    <Cell key={i} fill={['#3B82F6', '#10B981', '#F59E0B', '#E8673A', '#8B5CF6', '#EC4899', '#06B6D4'][i % 7]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value, name]}
                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </div>
            <div className="flex-1 space-y-1.5">
              {Object.entries(nationalityStats).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([nat, count], i) => (
                <div key={nat} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: ['#3B82F6', '#10B981', '#F59E0B', '#E8673A', '#8B5CF6', '#EC4899', '#06B6D4'][i % 7] }} />
                    <span className="text-xs" style={{ color: '#4A4A4A' }}>{nat.split('/')[0].trim()}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#4A4A4A' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gider Kalemleri — Bar */}
        <div className="bg-white rounded-2xl" style={{ border: '1px solid #ede9e3' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #ede9e3' }}>
            <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Gider Kalemleri</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={Object.entries(expenseCategoryStats)
                  .map(([cat, byCur]) => ({
                    name: cat.split('/')[0].trim(),
                    ...byCur
                  }))
                  .sort((a, b) => {
                    const aTotal = Object.values(a).filter(v => typeof v === 'number').reduce((s: number, v) => s + (v as number), 0)
                    const bTotal = Object.values(b).filter(v => typeof v === 'number').reduce((s: number, v) => s + (v as number), 0)
                    return bTotal - aTotal
                  })
                  .slice(0, 7)}
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#4A4A4A' }} width={80} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="USD" fill="#EF4444" radius={[0, 4, 4, 0]} />
                <Bar dataKey="TRY" fill="#F97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Üst 4 kart */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Toplam İşveren', value: counts.employers, icon: Building2, color: '#8B5CF6' },
          { label: 'Toplam Aday', value: counts.candidates, icon: Users, color: '#3B82F6' },
          { label: 'Aktif Aracı', value: counts.agents, icon: Handshake, color: '#E8673A' },
          { label: 'Aktif Eşleşme', value: counts.matches_active, icon: Link2, color: '#10B981' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ede9e3' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold" style={{ color: '#4A4A4A' }}>{card.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}18` }}>
                  <Icon size={20} color={card.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* İkinci 4 kart */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Açık Talep', value: counts.requests_open, icon: FileText, color: '#6B7280' },
          { label: 'Pasif Eşleşme', value: counts.matches_passive, icon: Clock, color: '#9CA3AF' },
          { label: 'Değişim Talebi', value: counts.replacement, icon: AlertTriangle, color: counts.replacement > 0 ? '#EF4444' : '#9CA3AF' },
          { label: 'Bekleyen Komisyon', value: counts.pending_commission, icon: Bell, color: counts.pending_commission > 0 ? '#F59E0B' : '#9CA3AF' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #ede9e3' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}18` }}>
                  <Icon size={20} color={card.color} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Orta — Yapılacaklar + Mali */}
      <div className="grid grid-cols-2 gap-4">

        {/* Yapılacaklar */}
        <div className="space-y-4">

          {/* Alarmlar */}
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #ede9e3' }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #ede9e3' }}>
              <Bell size={15} color="#EF4444" />
              <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Yaklaşan Alarmlar</p>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: alerts.length > 0 ? '#FEF2F2' : '#F7F6FB', color: alerts.length > 0 ? '#EF4444' : '#9CA3AF' }}>
                {alerts.length}
              </span>
            </div>
            {alerts.length === 0 ? (
              <p className="text-xs text-gray-400 p-4">Yaklaşan alarm yok.</p>
            ) : alerts.map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid #f3f0eb' }}>
                <div>
                  <p className="text-sm" style={{ color: '#4A4A4A' }}>{a.employers?.full_name ?? '-'}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>{a.stage}</p>
                </div>
                <span className="text-xs font-medium" style={{ color: '#EF4444' }}>
                  {a.alert_date ? new Date(a.alert_date).toLocaleDateString('tr-TR') : '-'}
                </span>
              </div>
            ))}
          </div>

          {/* Değişim talepleri */}
          <div className="bg-white rounded-2xl" style={{ border: '1px solid #ede9e3' }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #ede9e3' }}>
              <AlertTriangle size={15} color="#F59E0B" />
              <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Değişim Talepleri</p>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: replacements.length > 0 ? '#FEF3C7' : '#F7F6FB', color: replacements.length > 0 ? '#D97706' : '#9CA3AF' }}>
                {replacements.length}
              </span>
            </div>
            {replacements.length === 0 ? (
              <p className="text-xs text-gray-400 p-4">Değişim talebi yok.</p>
            ) : replacements.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2.5"
                style={{ borderBottom: '1px solid #f3f0eb' }}>
                <p className="text-sm" style={{ color: '#4A4A4A' }}>
                  {r.employers?.full_name ?? '-'} → {r.candidates?.full_name ?? '-'}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#FEF2F2', color: '#EF4444' }}>⚠️ Değişim</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mali Özet */}
        <div className="space-y-4">


          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #ede9e3' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={15} color="#10B981" />
              <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Gelirler</p>
            </div>
            <div className="flex gap-6 flex-wrap">
              {Object.entries(incomeByCurrency).map(([cur, vals], i, arr) => (
                <div key={cur} className="flex items-stretch gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#42be57' }}>{cur}</p>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Toplam</p>
                        <div style={{ borderTop: '1px solid #ede9e3', paddingTop: '6px' }}>
                          <p className="text-xl font-bold" style={{ color: '#4A4A4A' }}>{vals.total.toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Ödenen</p>
                        <div style={{ borderTop: '1px solid #ede9e3', paddingTop: '6px' }}>
                          <p className="text-xl font-bold" style={{ color: '#10B981' }}>{vals.paid.toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Kalan</p>
                        <div style={{ borderTop: '1px solid #ede9e3', paddingTop: '6px' }}>
                          <p className="text-xl font-bold" style={{ color: (vals.total - vals.paid) > 0 ? '#EF4444' : '#10B981' }}>
                            {(vals.total - vals.paid).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ borderRight: '1px solid #ede9e3', margin: '0 4px' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #ede9e3' }}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={15} color="#EF4444" />
              <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Giderler</p>
            </div>
            {Object.keys(expenseByCurrency).length === 0 ? (
              <p className="text-xs text-gray-400">Kayıt yok.</p>
            ) : (
              <div className="flex gap-6 flex-wrap">
                {Object.entries(expenseByCurrency).map(([cur, total], i, arr) => (
                  <div key={cur} className="flex items-stretch gap-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#EF4444' }}>{cur}</p>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Toplam</p>
                        <div style={{ borderTop: '1px solid #ede9e3', paddingTop: '6px' }}>
                          <p className="text-xl font-bold" style={{ color: '#EF4444' }}>
                            {total.toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ borderRight: '1px solid #ede9e3', margin: '0 4px' }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>


        </div>
      </div>

      {/* Alt — Son eşleşmeler + Açık talepler */}
      <div className="grid grid-cols-2 gap-4">

        {/* Son eşleşmeler */}
        <div className="bg-white rounded-2xl" style={{ border: '1px solid #ede9e3' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #ede9e3' }}>
            <Link2 size={15} color="#E8673A" />
            <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Son Eşleşmeler</p>
          </div>
          {recentMatches.length === 0 ? (
            <p className="text-xs text-gray-400 p-4">Eşleşme yok.</p>
          ) : recentMatches.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: i < recentMatches.length - 1 ? '1px solid #f3f0eb' : 'none' }}>
              <div>
                <p className="text-sm" style={{ color: '#4A4A4A' }}>
                  {m.employers?.full_name ?? '-'} → {m.candidates?.full_name ?? '-'}
                </p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {m.start_date ? new Date(m.start_date).toLocaleDateString('tr-TR') : '-'}
                  {m.bondlio_fee ? ` · ${m.bondlio_fee} ${m.fee_currency}` : ''}
                </p>
              </div>
              {m.status && (
                <span className="text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ background: statusColors[m.status] ?? '#6B7280' }}>
                  {m.status}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Açık talepler */}
        <div className="bg-white rounded-2xl" style={{ border: '1px solid #ede9e3' }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #ede9e3' }}>
            <FileText size={15} color="#E8673A" />
            <p className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>Açık Talepler</p>
          </div>
          {openRequests.length === 0 ? (
            <p className="text-xs text-gray-400 p-4">Açık talep yok.</p>
          ) : openRequests.map((r, i) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: i < openRequests.length - 1 ? '1px solid #f3f0eb' : 'none' }}>
              <div>
                <p className="text-sm" style={{ color: '#4A4A4A' }}>{r.employers?.full_name ?? '-'}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>
                  {r.service?.split('/')[0].trim() ?? '-'}
                  {r.desired_start ? ` · ${new Date(r.desired_start).toLocaleDateString('tr-TR')}` : ''}
                </p>
              </div>
              {r.stage && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: '#F7F6FB', color: '#6B7280' }}>
                  {r.stage}
                </span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}