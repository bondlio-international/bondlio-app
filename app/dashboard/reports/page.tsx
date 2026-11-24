'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Globe, Languages, BookOpen, Calendar, Home, PawPrint, BadgeInfo, ClipboardList } from 'lucide-react'


type Request = {
  id: number
  service: string
  city: string
  work_type: string
  max_salary: number
  salary_currency: string
  desired_nationality: string[]
  language_pref: string[]
  religion_pref: string
  min_age: number
  max_age: number
  num_kids: number
  kids_ages: string
  legal_required: boolean
  smoking_ok: boolean
  drinking_ok: boolean
  has_pet: boolean
  desired_start: string
  notes: string
  employers?: { city: string; district: string; country: string; }
  private_room: boolean
  responsibilities: string[]
}

export default function ReportsPage() {
  const supabase = createClient()
  const [requests, setRequests] = useState<Request[]>([])
  const [natLookup, setNatLookup] = useState<{ name: string; name_en?: string }[]>([])
  const [langLookup, setLangLookup] = useState<{ name: string; name_en?: string }[]>([])
  const [relLookup, setRelLookup] = useState<{ name: string; name_en?: string }[]>([])
  const [svcLookup, setSvcLookup] = useState<{ name: string; name_en?: string }[]>([])
  const [workLookup, setWorkLookup] = useState<{ name: string; name_en?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [reportLang, setReportLang] = useState<'tr' | 'en'>('en')
  const [respLookup, setRespLookup] = useState<{ name: string; name_en?: string }[]>([])



  useEffect(() => { fetchRequests() }, [])

  const labels = {
    tr: {
      searching: 'ARANIYOR',
      people: 'Kişi Sayısı',
      nationality: 'Uyruk',
      language: 'Dil',
      religion: 'Din',
      age: 'Yaş Aralığı',
      start: 'Başlangıç',
      room: 'Özel Oda',
      pets: 'Evcil Hayvan',
      salary: 'Maaş',
      noSmoking: '🚭 Sigara İçemez',
      noAlcohol: '🚫 Alkol Kullanamaz',
      legal: '📋 Yasal Belge Zorunlu',
      privateRoom: 'Özel Oda Mevcut',
      petsHome: 'Evde Hayvan Var',
      responsibilities: 'Sorumluluklar',
      religionPreference: 'Fark Etmez',
    },
    en: {
      searching: 'WE ARE SEARCHING FOR',
      people: 'No. of People',
      nationality: 'Nationality',
      language: 'Language',
      religion: 'Religion',
      age: 'Age Range',
      start: 'Start Date',
      room: 'Private Room',
      pets: 'PETS',
      salary: 'SALARY',
      noSmoking: '🚭 Non-Smoker',
      noAlcohol: '🚫 No Alcohol',
      legal: '📋 Legal Docs Required',
      privateRoom: 'Private Room Available',
      petsHome: 'Pets at Home',
      responsibilities: 'RESPONSIBILITIES',
      religionPreference: 'Any Religion',
    }
  }


  const toEn = (name: string, lookup: { name: string; name_en?: string }[]) => {
    if (!name) return ''
    const found = lookup.find(l => l.name === name)
    return found?.name_en || name
  }

  const toTr = (name: string) => {
    if (!name) return ''
    return name
  }

  const fetchRequests = async () => {
    const [
      { data },
      { data: natLookup },
      { data: langLookup },
      { data: relLookup },
      { data: svcLookup },
      { data: workLookup },
    ] = await Promise.all([
      supabase.from('requests').select('*, employers(city, district, country, private_room)')
        .not('stage', 'in', '("Yerleşti","Anlaşamadılar","Vazgeçti")')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase.from('lookup_nationalities').select('name, name_en'),
      supabase.from('lookup_languages').select('name, name_en'),
      supabase.from('lookup_religions').select('name, name_en'),
      supabase.from('lookup_services').select('name, name_en'),
      supabase.from('lookup_work_types').select('name, name_en'),
    ])
    if (data) setRequests(data)
    if (natLookup) setNatLookup(natLookup)
    if (langLookup) setLangLookup(langLookup)
    if (relLookup) setRelLookup(relLookup)
    if (svcLookup) setSvcLookup(svcLookup)
    if (workLookup) setWorkLookup(workLookup)
    setLoading(false)

    const { data: respData } = await supabase.from('lookup_responsibilities').select('name, name_en')
    if (respData) setRespLookup(respData)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a1a' }}>
      <p className="text-gray-400">Yükleniyor...</p>
    </div>
  )

  if (requests.length === 0) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a1a' }}>
      <p className="text-gray-400">Açık talep bulunmuyor.</p>
    </div>
  )

  const r = requests[current]

  if (!r) return null
  const location = [r.employers?.city, r.employers?.district].filter(Boolean).join(', ') || r.city || ''

  const L = labels[reportLang]

  return (


    <div style={{ background: '#777373', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>


      {/* Navigasyon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{
            background: current === 0 ? 'rgba(255,255,255,0.1)' : '#E8673A',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            opacity: current === 0 ? 0.4 : 1,
          }}>
          ← Önceki
        </button>

        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
          {current + 1} / {requests.length}
        </span>

        <button
          onClick={() => setCurrent(c => Math.min(requests.length - 1, c + 1))}
          disabled={current === requests.length - 1}
          style={{
            background: current === requests.length - 1 ? 'rgba(255,255,255,0.1)' : '#E8673A',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: current === requests.length - 1 ? 'not-allowed' : 'pointer',
            opacity: current === requests.length - 1 ? 0.4 : 1,
          }}>
          Sonraki →
        </button>
      </div>



      {/* Story Kartı */}



      <div id="story-card" style={{
        width: '390px',
        minHeight: '693px',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Inter', sans-serif",
        background: '#FDF6EE',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Üst turuncu bölüm */}
        <div style={{
          background: 'linear-gradient(135deg, #E8673A 0%, #d4522a 100%)',
          padding: '28px 24px 32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Dekoratif daireler */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', top: 20, right: 20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <img src="/bondlio-icon.png" alt="Bondlio" style={{ height: '28px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px' }}>bondlio</span>
          </div>

          {/* İş ilanı etiketi */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            padding: '4px 12px',
            marginBottom: '12px',
          }}>
            <span style={{ color: '#fff', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
              <span>{L.searching}</span>
            </span>
          </div>

          {/* Hizmet */}
          <h1 style={{
            color: '#fff',
            fontSize: '26px',
            fontWeight: '800',
            lineHeight: '1.2',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.5px',
          }}>
            {reportLang === 'tr' ? r.service?.split('/')[0].trim() : toEn(r.service || '', svcLookup)}
          </h1>

          {/* Çalışma şekli */}
          {r.work_type && (
            <div style={{
              display: 'inline-block',
              background: '#fff',
              borderRadius: '20px',
              padding: '4px 14px',
              marginTop: '4px',
            }}>
              <span style={{ color: '#E8673A', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                {reportLang === 'en' ? toEn(r.work_type || '', workLookup).toLocaleUpperCase('en-US') : r.work_type}
              </span>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div style={{ padding: '20px 24px' }}>

          {/* Lokasyon */}
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #ede9e3' }}>
              <span style={{ fontSize: '18px' }}>📍</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#4A4A4A' }}>{location}</span>
            </div>
          )}

          {/* Bilgiler grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>

            {r.num_kids > 0 && (
              <InfoItem icon={Users} value={`${r.num_kids} kişi${r.kids_ages ? ` (${r.kids_ages})` : ''}`} />
            )}

            {(r.min_age || r.max_age) && (
              <InfoItem icon={BadgeInfo}
                value={r.min_age && r.max_age ? `${r.min_age} - ${r.max_age}` : r.min_age ? `Min ${r.min_age}` : `Max ${r.max_age}`} />
            )}

            {r.desired_nationality?.length > 0 && (
              <InfoItem icon={Globe}
                value={r.desired_nationality.map(n => reportLang === 'tr' ? n : toEn(n, natLookup)).join(', ')}
                highlight />
            )}

            {r.language_pref?.length > 0 && (
              <InfoItem icon={Languages}
                value={r.language_pref.map(l => toEn(l, langLookup)).join(', ')} />
            )}

            {r.religion_pref && (
              <InfoItem icon={BookOpen} value={r.religion_pref && r.religion_pref !== ''
                ? (reportLang === 'tr' ? r.religion_pref : toEn(r.religion_pref, relLookup))
                : L.religionPreference} />
            )}

            {r.desired_start && (
              <InfoItem icon={Calendar}
                value={new Date(r.desired_start).toLocaleDateString(reportLang === 'tr' ? 'tr-TR' : 'en-GB', { month: 'long', year: 'numeric' })} />
            )}

            {r.private_room && (
              <InfoItem icon={Home} value={L.privateRoom} />
            )}
            {r.has_pet && (
              <InfoItem icon={PawPrint} value={L.petsHome} />
            )}

          </div>

          {/* Sorumluluklar */}
          {r.responsibilities?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <ClipboardList size={14} color="#9CA3AF" />
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.5px' }}>
                  {L.responsibilities}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {r.responsibilities.map((resp: string) => {
                  const respItem = respLookup.find(l => l.name === resp)
                  const respLabel = reportLang === 'en' && respItem?.name_en ? respItem.name_en : resp
                  return (
                    <span key={resp} style={{
                      background: '#F7F6FB',
                      border: '1px solid #ede9e3',
                      borderRadius: '20px',
                      padding: '2px 10px',
                      fontSize: '11px',
                      color: '#4A4A4A',
                      fontWeight: '500'
                    }}>
                      {respLabel}
                    </span>
                  )
                })}
              </div>
            </div>
          )}


          {/* Koşullar */}
          {(!r.smoking_ok || !r.drinking_ok || r.legal_required) && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {!r.smoking_ok && (
                  <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                    {L.noSmoking}
                  </span>
                )}
                {!r.drinking_ok && (
                  <span style={{ background: '#FEF2F2', color: '#EF4444', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                    {L.noAlcohol}
                  </span>
                )}
                {r.legal_required && (
                  <span style={{ background: '#fdf1ec', color: '#E8673A', fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                    {L.legal}
                  </span>
                )}
              </div>
            </div>
          )}


          {/* Notlar

          {r.notes && (
            <div style={{ background: '#F7F6FB', borderRadius: '12px', padding: '10px 14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: '1.5' }}>{r.notes}</p>
            </div>
          )}

         */}

          {/* Maaş — en altta vurgulu */}
          {r.max_salary && (
            <div style={{
              background: 'linear-gradient(135deg, #E8673A 0%, #d4522a 100%)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: '600' }}> {L.salary} </span>
              <span style={{ color: '#fff', fontSize: '22px', fontWeight: '800' }}>
                {r.max_salary.toLocaleString('tr-TR')} {r.salary_currency}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: '#4A4A4A',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>bondlio.com</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>People · Trust · Connect</span>
        </div>

      </div>



    </div>
  )
}

function InfoItem({ icon: Icon, value, highlight }: {
  icon: React.ComponentType<{ size?: number; color?: string }>
  value: string
  highlight?: boolean
}) {
  return (
    <div style={{
      background: highlight ? '#FFF3EE' : '#F7F6FB',
      borderRadius: '12px',
      padding: '10px 12px',
      border: highlight ? '1px solid #E8673A' : '1px solid transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Icon size={14} color={highlight ? '#E8673A' : '#9CA3AF'} />
        <p style={{ fontSize: '13px', fontWeight: '700', color: highlight ? '#E8673A' : '#4A4A4A', margin: 0 }}>{value}</p>
      </div>
    </div>
  )
}