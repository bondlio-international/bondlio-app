'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Check, X, Palette, Pencil } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { getLabels } from '@/lib/i18n'

type LookupRow = {
    id: number
    name: string
    name_en?: string
    color?: string
    code?: string
    symbol?: string
    active?: boolean
    sort_order?: number
}

type TableConfig = {
    key: string
    label: string
    labelEn: string
    table: string
    hasColor?: boolean
    hasCode?: boolean
    hasSymbol?: boolean
    hasNameEn?: boolean
}

const TABLES: TableConfig[] = [
    { key: 'countries', label: 'Ülkeler', labelEn: 'Countries', table: 'lookup_countries', hasNameEn: true },
    { key: 'cities', label: 'Şehirler', labelEn: 'Cities', table: 'lookup_cities', hasNameEn: true },
    { key: 'nationalities', label: 'Uyruklar', labelEn: 'Nationalities', table: 'lookup_nationalities', hasNameEn: true },
    { key: 'sources', label: 'Kaynaklar', labelEn: 'Sources', table: 'lookup_sources', hasNameEn: true },
    { key: 'services', label: 'Hizmetler', labelEn: 'Services', table: 'lookup_services', hasNameEn: true },
    { key: 'categories', label: 'Kategoriler', labelEn: 'Categories', table: 'lookup_categories', hasNameEn: true },
    { key: 'currencies', label: 'Para Birimleri', labelEn: 'Currencies', table: 'lookup_currencies', hasCode: true, hasSymbol: true },
    { key: 'availability', label: 'Müsaitlik', labelEn: 'Availability', table: 'lookup_availability', hasColor: true, hasNameEn: true },
    { key: 'legal_status', label: 'Yasal Durum', labelEn: 'Legal Status', table: 'lookup_legal_status', hasNameEn: true },
    { key: 'work_types', label: 'Çalışma Şekli', labelEn: 'Work Types', table: 'lookup_work_types', hasNameEn: true },
    { key: 'religions', label: 'Dinler', labelEn: 'Religions', table: 'lookup_religions', hasNameEn: true },
    { key: 'languages', label: 'Diller', labelEn: 'Languages', table: 'lookup_languages', hasNameEn: true },
    { key: 'accounts', label: 'Hesaplar', labelEn: 'Accounts', table: 'lookup_accounts', hasNameEn: true },
    { key: 'request_stages', label: 'Talep Aşamaları', labelEn: 'Request Stages', table: 'lookup_request_stages', hasColor: true, hasNameEn: true },
    { key: 'match_stages', label: 'Eşleşme Aşamaları', labelEn: 'Match Stages', table: 'lookup_match_stages', hasColor: true, hasNameEn: true },
    { key: 'match_status', label: 'Eşleşme Durumu', labelEn: 'Match Status', table: 'lookup_match_status', hasColor: true, hasNameEn: true },
    { key: 'departure_reasons', label: 'Ayrılma Sebepleri', labelEn: 'Departure Reasons', table: 'lookup_departure_reasons', hasNameEn: true },
]

