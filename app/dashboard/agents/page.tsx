'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLookups } from '@/lib/useLookups'
import { useLang } from '@/lib/LangContext'
import { showName, getLabels } from '@/lib/i18n'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Pencil, Trash2, Info, X, Star
} from 'lucide-react'

type Agent = {
  id: number
  full_name: string
  phone: string
  email: string
  nationality: string
  country: string
  city: string
  default_rate: number
  active: boolean
  notes: string
  created_at: string
}

export default function AgentsPage() {
  const supabase = createClient()
  const { lookups } = useLookups()
  const { lang } = useLang()
  const labels = getLabels(lang)
  const L = { ...labels, ...labels.agents }

  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)

  useEffect(() => { fetchAgents() }, [])

  const fetchAgents = async () => {
    setLoading(true)
    const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false })
    if (data) setAgents(data)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(L.deleteConfirm)) return
    await supabase.from('agents').delete().eq('id', id)
    fetchAgents()
  }

  const columns = useMemo<ColumnDef<Agent>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>#{getValue() as number}</span>
      ),
    },
    {
      accessorKey: 'full_name',
      header: L.fullName,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium" style={{ color: '#4A4A4A' }}>{row.original.full_name}</p>
          {row.original.phone && <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.phone}</p>}
          {row.original.email && <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.email}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'nationality',
      header: L.nationality,
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>
          {showName(row.original.nationality, lookups.nationalities, lang) || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'country',
      header: L.countryCity,
      cell: ({ row }) => (
        <div>
          <p className="text-sm" style={{ color: '#4A4A4A' }}>
            {showName(row.original.country, lookups.countries, lang) || '-'}
          </p>
          {row.original.city && <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.city}</p>}
        </div>
      ),
    },
    {
      accessorKey: 'default_rate',
      header: L.rate,
      cell: ({ getValue }) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ background: '#fdf1ec', color: '#E8673A' }}>
          %{Number(getValue() ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: 'active',
      header: L.status,
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getValue() ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>
          {getValue() ? L.active : L.passive}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: L.addedAt,
      cell: ({ getValue }) => (
        <div>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            {getValue() ? new Date(String(getValue())).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR') : '-'}
          </p>
          <p className="text-xs" style={{ color: '#C4C4C4' }}>
            {getValue() ? new Date(String(getValue())).toLocaleTimeString(lang === 'en' ? 'en-GB' : 'tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end items-center">
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
            onClick={() => { setEditingAgent(row.original); setShowModal(true) }}
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
  ], [lookups, lang])

  const table = useReactTable({
    data: agents,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
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
          <h2 className="text-xl font-bold" style={{ color: '#4A4A4A' }}>{L.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{agents.length} {L.recordCount}</p>
        </div>
        <button
          onClick={() => { setEditingAgent(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ background: '#E8673A' }}>
          <Plus size={16} /> {L.newAgent}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4" style={{ border: '1px solid #ede9e3' }}>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={L.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #ede9e3' }}>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-400">{L.loading}</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id} style={{ background: '#d9d3f1', borderBottom: '1px solid #ede9e3' }}>
                      {hg.headers.map(header => (
                        <th key={header.id} className="text-left px-4 py-3">
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center gap-1 text-xs font-semibold tracking-wide select-none ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                              style={{ color: '#373c44' }}
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
                        {L.noResults}
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
                  <span className="text-xs text-gray-500">{L.pageSize}:</span>
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => table.setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded text-xs outline-none"
                    style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    {[10, 25, 50].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span className="text-xs text-gray-500">{table.getFilteredRowModel().rows.length} {L.results}</span>
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
        <AgentModal
          agent={editingAgent}
          lookups={lookups}
          lang={lang}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAgents() }}
        />
      )}
    </div>
  )
}

function AgentModal({ agent, lookups, lang, onClose, onSave }: {
  agent: Agent | null
  lookups: ReturnType<typeof useLookups>['lookups']
  lang: string
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const labels = getLabels(lang)
  const L = { ...labels, ...labels.agents }

  const [form, setForm] = useState({
    full_name: agent?.full_name ?? '',
    phone: agent?.phone ?? '',
    email: agent?.email ?? '',
    nationality: agent?.nationality ?? '',
    country: agent?.country ?? '',
    city: agent?.city ?? '',
    default_rate: agent?.default_rate ?? 10,
    active: agent?.active ?? true,
    notes: agent?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    if (!form.full_name) return alert(L.nameRequired)
    setSaving(true)
    if (agent) {
      const { error } = await supabase.from('agents').update(form).eq('id', agent.id)
      if (error) { alert(L.errorPrefix + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('agents').insert(form)
      if (error) { alert(L.errorPrefix + error.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
        style={{ maxHeight: '90vh' }}>

        <div className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid #ede9e3' }}>
          <h3 className="font-bold text-lg" style={{ color: '#4A4A4A' }}>
            {agent ? L.editAgent : L.newAgent}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#9CA3AF" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{L.fullName} *</label>
            <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.phone}</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.email}</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.nationality}</label>
              <select value={form.nationality} onChange={e => set('nationality', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {lookups.nationalities.map(n => (
                  <option key={n.id} value={n.name}>
                    {showName(n.name, lookups.nationalities, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.country}</label>
              <select value={form.country} onChange={e => set('country', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {lookups.countries.map(c => (
                  <option key={c.id} value={c.name}>
                    {showName(c.name, lookups.countries, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.city}</label>
              <input value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.defaultRate}</label>
              <input type="number" min={0} max={100} value={form.default_rate}
                onChange={e => set('default_rate', Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-colors"
                style={{
                  background: form.active ? '#f0fdf4' : '#F7F6FB',
                  border: `1px solid ${form.active ? '#10B981' : '#ede9e3'}`
                }}>
                <input type="checkbox" className="hidden"
                  checked={form.active}
                  onChange={e => set('active', e.target.checked)} />
                <Star size={14} color={form.active ? '#10B981' : '#9CA3AF'} />
                <span className="text-xs" style={{ color: form.active ? '#10B981' : '#4A4A4A' }}>
                  {form.active ? L.active : L.passive}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{L.notes}</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
          </div>
        </div>

        <div className="flex gap-3 p-6 flex-shrink-0" style={{ borderTop: '1px solid #ede9e3' }}>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#F7F6FB', color: '#4A4A4A', border: '1px solid #ede9e3' }}>
            {L.cancel}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
            style={{ background: '#E8673A' }}>
            {saving ? L.saving : L.save}
          </button>
        </div>
      </div>
    </div>
  )
}