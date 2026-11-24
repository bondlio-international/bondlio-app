'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLookups } from '@/lib/useLookups'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Pencil, Trash2, AlertCircle,
  Star, X, Cigarette, Wine, Waves, Sparkles, FolderOpen, Info, PawPrint
} from 'lucide-react'


type Candidate = {
  id: number
  full_name: string
  phone: string
  email: string
  nationality: string
  religion: string
  languages: string[]
  legal_status: string
  availability: string
  skills: string[]
  rank: number
  blacklist: boolean
  origin_city: string
  current_country: string
  current_city: string
  work_type: string
  salary_currency: string
  expected_salary: number
  can_swim: boolean
  smokes: boolean
  drinks: boolean
  tattoo: boolean
  married: boolean
  num_children: number
  available_from: string
  reason_for_leaving: string
  reference_name: string
  reference_contact: string
  documents_url: string
  notes: string
  created_at: string
  pet_ok: boolean
}

export default function CandidatesPage() {
  const supabase = createClient()
  const { lookups } = useLookups()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [nationalityFilter, setNationalityFilter] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('')
  const [legalFilter, setLegalFilter] = useState('')

  useEffect(() => { fetchCandidates() }, [])

  const fetchCandidates = async () => {
    setLoading(true)
    const { data } = await supabase.from('candidates').select('*').order('created_at', { ascending: false })
    if (data) setCandidates(data)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu adayı silmek istediğinizden emin misiniz?')) return
    await supabase.from('candidates').delete().eq('id', id)
    fetchCandidates()
  }

  const columns = useMemo<ColumnDef<Candidate>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>#{getValue() as number}</span>
      ),
    },
    {
      accessorKey: 'full_name',
      header: 'Ad Soyad',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.blacklist && <AlertCircle size={13} color="#EF4444" />}
          <div>
            <p className="text-sm font-medium" style={{ color: '#4A4A4A' }}>{row.original.full_name}</p>
            {row.original.phone && <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.phone}</p>}
            {row.original.email && <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.email}</p>}
          </div>
        </div>
      ),
    },
    {
      id: 'nationality',
      accessorFn: row => row.nationality ?? '',
      header: 'Uyruk / Din',
      filterFn: 'equals',
      cell: ({ row }) => (
        <div>
          <p className="text-sm" style={{ color: '#4A4A4A' }}>
            {row.original.nationality?.split('/')[0].trim() || '-'}
          </p>
          {row.original.origin_city && (
            <p className="text-xs" style={{ color: '#245bbb' }}>
              {row.original.origin_city}
            </p>
          )}

        </div>
      ),
    },
    {
      id: 'location',
      header: 'Konum',
      cell: ({ row }) => (
        <div>
          <p className="text-sm" style={{ color: '#4A4A4A' }}>
            {[row.original.current_country?.split('/')[0].trim(), row.original.current_city]
              .filter(Boolean).join(', ') || '-'}
          </p>
          {row.original.religion && (
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              {row.original.religion.split('/')[0].trim()}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'skills',
      header: 'Hizmet',
      cell: ({ getValue }) => {
        const skills = getValue() as string[]
        if (!skills?.length) return <span className="text-gray-400">-</span>
        return (
          <p className="text-xs" style={{ color: '#4A4A4A', maxWidth: '150px', lineHeight: '1.5' }}>
            {skills.map(s => s.split('/')[0].trim()).join(', ')}
          </p>
        )
      },
    },
    {
      accessorKey: 'legal_status',
      header: 'Yasal',
      cell: ({ getValue }) => (
        <span className="text-xs" style={{ color: '#4A4A4A' }}>
          {String(getValue() ?? '').split('/')[0].trim() || '-'}
        </span>
      ),
      filterFn: 'equals',
    },
    {
      accessorKey: 'availability',
      header: 'Durum',
      cell: ({ row }) => {
        const val = row.original.availability ?? ''
        const found = lookups.availability.find(a => a.name === val)
        const color = found?.color ?? '#6B7280'
        return val ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ background: color }}>
            {val.split('/')[0].trim()}
          </span>
        ) : <span className="text-gray-400">-</span>
      },
      filterFn: 'equals',
    },
    {
      accessorKey: 'expected_salary',
      header: 'Maaş',
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>
          {row.original.expected_salary ? `${Number(row.original.expected_salary).toLocaleString('tr-TR')} ${row.original.salary_currency}` : '—'}
        </span>
      ),
    },
    {
      id: 'traits',
      header: 'Özellik',
      cell: ({ row }) => (
        <div className="flex gap-1.5 items-center">
          <Waves size={14} color={row.original.can_swim ? '#3B82F6' : '#E5E7EB'} />
          <Cigarette size={14} color={row.original.smokes ? '#F59E0B' : '#E5E7EB'} />
          <Wine size={14} color={row.original.drinks ? '#8B5CF6' : '#E5E7EB'} />
          <Sparkles size={14} color={row.original.tattoo ? '#EF4444' : '#E5E7EB'} />
          <PawPrint size={14} color={row.original.pet_ok ? '#10B981' : '#E5E7EB'} />
        </div>
      ),
    },
    {
      accessorKey: 'rank',
      header: 'Rank',
      cell: ({ getValue }) => (
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={12}
              fill={i <= Number(getValue() ?? 0) ? '#E8673A' : 'none'}
              color={i <= Number(getValue() ?? 0) ? '#E8673A' : '#D1D5DB'} />
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Eklenme',
      cell: ({ getValue }) => (
        <div>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            {getValue() ? new Date(String(getValue())).toLocaleDateString('tr-TR') : '-'}
          </p>
          <p className="text-xs" style={{ color: '#C4C4C4' }}>
            {getValue() ? new Date(String(getValue())).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>
      ),
    },

    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end items-center">

          {/* Notlar */}
          {row.original.notes ? (
            <div className="relative group">
              <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <Info size={15} color="#4A4A4A" />
              </button>
              <div className="absolute right-0 bottom-8 z-10 w-64 p-3 rounded-xl shadow-lg text-xs invisible group-hover:visible"
                style={{ background: '#1F2937', color: '#fff', lineHeight: '1.5' }}>
                {row.original.notes}
                <div className="absolute bottom-[-6px] right-3 w-3 h-3 rotate-45"
                  style={{ background: '#1F2937' }} />
              </div>
            </div>
          ) : (
            <span className="p-1.5">
              <Info size={15} color="#E5E7EB" />
            </span>
          )}

          {/* Belgeler */}
          {row.original.documents_url ? (
            <a href={row.original.documents_url} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-orange-50 transition-colors" title="Belgeler">
              <FolderOpen size={15} color="#6ee27e" />
            </a>
          ) : (
            <span className="p-1.5"><FolderOpen size={15} color="#E5E7EB" /></span>
          )}
          {/* Edit */}
          <button
            onClick={() => { setEditingCandidate(row.original); setShowModal(true) }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Düzenle">
            <Pencil size={15} color="#6B7280" />
          </button>

          {/* Sil */}
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            title="Sil">
            <Trash2 size={15} color="#EF4444" />
          </button>

        </div>
      ),
    },

  ], [lookups])

  const table = useReactTable({
    data: candidates,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
      sorting: [{ id: 'active', desc: true }]
    },

  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#4A4A4A' }}>Adaylar</h2>
          <p className="text-sm text-gray-500 mt-0.5">{candidates.length} aday kayıtlı</p>
        </div>
        <button
          onClick={() => { setEditingCandidate(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ background: '#E8673A' }}>
          <Plus size={16} /> Yeni Aday
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3" style={{ border: '1px solid #ede9e3' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="İsim veya telefon ara..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}
          />
        </div>
        <select
          value={nationalityFilter}
          onChange={e => {
            setNationalityFilter(e.target.value)
            table.getColumn('nationality')?.setFilterValue(e.target.value || undefined)
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
          <option value="">Tüm Uyruklar</option>
          {lookups.nationalities.map(n => <option key={n.id} value={n.name}>{n.name.split('/')[0].trim()}</option>)}
        </select>
        <select
          value={availabilityFilter}
          onChange={e => {
            setAvailabilityFilter(e.target.value)
            table.getColumn('availability')?.setFilterValue(e.target.value || undefined)
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
          <option value="">Tüm Durumlar</option>
          {lookups.availability.map(a => <option key={a.id} value={a.name}>{a.name.split('/')[0].trim()}</option>)}
        </select>
        <select
          value={legalFilter}
          onChange={e => {
            setLegalFilter(e.target.value)
            table.getColumn('legal_status')?.setFilterValue(e.target.value || undefined)
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
          <option value="">Tüm Yasal Durumlar</option>
          {lookups.legalStatus.map(l => <option key={l.id} value={l.name}>{l.name.split('/')[0].trim()}</option>)}
        </select>
        {(globalFilter || columnFilters.length > 0) && (
          <button onClick={() => {
            setGlobalFilter('')
            setColumnFilters([])
            setNationalityFilter('')
            setAvailabilityFilter('')
            setLegalFilter('')
          }}
            className="px-3 py-2 rounded-lg text-sm" style={{ color: '#E8673A' }}>
            Tümü
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ede9e3' }}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Yükleniyor...</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id} style={{ background: '#F7F6FB', borderBottom: '1px solid #ede9e3' }}>
                      {hg.headers.map(header => (
                        <th key={header.id} className="text-left px-4 py-3">
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide select-none ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                              style={{ color: '#9CA3AF' }}
                              onClick={header.column.getToggleSortingHandler()}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                header.column.getIsSorted() === 'asc' ? <ChevronUp size={12} /> :
                                  header.column.getIsSorted() === 'desc' ? <ChevronDown size={12} /> :
                                    <ChevronsUpDown size={12} />
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="p-12 text-center text-gray-400">
                        Aday bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}
                        style={{ borderBottom: '1px solid #f3f0eb' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fffaf8'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #ede9e3' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sayfa başı:</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded text-xs outline-none"
                    style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="text-xs text-gray-500">{table.getFilteredRowModel().rows.length} sonuç</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                  </span>
                  <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                    className="p-1 rounded disabled:opacity-30" style={{ color: '#4A4A4A' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                    className="p-1 rounded disabled:opacity-30" style={{ color: '#4A4A4A' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <CandidateModal
          candidate={editingCandidate}
          lookups={lookups}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchCandidates() }}
        />
      )}
    </div>
  )
}

function CandidateModal({ candidate, lookups, onClose, onSave }: {
  candidate: Candidate | null
  lookups: ReturnType<typeof useLookups>['lookups']
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    full_name: candidate?.full_name ?? '',
    phone: candidate?.phone ?? '',
    email: candidate?.email ?? '',
    nationality: candidate?.nationality ?? '',
    religion: candidate?.religion ?? '',
    languages: candidate?.languages ?? [],
    legal_status: candidate?.legal_status ?? '',
    availability: candidate?.availability ?? '',
    skills: candidate?.skills ?? [],
    work_type: candidate?.work_type ?? '',
    origin_city: candidate?.origin_city ?? '',
    current_country: candidate?.current_country ?? '',
    current_city: candidate?.current_city ?? '',
    expected_salary: candidate?.expected_salary ?? '',
    salary_currency: candidate?.salary_currency ?? 'USD',
    rank: candidate?.rank ?? 3,
    blacklist: candidate?.blacklist ?? false,
    can_swim: candidate?.can_swim ?? false,
    smokes: candidate?.smokes ?? false,
    drinks: candidate?.drinks ?? false,
    tattoo: candidate?.tattoo ?? false,
    pet_ok: candidate?.pet_ok ?? true,
    married: candidate?.married ?? false,
    num_children: candidate?.num_children ?? 0,
    available_from: candidate?.available_from ?? '',
    reason_for_leaving: candidate?.reason_for_leaving ?? '',
    reference_name: candidate?.reference_name ?? '',
    reference_contact: candidate?.reference_contact ?? '',
    documents_url: candidate?.documents_url ?? '',
    notes: candidate?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const toggleArray = (field: 'skills' | 'languages', value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v: string) => v !== value)
        : [...f[field], value]
    }))
  }

  const handleSave = async () => {
    if (!form.full_name) return alert('Ad Soyad zorunludur.')
    setSaving(true)
    const payload = {
      ...form,
      expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
      num_children: Number(form.num_children),
      available_from: form.available_from || null,
    }
    if (candidate) {
      const { error } = await supabase.from('candidates').update(payload).eq('id', candidate.id)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('candidates').insert(payload)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  const traits = [
    { field: 'can_swim', trueLabel: 'Yüzme Biliyor', falseLabel: 'Yüzme Bilmiyor', icon: Waves },
    { field: 'smokes', trueLabel: 'Sigara İçiyor', falseLabel: 'Sigara İçmiyor', icon: Cigarette },
    { field: 'drinks', trueLabel: 'Alkol Kullanıyor', falseLabel: 'Alkol Kullanmıyor', icon: Wine },
    { field: 'tattoo', trueLabel: 'Tattoo Var', falseLabel: 'Tattoo Yok', icon: Sparkles },
    { field: 'married', trueLabel: 'Evli', falseLabel: 'Bekar', icon: Star },
    { field: 'blacklist', trueLabel: 'Kara Liste', falseLabel: 'Kara Liste Değil', icon: AlertCircle },
    { field: 'pet_ok', trueLabel: 'Evcil Hayvan OK', falseLabel: 'Evcil Hayvan İSTEMİYOR', icon: PawPrint },
  ]



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}>

        {/* Sabit Header */}
        <div className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid #ede9e3' }}>
          <h3 className="font-bold text-lg" style={{ color: '#4A4A4A' }}>
            {candidate ? 'Adayı Düzenle' : 'Yeni Aday'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#9CA3AF" />
          </button>
        </div>

        {/* Scroll İçerik */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 space-y-5">
            {/* Temel Bilgiler */}
            <div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ad Soyad *</label>
                  <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Telefon</label>
                    <input value={form.phone} onChange={e => set('phone', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">E-posta</label>
                    <input value={form.email} onChange={e => set('email', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Konum & Kimlik */}
            <div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Uyruk</label>
                  <select value={form.nationality} onChange={e => set('nationality', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">Seçiniz</option>
                    {lookups.nationalities.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Memleket Şehri</label>
                  <input value={form.origin_city} onChange={e => set('origin_city', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Yasal Durum</label>
                  <select value={form.legal_status} onChange={e => set('legal_status', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">Seçiniz</option>
                    {lookups.legalStatus.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bulunduğu Ülke</label>
                  <select value={form.current_country} onChange={e => set('current_country', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">Seçiniz</option>
                    {lookups.countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bulunduğu Şehir</label>
                  <input value={form.current_city} onChange={e => set('current_city', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Din</label>
                  <select value={form.religion} onChange={e => set('religion', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">Seçiniz</option>
                    {lookups.religions.map(r => <option key={r.id} value={r.name}>{r.name.split('/')[0].trim()}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Çalışma Şekli</label>
                  <select value={form.work_type} onChange={e => set('work_type', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">Seçiniz</option>
                    {lookups.workTypes.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Durum</label>
                  <select value={form.availability} onChange={e => set('availability', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">Seçiniz</option>
                    {lookups.availability.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Çocuk Sayısı</label>
                  <input type="number" min={0} value={form.num_children}
                    onChange={e => set('num_children', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>

              </div>
            </div>

            {/* İş Bilgileri */}
            <div>
              <div className="space-y-3">

                {/* Hizmetler */}
                <div>
                  <label className="block text-xs font-medium tracking-wide mb-2" style={{ color: '#eb7a2e' }}>Hizmetler</label>
                  <div className="flex flex-wrap gap-2">
                    {lookups.services.map(s => {
                      const checked = form.skills.includes(s.name)
                      return (
                        <button key={s.id} type="button"
                          onClick={() => toggleArray('skills', s.name)}
                          className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                          style={{
                            background: checked ? '#E8673A' : '#F7F6FB',
                            color: checked ? '#fff' : '#4A4A4A',
                            border: `1px solid ${checked ? '#E8673A' : '#ede9e3'}`
                          }}>
                          {s.name.split('/')[0].trim()}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Diller */}
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: '#eb7a2e' }}>Bildiği Diller</label>
                  <div className="flex flex-wrap gap-2">
                    {lookups.languages.map(l => {
                      const checked = form.languages.includes(l.name)
                      return (
                        <button key={l.id} type="button"
                          onClick={() => toggleArray('languages', l.name)}
                          className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                          style={{
                            background: checked ? '#3B82F6' : '#F7F6FB',
                            color: checked ? '#fff' : '#4A4A4A',
                            border: `1px solid ${checked ? '#3B82F6' : '#ede9e3'}`
                          }}>
                          {l.name.split('/')[0].trim()}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <hr className="my-3" style={{ borderColor: '#ede9e3' }} />

                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Maaş Beklentisi</label>
                    <div className="flex gap-1">
                      <input type="number" value={form.expected_salary}
                        onChange={e => set('expected_salary', e.target.value)}
                        className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                      <select value={form.salary_currency} onChange={e => set('salary_currency', e.target.value)}
                        className="w-16 px-1 py-2 rounded-lg text-xs outline-none"
                        style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                        {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Uygunluk Tarihi</label>
                    <input type="date" value={form.available_from}
                      onChange={e => set('available_from', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Rank</label>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <button key={i} type="button" onClick={() => set('rank', i)}>
                          <Star size={20}
                            fill={i <= form.rank ? '#E8673A' : 'none'}
                            color={i <= form.rank ? '#E8673A' : '#D1D5DB'} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Kişisel */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Kişisel Bilgiler</p>



              {/* Özellikler */}
              <div className="grid grid-cols-3 gap-2">
                {traits.map(item => {
                  const Icon = item.icon
                  const checked = !!form[item.field as keyof typeof form]
                  const isBlacklist = item.field === 'blacklist'
                  const activeColor = isBlacklist ? '#fff' : '#E8673A'
                  const activeBg = isBlacklist ? '#333' : '#fdf1ec'
                  const activeBorder = isBlacklist ? '#1F2937' : '#E8673A'
                  return (
                    <button
                      key={item.field}
                      type="button"
                      onClick={() => set(item.field, !checked)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
                      style={{
                        background: checked ? activeBg : '#F7F6FB',
                        border: `1px solid ${checked ? activeBorder : '#ede9e3'}`
                      }}>
                      <Icon size={14} color={checked ? activeColor : '#9CA3AF'} />
                      <span className="text-xs" style={{ color: checked ? activeColor : '#6B7280' }}>
                        {checked ? item.trueLabel : item.falseLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Referans */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Referans</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Referans Adı</label>
                  <input value={form.reference_name} onChange={e => set('reference_name', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Referans İletişim</label>
                  <input value={form.reference_contact} onChange={e => set('reference_contact', e.target.value)}
                    placeholder="Telefon veya email"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
              </div>
            </div>

            {/* Linkler */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Linkler</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    <div className="flex items-center gap-1.5">
                      <FolderOpen size={12} />
                      Belgeler (Drive / Video / Dropbox Link)
                    </div>
                  </label>
                  <input value={form.documents_url} onChange={e => set('documents_url', e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
              </div>
            </div>

            {/* Ayrılma Sebebi + Notlar */}
            <div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ayrılma Sebebi</label>
                  <textarea value={form.reason_for_leaving}
                    onChange={e => set('reason_for_leaving', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notlar</label>
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sabit Footer */}
        <div className="flex gap-3 p-6 flex-shrink-0"
          style={{ borderTop: '1px solid #ede9e3' }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#F7F6FB', color: '#4A4A4A', border: '1px solid #ede9e3' }}>
            İptal
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
            style={{ background: '#E8673A' }}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

      </div>
    </div>
  )


}