export default function AdminPage() {
    const supabase = createClient()
    const { lang } = useLang()
    const labels = getLabels(lang)
    const L = { ...labels, ...labels.admin }
    const [activeTab, setActiveTab] = useState(TABLES[0].key)
    const [data, setData] = useState<Record<string, LookupRow[]>>({})
    const [loading, setLoading] = useState<Record<string, boolean>>({})
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState<Partial<LookupRow>>({})
    const [newForm, setNewForm] = useState<Partial<LookupRow>>({})
    const [showNew, setShowNew] = useState(false)

    const activeConfig = TABLES.find(t => t.key === activeTab)!

    useEffect(() => {
        if (!data[activeTab]) fetchTable(activeTab)
    }, [activeTab])

    const fetchTable = async (key: string) => {
        const config = TABLES.find(t => t.key === key)!
        setLoading(l => ({ ...l, [key]: true }))
        const { data: rows } = await supabase
            .from(config.table)
            .select('*')
            .order('sort_order', { ascending: true })
        if (rows) setData(d => ({ ...d, [key]: rows }))
        setLoading(l => ({ ...l, [key]: false }))
    }

    const handleSaveEdit = async (row: LookupRow) => {
        const { id, ...updateData } = editForm
        await supabase.from(activeConfig.table).update(updateData).eq('id', row.id)
        setEditingId(null)
        fetchTable(activeTab)
    }

    const handleDelete = async (id: number) => {
        if (!confirm(L.deleteConfirm)) return
        await supabase.from(activeConfig.table).delete().eq('id', id)
        fetchTable(activeTab)
    }

    const handleAdd = async () => {
        if (!newForm.name) return alert(L.nameRequired)
        const maxOrder = Math.max(0, ...(data[activeTab] ?? []).map(r => r.sort_order ?? 0))
        await supabase.from(activeConfig.table).insert({ ...newForm, sort_order: maxOrder + 1, active: true })
        setNewForm({})
        setShowNew(false)
        fetchTable(activeTab)
    }

    const handleToggleActive = async (row: LookupRow) => {
        await supabase.from(activeConfig.table).update({ active: !row.active }).eq('id', row.id)
        fetchTable(activeTab)
    }

    const rows = data[activeTab] ?? []

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold" style={{ color: '#4A4A4A' }}> {L.title}</h2>
                <p className="text-sm text-gray-500 mt-0.5"> {L.subtitle}</p>
            </div>

            {/* Tab listesi */}
            <div className="bg-white rounded-2xl p-2 mb-4 flex flex-wrap gap-1" style={{ border: '1px solid #ede9e3' }}>
                {TABLES.map(t => (
                    <button key={t.key} onClick={() => { setActiveTab(t.key); setShowNew(false); setEditingId(null) }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                            background: activeTab === t.key ? '#E8673A' : 'transparent',
                            color: activeTab === t.key ? '#fff' : '#6B7280',
                        }}>
                        {lang === 'en' ? t.labelEn : t.label}
                    </button>
                ))}
            </div>

            {/* İçerik */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ede9e3' }}>
                <div className="overflow-x-auto">

                    {/* Başlık */}
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: '1px solid #ede9e3', background: '#F7F6FB' }}>
                        <span className="text-sm font-semibold" style={{ color: '#4A4A4A' }}>
                            {lang === 'en' ? activeConfig.labelEn : activeConfig.label}
                            <span className="ml-2 text-xs font-normal text-gray-400">({rows.length} {L.records})</span>
                        </span>
                        <button
                            onClick={() => { setShowNew(true); setNewForm({}) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                            style={{ background: '#E8673A' }}>
                            <Plus size={13} /> {L.newRecord}
                        </button>
                    </div>

                    {/* Yeni satır formu */}
                    {showNew && (
                        <div className="flex items-center gap-2 px-4 py-3"
                            style={{ borderBottom: '1px solid #ede9e3', background: '#fffaf8' }}>
                            <input
                                value={newForm.name ?? ''}
                                onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                                placeholder={L.namePlaceholder}
                                className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                                style={{ border: '1px solid #E8673A', color: '#4A4A4A' }}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                autoFocus
                            />
                            {activeConfig.hasNameEn && (
                                <input
                                    value={newForm.name_en ?? ''}
                                    onChange={e => setNewForm(f => ({ ...f, name_en: e.target.value }))}
                                    placeholder="English name"
                                    className="w-32 px-3 py-1.5 rounded-lg text-sm outline-none"
                                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}
                                />
                            )}
                            {activeConfig.hasCode && (
                                <input
                                    value={newForm.code ?? ''}
                                    onChange={e => setNewForm(f => ({ ...f, code: e.target.value }))}
                                    placeholder={L.codePlaceholder}
                                    className="w-20 px-3 py-1.5 rounded-lg text-sm outline-none"
                                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}
                                />
                            )}
                            {activeConfig.hasSymbol && (
                                <input
                                    value={newForm.symbol ?? ''}
                                    onChange={e => setNewForm(f => ({ ...f, symbol: e.target.value }))}
                                    placeholder={L.symbolPlaceholder}
                                    className="w-16 px-3 py-1.5 rounded-lg text-sm outline-none"
                                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}
                                />
                            )}
                            {activeConfig.hasColor && (
                                <div className="flex items-center gap-1.5">
                                    <Palette size={14} color="#9CA3AF" />
                                    <input
                                        type="color"
                                        value={newForm.color ?? '#6B7280'}
                                        onChange={e => setNewForm(f => ({ ...f, color: e.target.value }))}
                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                    />
                                </div>
                            )}
                            <button onClick={handleAdd}
                                className="p-1.5 rounded-lg hover:bg-green-50 transition-colors">
                                <Check size={16} color="#10B981" />
                            </button>
                            <button onClick={() => setShowNew(false)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                <X size={16} color="#9CA3AF" />
                            </button>
                        </div>
                    )}

                    {/* Tablo */}
                    {loading[activeTab] ? (
                        <div className="p-12 text-center text-gray-400"> {L.loading} </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f5a2a2', background: '#fff2f2', color: '#13459b' }}>
                                    <th className="text-left px-4 py-2 text-xs font-semibold tracking-wide">ID</th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold tracking-wide"> {L.name} </th>
                                    {activeConfig.hasCode && <th className="text-left px-4 py-2 text-xs font-semibold tracking-wide"> {L.code} </th>}
                                    {activeConfig.hasSymbol && <th className="text-left px-4 py-2 text-xs font-semibold tracking-wide"> {L.symbol} </th>}
                                    {activeConfig.hasNameEn && (<th className="text-left px-4 py-2 text-xs font-semibold tracking-wide"> {L.english} </th>)}
                                    {activeConfig.hasColor && <th className="text-left px-4 py-2 text-xs font-semibold tracking-wide"> {L.color} </th>}
                                    <th className="text-left px-4 py-2 text-xs font-semibold tracking-wide"> {L.active} </th>
                                    <th className="text-left px-4 py-2 text-xs font-semibold tracking-wide"> {L.order} </th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-400">Kayıt yok.</td>
                                    </tr>
                                ) : rows.map(row => (
                                    <tr key={row.id}
                                        style={{ borderBottom: '1px solid #f3f0eb' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fffaf8'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td className="px-4 py-2.5">
                                            <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>#{row.id}</span>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            {editingId === row.id ? (
                                                <input
                                                    value={editForm.name ?? ''}
                                                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                                    className="px-2 py-1 rounded text-sm outline-none w-full"
                                                    style={{ border: '1px solid #E8673A', color: '#4A4A4A' }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="text-sm" style={{ color: '#4A4A4A' }}>{row.name}</span>
                                            )}
                                        </td>

                                        {activeConfig.hasNameEn && (
                                            <td className="px-4 py-2.5">
                                                {editingId === row.id ? (
                                                    <input
                                                        value={editForm.name_en ?? ''}
                                                        onChange={e => setEditForm(f => ({ ...f, name_en: e.target.value }))}
                                                        placeholder="English name"
                                                        className="px-2 py-1 rounded text-sm outline-none w-32"
                                                        style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}
                                                    />
                                                ) : (
                                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{row.name_en ?? '—'}</span>
                                                )}
                                            </td>
                                        )}
                                        {activeConfig.hasCode && (
                                            <td className="px-4 py-2.5">
                                                {editingId === row.id ? (
                                                    <input
                                                        value={editForm.code ?? ''}
                                                        onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))}
                                                        className="px-2 py-1 rounded text-sm outline-none w-20"
                                                        style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}
                                                    />
                                                ) : (
                                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{row.code}</span>
                                                )}
                                            </td>
                                        )}
                                        {activeConfig.hasSymbol && (
                                            <td className="px-4 py-2.5">
                                                {editingId === row.id ? (
                                                    <input
                                                        value={editForm.symbol ?? ''}
                                                        onChange={e => setEditForm(f => ({ ...f, symbol: e.target.value }))}
                                                        className="px-2 py-1 rounded text-sm outline-none w-16"
                                                        style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}
                                                    />
                                                ) : (
                                                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{row.symbol}</span>
                                                )}
                                            </td>
                                        )}
                                        {activeConfig.hasColor && (
                                            <td className="px-4 py-2.5">
                                                {editingId === row.id ? (
                                                    <input
                                                        type="color"
                                                        value={editForm.color ?? '#6B7280'}
                                                        onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))}
                                                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                                    />
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 rounded-full" style={{ background: row.color ?? '#6B7280' }} />
                                                        <span className="text-xs" style={{ color: '#9CA3AF' }}>{row.color}</span>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-2.5">
                                            <button onClick={() => handleToggleActive(row)}
                                                className="px-2 py-0.5 rounded-full text-xs"
                                                style={{
                                                    background: row.active ? '#dcfce7' : '#F7F6FB',
                                                    color: row.active ? '#16a34a' : '#9CA3AF'
                                                }}>
                                                {row.active ? L.active : L.passive}
                                            </button>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            {editingId === row.id ? (
                                                <input
                                                    type="number"
                                                    value={editForm.sort_order ?? 0}
                                                    onChange={e => setEditForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                                                    className="px-2 py-1 rounded text-sm outline-none w-16"
                                                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}
                                                />
                                            ) : (
                                                <span className="text-xs" style={{ color: '#9CA3AF' }}>{row.sort_order}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex gap-1 justify-end">
                                                {editingId === row.id ? (
                                                    <>
                                                        <button onClick={() => handleSaveEdit(row)}
                                                            className="p-1.5 rounded-lg hover:bg-green-50 transition-colors">
                                                            <Check size={14} color="#10B981" />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)}
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                            <X size={14} color="#9CA3AF" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => { setEditingId(row.id); setEditForm(row) }}
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                                                            <Pencil size={14} color="#6B7280" />
                                                        </button>
                                                        <button onClick={() => handleDelete(row.id)}
                                                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                                            <Trash2 size={14} color="#EF4444" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}