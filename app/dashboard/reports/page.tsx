'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Globe, Languages, BookOpen, Calendar, Home, PawPrint, BadgeInfo, ClipboardList, MapPin } from 'lucide-react'
import domtoimage from 'dom-to-image-more'


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
  private_room: boolean
  responsibilities: string[]
  allowance: number
  allowance_currency: string
  employers?: { city: string; district: string; country: string; full_name: string }
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
      searching: 'YENİ İŞ FIRSATI',
      people: 'Kişi Sayısı',
      nationality: 'Uyruk',
      language: 'Dil',
      religion: 'Din',
      age: 'Yaş',
      start: 'Başlangıç',
      room: 'Özel Oda',
      pets: 'Evcil Hayvan',
      salary: 'MAAŞ',
      noSmoking: '🚭 Sigara İçemez',
      noAlcohol: '🚫 Alkol İçemez',
      legal: '📋 Legal',
      privateRoom: 'Özel Oda Mevcut',
      petsHome: 'Evcil Hayvan',
      responsibilities: 'Sorumluluklar',
      religionPreference: 'Din Farketmez',
      person: 'kişi',
      allowance: 'Harçlık',
    },
    en: {
      searching: 'NEW JOB OFFER',
      people: 'No. of People',
      nationality: 'Nationality',
      language: 'Language',
      religion: 'Religion',
      age: 'Age',
      start: 'Start',
      room: 'Private Room',
      pets: 'PETS',
      salary: 'SALARY',
      noSmoking: '🚭 Non-Smoker',
      noAlcohol: '🚫 No Alcohol',
      legal: '📋 Legal Required',
      privateRoom: 'Private Room Provided',
      petsHome: 'Pets at Home',
      responsibilities: 'RESPONSIBILITIES',
      religionPreference: 'Any Religion',
      person: 'people',
      allowance: 'Allowance'
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
      supabase.from('requests').select('*, employers(city, district, country, private_room, full_name)')
        .not('stage', 'in', '("Yerleşti","Anlaşamadılar","Vazgeçti")')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase.from('lookup_nationalities').select('name, name_en'),
      supabase.from('lookup_languages').select('name, name_en'),
      supabase.from('lookup_religions').select('name, name_en'),
      supabase.from('lookup_services').select('name, name_en'),
      supabase.from('lookup_work_types').select('name, name_en')
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

  const downloadImage = async () => {
    const card = document.getElementById('story-card')
    if (!card) return
    const dataUrl = await domtoimage.toJpeg(card, {
      quality: 0.95,
      scale: 2,
    })
    const link = document.createElement('a')
    link.download = `bondlio-${r.service?.split('/')[0].trim() || 'ilan'}-${r.id}.jpg`
    link.href = dataUrl
    link.click()
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


    <div style={{
      background: '#777373', minHeight: '95vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '5px'
    }}>


      {/* Navigasyon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          style={{
            background: current === 0 ? 'rgba(255,255,255,0.1)' : '#E8673A',
            color: '#fff', border: 'none', borderRadius: '12px',
            padding: '10px 20px', fontSize: '12px', fontWeight: '600',
            cursor: current === 0 ? 'not-allowed' : 'pointer',
            opacity: current === 0 ? 0.4 : 1,
          }}>← </button>

        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
          {current + 1} / {requests.length}
        </span>

        <button onClick={() => setCurrent(c => Math.min(requests.length - 1, c + 1))} disabled={current === requests.length - 1}
          style={{
            background: current === requests.length - 1 ? 'rgba(255,255,255,0.1)' : '#E8673A',
            color: '#fff', border: 'none', borderRadius: '12px',
            padding: '10px 20px', fontSize: '12px', fontWeight: '600',
            cursor: current === requests.length - 1 ? 'not-allowed' : 'pointer',
            opacity: current === requests.length - 1 ? 0.4 : 1,
          }}> →</button>


        <button onClick={downloadImage}
          style={{
            background: '#fff',
            color: '#E8673A',
            border: '1px solid #E8673A',
            borderRadius: '12px',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
          }}>
          ⬇ JPG
        </button>

        {/* TR/EN Toggle */}
        <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
          {(['tr', 'en'] as const).map(l => (
            <button key={l} onClick={() => setReportLang(l)}
              style={{
                padding: '10px 16px',
                fontSize: '12px', fontWeight: '700',
                border: 'none', cursor: 'pointer',
                background: reportLang === l ? '#E8673A' : 'rgba(255,255,255,0.1)',
                color: reportLang === l ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.15s',
                letterSpacing: '0.5px',
              }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>



      {/* Story Kartı */}

      <div id="story-card" style={{
        width: '390px',
        height: '693px',
        borderRadius: '24px',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Poppins', sans-serif",
        background: '#FDF6EE',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Üst turuncu bölüm */}
        <div style={{
          background: 'linear-gradient(135deg, #E8673A 0%, #d4522a 100%)',
          padding: '5px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          {/* Dekoratif daireler */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', top: 20, right: 20, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', top: -25, left: -15, width: 97, height: 97, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.16)' }} />
          {r.employers?.full_name && (
            <div style={{ position: 'absolute', top: 16, right: 16, textAlign: 'right' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '500' }}>
                - {r.employers.full_name.split(' ')[0]} ..
              </span>
            </div>
          )}

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
            <img src="/bondlio-icon.png" alt="Bondlio" style={{ height: '34px', width: 'auto', filter: 'brightness(0) invert(1)', display: 'block' }} />

          </div>

          {/* İş ilanı etiketi */}
          <div style={{
            display: 'inline-block',
            background: 'rgba(80, 79, 79, 0.76)',
            borderRadius: '14px',
            padding: '1px 10px',
            marginBottom: '5px',
          }}>
            <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>
              <span> - {L.searching} -</span>
            </span>
          </div>

          {/* Hizmet */}
          <div style={{
            width: '100%',
            marginBottom: '2px',
          }}>
            <div style={{
              background: 'hsla(0, 7%, 92%, 0.86)',
              borderRadius: '10px',
              padding: '7px 1px',
              width: '100%',
            }}>
              <h1 style={{ color: '#070707', fontSize: '26px', fontWeight: '800', lineHeight: '1.1', textTransform: 'uppercase', letterSpacing: '-0.5px', margin: 0 }}>
                 {reportLang === 'tr' ? r.service?.split('/')[0].trim() : toEn(r.service || '', svcLookup).toUpperCase()}
              </h1>
            </div>
          </div>

          {/* Çalışma şekli */}
          {r.work_type && (
            <div style={{
              display: 'inline-block',
              background: '#ffffffe8',
              borderRadius: '12px',
              padding: '0px 10px',
              marginTop: '2px',
            }}>
              <span style={{ color: '#ca4705', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                {reportLang === 'en' ? toEn(r.work_type || '', workLookup).toLocaleUpperCase('en-US') : r.work_type}
              </span>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div style={{ padding: '0', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Lokasyon */}
          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <MapPin size={14} color="#E8673A" />
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#4A4A4A' }}>{location}</span>
            </div>
          )}

          {/* Bilgiler — tablo satırları */}
          {(r.num_kids > 0 || r.min_age || r.max_age) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {r.num_kids > 0 && (
                <>
                  <Users size={14} color="#E8673A" />
                  <span style={{ fontSize: '12px', color: '#4A4A4A' }}>{r.num_kids} {labels[reportLang].person}{r.kids_ages ? ` (${r.kids_ages})` : ''}</span>
                </>
              )}
              {(r.min_age || r.max_age) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                  <BadgeInfo size={14} color="#E8673A" />
                  <span style={{ fontSize: '12px', color: '#4A4A4A' }}>
                    {`${L.age}: `}{r.min_age && r.max_age ? `${r.min_age} - ${r.max_age}` : r.min_age ? `Min ${r.min_age}` : r.max_age ? `Max ${r.max_age}` : '—'}
                  </span>
                </div>
              )}
            </div>
          )}

          {r.desired_nationality?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <Globe size={14} color="#E8673A" />
              <span style={{ fontSize: '12px', color: '#E8673A', fontWeight: '600' }}>
                {r.desired_nationality.map(n => reportLang === 'tr' ? n : toEn(n, natLookup)).join(', ')}
              </span>
            </div>
          )}

          {r.language_pref?.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <Languages size={14} color="#E8673A" />
              <span style={{ fontSize: '12px', color: '#4A4A4A' }}>{r.language_pref.map(l => toEn(l, langLookup)).join(', ')}</span>
            </div>
          )}

          {(r.religion_pref || r.desired_start) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              {r.desired_start && (
                <>
                  <Calendar size={14} color="#E8673A" />
                  <span style={{ fontSize: '12px', color: '#4A4A4A' }}>
                    {`${L.start}: `}{new Date(r.desired_start).toLocaleDateString(reportLang === 'tr' ? 'tr-TR' : 'en-GB', { month: 'long', year: 'numeric' })}
                  </span>
                </>
              )}
              {r.religion_pref && (
                <>
                  <BookOpen size={14} color="#E8673A" style={{ marginLeft: r.desired_start ? 'auto' : undefined }} />
                  <span style={{ fontSize: '12px', color: '#4A4A4A' }}>
                    {reportLang === 'tr' ? r.religion_pref : toEn(r.religion_pref, relLookup)}
                  </span>
                </>
              )}
            </div>
          )}



          {(r.private_room !== null || r.has_pet !== null) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <>
                <Home size={14} color="#E8673A" />
                <span style={{ fontSize: '12px', color: '#4A4A4A' }}>
                  {r.private_room ? L.privateRoom : (reportLang === 'tr' ? 'Özel Oda Yok' : 'No Private Room')}
                </span>
              </>
              <>
                <PawPrint size={14} color="#E8673A" style={{ marginLeft: 'auto' }} />
                <span style={{ fontSize: '12px', color: '#4A4A4A' }}>
                  {r.has_pet ? L.petsHome : (reportLang === 'tr' ? 'Evcil Hayvan Yok' : 'No Pets')}
                </span>
              </>
            </div>
          )}



          {/* Sorumluluklar */}
          {r.responsibilities?.length > 0 && (
            <div style={{ padding: '9px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <ClipboardList size={14} color="#E8673A" />
                <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', letterSpacing: '0.5px' }}>{L.responsibilities}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {[...r.responsibilities].sort((a, b) => {
                  const priority = ['Çocuk Bakımı', 'Yaşlı Bakımı', 'Yeni Doğan']
                  const ai = priority.findIndex(p => a.includes(p))
                  const bi = priority.findIndex(p => b.includes(p))
                  if (ai === -1 && bi === -1) return 0
                  if (ai === -1) return 1
                  if (bi === -1) return -1
                  return ai - bi
                }).map((resp: string) => {
                  const respItem = respLookup.find(l => l.name === resp)
                  const respLabel = reportLang === 'en' && respItem?.name_en ? respItem.name_en : resp
                  return (
                    <span key={resp} style={{ border: '1px solid #ede9e3', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', color: '#4A4A4A', fontWeight: '500' }}>
                      {respLabel}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Koşullar */}
          {(!r.smoking_ok || !r.drinking_ok || r.legal_required) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '9px 20px' }}>
              {!r.smoking_ok && <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: '1px solid #FCA5A5' }}>{L.noSmoking}</span>}
              {!r.drinking_ok && <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: '1px solid #FCA5A5' }}>{L.noAlcohol}</span>}
              {r.legal_required && <span style={{ color: '#E8673A', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px', border: '1px solid #E8673A' }}>{L.legal}</span>}
            </div>
          )}

          {/* Maaş */}
          <div style={{ background: 'linear-gradient(135deg, #E8673A 0%, #d4522a 100%)', borderRadius: '16px', margin: '0 10px 10px', padding: '10px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.94)', fontSize: '20px', fontWeight: '800' }}>{L.salary}</span>
              <span style={{ color: '#fff', fontSize: '24px', fontWeight: '800', fontFamily: "'Poppins', sans-serif" }}>
                {r.max_salary ? `${r.max_salary.toLocaleString('tr-TR')} ${r.salary_currency}` : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '600' }}>{L.allowance}</span>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: '700', fontFamily: "'Poppins', sans-serif" }}>
                {r.allowance ? `${r.allowance.toLocaleString('tr-TR')} ${r.allowance_currency || 'TRY'}` : '—'}
              </span>
            </div>
          </div>

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