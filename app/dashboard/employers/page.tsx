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
  Star, PawPrint, Info
} from 'lucide-react'
import { X } from 'lucide-react'

type Employer = {
  id: number
  full_name: string
  phone: string
  email: string
  country: string
  city: string
  district: string
  num_kids: number
  kids_ages: string
  source: string
  blacklist: boolean
  rank: number
  notes: string
  created_at: string
}

export default function EmployersPage() {
  const supabase = createClient()
  const { lookups } = useLookups()
  const [employers, setEmployers] = useState<Employer[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null)
  const [cityFilter, setCityFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  useEffect(() => { fetchEmployers() }, [])

  const fetchEmployers = async () => {
    setLoading(true)
    const { data } = await supabase.from('employers').select('*').order('created_at', { ascending: false })
    if (data) setEmployers(data)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu işvereni silmek istediğinizden emin misiniz?')) return
    await supabase.from('employers').delete().eq('id', id)
    fetchEmployers()
  }

  const columns = useMemo<ColumnDef<Employer>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>
          #{getValue() as number}
        </span>
      ),
    },
    {
      accessorKey: 'full_name',
      header: 'Ad Soyad / Firma',
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
      accessorKey: 'country',
      header: 'Ülke',
      cell: ({ getValue }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>
          {String(getValue() ?? '').split('/')[0].trim() || '-'}
        </span>
      ),
      filterFn: 'equals',
    },
    {
      accessorKey: 'city',
      header: 'Şehir',
      cell: ({ row }) => (
        <div>
          <p className="text-sm" style={{ color: '#4A4A4A' }}>{row.original.city ?? '-'}</p>
          {row.original.district && <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.district}</p>}
        </div>
      ),
      filterFn: 'equals',
    },
    {
      accessorKey: 'num_kids',
      header: 'Çocuk',
      cell: ({ row }) => (
        <div>
          <p className="text-sm" style={{ color: '#4A4A4A' }}>{row.original.num_kids ?? 0}</p>
          {row.original.kids_ages && <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.kids_ages}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Kaynak',
      cell: ({ getValue }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>
          {String(getValue() ?? '').split('/')[0].trim() || '-'}
        </span>
      ),
      filterFn: 'equals',
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
            <span className="p-1.5"><Info size={15} color="#E5E7EB" /></span>
          )}
          <button
            onClick={() => { setEditingEmployer(row.original); setShowModal(true) }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Pencil size={15} color="#6B7280" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 size={15} color="#EF4444" />
          </button>
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data: employers,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#4A4A4A' }}>İşverenler</h2>
          <p className="text-sm text-gray-500 mt-0.5">{employers.length} işveren kayıtlı</p>
        </div>
        <button
          onClick={() => { setEditingEmployer(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ background: '#E8673A' }}>
          <Plus size={16} /> Yeni İşveren
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3" style={{ border: '1px solid #ede9e3' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="İsim, telefon veya email ara..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}
          />
        </div>
        <select
          value={cityFilter}
          onChange={e => {
            setCityFilter(e.target.value)
            table.getColumn('city')?.setFilterValue(e.target.value || undefined)
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
          <option value="">Tüm Şehirler</option>
          {lookups.cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select
          value={sourceFilter}
          onChange={e => {
            setSourceFilter(e.target.value)
            table.getColumn('source')?.setFilterValue(e.target.value || undefined)
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
          <option value="">Tüm Kaynaklar</option>
          {lookups.sources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        {(globalFilter || columnFilters.length > 0) && (
          <button onClick={() => { setGlobalFilter(''); setColumnFilters([]) }}
            className="px-3 py-2 rounded-lg text-sm" style={{ color: '#E8673A' }}>
            Tünü
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ede9e3' }}>
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
                      İşveren bulunamadı.
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

      {showModal && (
        <EmployerModal
          employer={editingEmployer}
          lookups={lookups}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchEmployers() }}
        />
      )}
    </div>
  )
}

function EmployerModal({ employer, lookups, onClose, onSave }: {
  employer: Employer | null
  lookups: ReturnType<typeof useLookups>['lookups']
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    full_name: employer?.full_name ?? '',
    phone: employer?.phone ?? '',
    email: employer?.email ?? '',
    country: employer?.country ?? 'Türkiye / Turkey',
    city: employer?.city ?? '',
    district: employer?.district ?? '',
    num_kids: employer?.num_kids ?? 1,
    kids_ages: employer?.kids_ages ?? '',
    source: employer?.source ?? '',
    blacklist: employer?.blacklist ?? false,
    rank: employer?.rank ?? 3,
    notes: employer?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    if (!form.full_name) return alert('Ad Soyad zorunludur.')
    setSaving(true)
    if (employer) {
      const { error } = await supabase.from('employers').update(form).eq('id', employer.id)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('employers').insert(form)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #ede9e3' }}>
          <h3 className="font-bold text-lg" style={{ color: '#4A4A4A' }}>
            {employer ? 'İşvereni Düzenle' : 'Yeni İşveren'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#9CA3AF" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Ad Soyad */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ad Soyad / Firma *</label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
          </div>

          {/* Telefon + Email */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Ülke + Şehir */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Ülke</label>
              <select value={form.country} onChange={e => set('country', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                {lookups.countries.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Şehir</label>
              <select value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">Seçiniz</option>
                {lookups.cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* İlçe + Kaynak */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">İlçe</label>
              <input value={form.district} onChange={e => set('district', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kaynak</label>
              <select value={form.source} onChange={e => set('source', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">Seçiniz</option>
                {lookups.sources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Çocuk Sayısı + Çocuk Yaşları + Rank */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Çocuk Sayısı</label>
              <input type="number" min={0} value={form.num_kids}
                onChange={e => set('num_kids', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Çocuk Yaşları</label>
              <input value={form.kids_ages} onChange={e => set('kids_ages', e.target.value)}
                placeholder="2, 5"
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

          {/* Özellikler */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Özellikler</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { field: 'blacklist', trueLabel: 'Kara Liste', falseLabel: 'Kara Liste Değil' },
              ].map(item => {
                const checked = !!form[item.field as keyof typeof form]
                const isBlacklist = item.field === 'blacklist'
                return (
                  <button key={item.field} type="button"
                    onClick={() => set(item.field, !checked)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left"
                    style={{
                      background: checked ? (isBlacklist ? '#1F2937' : '#fdf1ec') : '#F7F6FB',
                      border: `1px solid ${checked ? (isBlacklist ? '#1F2937' : '#E8673A') : '#ede9e3'}`
                    }}>
                    <span className="text-xs" style={{ color: checked ? (isBlacklist ? '#fff' : '#E8673A') : '#6B7280' }}>
                      {checked ? item.trueLabel : item.falseLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notlar */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notlar</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
          </div>
        </div>

        <div className="flex gap-3 p-6" style={{ borderTop: '1px solid #ede9e3' }}>
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