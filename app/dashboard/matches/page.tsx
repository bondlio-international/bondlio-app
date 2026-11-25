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
  type ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, Pencil, Trash2, Info, X,
  CheckCircle, Circle
} from 'lucide-react'

type Match = {
  id: number
  candidate_id: number
  employer_id: number
  status: string
  outcome: string
  start_date: string
  end_date: string
  work_type: string
  service_type: string
  salary: number
  salary_currency: string
  bondlio_fee: number
  fee_currency: string
  employer_agent_id: number
  employer_agent_rate: number
  employer_agent_paid: boolean
  candidate_agent_id: number
  candidate_agent_rate: number
  candidate_agent_paid: boolean
  followup_week1: boolean
  followup_month1: boolean
  followup_month3: boolean
  replacement_requested: boolean
  departure_reason: string
  notes: string
  created_at: string
  candidates?: { full_name: string }
  employers?: { full_name: string }
  employer_agent?: { full_name: string }
  candidate_agent?: { full_name: string }
  is_active: boolean
}

export default function MatchesPage() {
  const supabase = createClient()
  const { lookups } = useLookups()
  const { lang } = useLang()
  const labels = getLabels(lang)
  const L = { ...labels, ...labels.matches }

  const [matches, setMatches] = useState<Match[]>([])
  const [employers, setEmployers] = useState<{ id: number; full_name: string }[]>([])
  const [candidates, setCandidates] = useState<{ id: number; full_name: string }[]>([])
  const [agents, setAgents] = useState<{ id: number; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: mat }, { data: emp }, { data: can }, { data: agt }] = await Promise.all([
      supabase.from('matches').select(`
        *,
        candidates(full_name),
        employers(full_name),
        employer_agent:agents!matches_employer_agent_id_fkey(full_name),
        candidate_agent:agents!matches_candidate_agent_id_fkey(full_name)
      `).order('created_at', { ascending: false }),
      supabase.from('employers').select('id, full_name').order('full_name'),
      supabase.from('candidates').select('id, full_name').order('full_name'),
      supabase.from('agents').select('id, full_name').order('full_name'),
    ])
    if (mat) setMatches(mat)
    if (emp) setEmployers(emp)
    if (can) setCandidates(can)
    if (agt) setAgents(agt)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(L.deleteConfirm)) return
    await supabase.from('matches').delete().eq('id', id)
    fetchAll()
  }

  const columns = useMemo<ColumnDef<Match>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>#{getValue() as number}</span>
      ),
    },
    {
      id: 'people',
      header: L.employerCandidate,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium" style={{ color: '#4A4A4A' }}>
            {row.original.employers?.full_name ?? '-'}
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            {row.original.candidates?.full_name ?? '-'}
          </p>
        </div>
      ),
    },
    {
      id: 'status',
      accessorFn: row => row.status ?? '',
      header: L.status,
      filterFn: 'equals',
      cell: ({ row }) => {
        const val = row.original.status ?? ''
        const found = lookups.matchStatus.find(s => s.name === val)
        const color = found?.color ?? '#6B7280'
        const label = lang === 'en' ? (found?.name_en || val) : val
        return val ? (
          <span className="px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ background: color }}>{label}</span>
        ) : <span className="text-gray-400">-</span>
      },
    },
    {
      accessorKey: 'start_date',
      header: L.startDate,
      cell: ({ getValue }) => (
        <span className="text-xs" style={{ color: '#9CA3AF' }}>
          {getValue() ? new Date(String(getValue())).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR') : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'salary',
      header: L.salary,
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>
          {row.original.salary ? `${Number(row.original.salary).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR')} ${row.original.salary_currency}` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'bondlio_fee',
      header: L.commission,
      cell: ({ row }) => (
        <span className="text-sm font-medium" style={{ color: '#E8673A' }}>
          {row.original.bondlio_fee ? `${Number(row.original.bondlio_fee).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR')} ${row.original.fee_currency}` : '—'}
        </span>
      ),
    },
    {
      id: 'agent_info',
      header: L.agent,
      cell: ({ row }) => {
        const empAgent = row.original.employer_agent?.full_name
        const canAgent = row.original.candidate_agent?.full_name
        if (!empAgent && !canAgent) return <span style={{ color: '#E5E7EB' }}>—</span>
        return (
          <div>
            {empAgent && (
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{ color: '#4A4A4A' }}>{L.empShort} - {empAgent}</span>
                {row.original.employer_agent_paid
                  ? <CheckCircle size={11} color="#10B981" />
                  : <Circle size={11} color="#E5E7EB" />}
              </div>
            )}
            {canAgent && canAgent !== empAgent && (
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{ color: '#9CA3AF' }}>{L.canShort} - {canAgent}</span>
                {row.original.candidate_agent_paid
                  ? <CheckCircle size={11} color="#10B981" />
                  : <Circle size={11} color="#E5E7EB" />}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'followups',
      header: L.followup,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <span className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: row.original.followup_week1 ? '#dcfce7' : '#F7F6FB', color: row.original.followup_week1 ? '#16a34a' : '#9CA3AF' }}>
            {L.week1Short}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: row.original.followup_month1 ? '#dcfce7' : '#F7F6FB', color: row.original.followup_month1 ? '#16a34a' : '#9CA3AF' }}>
            {L.month1Short}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: row.original.followup_month3 ? '#dcfce7' : '#F7F6FB', color: row.original.followup_month3 ? '#16a34a' : '#9CA3AF' }}>
            {L.month3Short}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end items-center">
          <div className="w-2.5 h-2.5 rounded-full mr-1"
            style={{ background: row.original.is_active ? '#10B981' : '#D1D5DB' }}
            title={row.original.is_active ? L.active : L.passive}
          />
          {row.original.replacement_requested && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full"
              style={{ background: '#7F1D1D' }}>
              <span className="text-white font-black text-xs">!</span>
            </span>
          )}
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
            onClick={() => { setEditingMatch(row.original); setShowModal(true) }}
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
    data: matches,
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
          <h2 className="text-xl font-bold" style={{ color: '#4A4A4A' }}>{L.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{matches.length} {L.recordCount}</p>
        </div>
        <button
          onClick={() => { setEditingMatch(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ background: '#E8673A' }}>
          <Plus size={16} /> {L.newMatch}
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3" style={{ border: '1px solid #ede9e3' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={L.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value)
            table.getColumn('status')?.setFilterValue(e.target.value || undefined)
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
          <option value="">{L.allStatuses}</option>
          {lookups.matchStatus.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        {(globalFilter || columnFilters.length > 0) && (
          <button onClick={() => { setGlobalFilter(''); setColumnFilters([]); setStatusFilter('') }}
            className="px-3 py-2 rounded-lg text-sm" style={{ color: '#E8673A' }}>
            {L.clear}
          </button>
        )}
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
                    <tr key={hg.id} style={{ background: '#bce5f0', borderBottom: '1px solid #ede9e3' }}>
                      {hg.headers.map(header => (
                        <th key={header.id} className="text-left px-4 py-3">
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center gap-1 text-xs font-semibold tracking-wide select-none ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                              style={{ color: '#272727' }}
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
                  <span className="text-xs text-gray-500">{L.perPage}:</span>
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
        <MatchModal
          match={editingMatch}
          employers={employers}
          candidates={candidates}
          agents={agents}
          lookups={lookups}
          lang={lang}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAll() }}
        />
      )}
    </div>
  )
}

function MatchModal({ match, employers, candidates, agents, lookups, lang, onClose, onSave }: {
  match: Match | null
  employers: { id: number; full_name: string }[]
  candidates: { id: number; full_name: string }[]
  agents: { id: number; full_name: string }[]
  lookups: ReturnType<typeof useLookups>['lookups']
  lang: string
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const labels = getLabels(lang)
  const L = { ...labels, ...labels.matches }

  const [form, setForm] = useState({
    employer_id: match?.employer_id ?? '',
    candidate_id: match?.candidate_id ?? '',
    status: match?.status ?? 'Devam Ediyor',
    start_date: match?.start_date ?? '',
    end_date: match?.end_date ?? '',
    work_type: match?.work_type ?? '',
    service_type: match?.service_type ?? '',
    salary: match?.salary ?? '',
    salary_currency: match?.salary_currency ?? 'USD',
    bondlio_fee: match?.bondlio_fee ?? '',
    fee_currency: match?.fee_currency ?? 'USD',
    employer_agent_id: match?.employer_agent_id ?? '',
    employer_agent_rate: match?.employer_agent_rate ?? '',
    employer_agent_paid: match?.employer_agent_paid ?? false,
    candidate_agent_id: match?.candidate_agent_id ?? '',
    candidate_agent_rate: match?.candidate_agent_rate ?? '',
    candidate_agent_paid: match?.candidate_agent_paid ?? false,
    followup_week1: match?.followup_week1 ?? false,
    followup_month1: match?.followup_month1 ?? false,
    followup_month3: match?.followup_month3 ?? false,
    replacement_requested: match?.replacement_requested ?? false,
    departure_reason: match?.departure_reason ?? '',
    notes: match?.notes ?? '',
    is_active: match?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const fee = Number(form.bondlio_fee) || 0
  const empRate = Number(form.employer_agent_rate) || 0
  const canRate = Number(form.candidate_agent_rate) || 0
  const empShare = fee > 0 ? Math.round(fee * empRate / 100 * 100) / 100 : 0
  const canShare = fee > 0 ? Math.round(fee * canRate / 100 * 100) / 100 : 0
  const totalAgentShare = empShare + canShare
  const bondlioNet = fee - totalAgentShare

  const handleSave = async () => {
    if (!form.employer_id || !form.candidate_id) return alert(L.bothRequired)
    setSaving(true)
    const payload = {
      ...form,
      employer_id: Number(form.employer_id),
      candidate_id: Number(form.candidate_id),
      employer_agent_id: form.employer_agent_id ? Number(form.employer_agent_id) : null,
      candidate_agent_id: form.candidate_agent_id ? Number(form.candidate_agent_id) : null,
      salary: form.salary ? Number(form.salary) : null,
      bondlio_fee: form.bondlio_fee ? Number(form.bondlio_fee) : null,
      employer_agent_rate: form.employer_agent_rate ? Number(form.employer_agent_rate) : null,
      candidate_agent_rate: form.candidate_agent_rate ? Number(form.candidate_agent_rate) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }
    if (match) {
      const { error } = await supabase.from('matches').update(payload).eq('id', match.id)
      if (error) { alert(L.errorPrefix + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('matches').insert(payload)
      if (error) { alert(L.errorPrefix + error.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}>

        <div className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid #ede9e3' }}>
          <h3 className="font-bold text-lg" style={{ color: '#4A4A4A' }}>
            {match ? L.editMatch : L.newMatch}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#9CA3AF" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.employer} *</label>
              <select value={form.employer_id} onChange={e => set('employer_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {employers.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.candidate} *</label>
              <select value={form.candidate_id} onChange={e => set('candidate_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.status}</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                {lookups.matchStatus.map(s => (
                  <option key={s.id} value={s.name}>
                    {lang === 'en' ? (s.name_en || s.name) : s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.serviceType}</label>
              <select value={form.service_type} onChange={e => set('service_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {lookups.services.map(s => (
                  <option key={s.id} value={s.name}>{showName(s.name, lookups.services, lang).split('/')[0].trim()}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.workType}</label>
              <select value={form.work_type} onChange={e => set('work_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {lookups.workTypes.map(w => (
                  <option key={w.id} value={w.name}>{showName(w.name, lookups.workTypes, lang)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.startDate}</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.statusLabel}</label>
              <button type="button"
                onClick={() => set('is_active', !form.is_active)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full"
                style={{
                  background: form.is_active ? '#f0fdf4' : '#F7F6FB',
                  border: `1px solid ${form.is_active ? '#10B981' : '#ede9e3'}`
                }}>
                <div className="w-2 h-2 rounded-full" style={{ background: form.is_active ? '#10B981' : '#9CA3AF' }} />
                <span className="text-xs" style={{ color: form.is_active ? '#10B981' : '#6B7280' }}>
                  {form.is_active ? L.active : L.passive}
                </span>
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>{L.financials}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{L.salary}</label>
                <div className="flex gap-2">
                  <input type="number" value={form.salary} onChange={e => set('salary', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                  <select value={form.salary_currency} onChange={e => set('salary_currency', e.target.value)}
                    className="w-24 px-2 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{L.bondlioFee}</label>
                <div className="flex gap-2">
                  <input type="number" value={form.bondlio_fee} onChange={e => set('bondlio_fee', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                  <select value={form.fee_currency} onChange={e => set('fee_currency', e.target.value)}
                    className="w-24 px-2 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>{L.agentCommissions}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{L.employerAgent}</label>
                  <select value={form.employer_agent_id} onChange={e => set('employer_agent_id', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">{L.none}</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{L.rate}</label>
                  <input type="number" value={form.employer_agent_rate}
                    onChange={e => set('employer_agent_rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
                <button type="button"
                  onClick={() => set('employer_agent_paid', !form.employer_agent_paid)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full"
                  style={{
                    background: form.employer_agent_paid ? '#f0fdf4' : '#F7F6FB',
                    border: `1px solid ${form.employer_agent_paid ? '#10B981' : '#ede9e3'}`
                  }}>
                  {form.employer_agent_paid
                    ? <CheckCircle size={14} color="#10B981" />
                    : <Circle size={14} color="#9CA3AF" />}
                  <span className="text-xs" style={{ color: form.employer_agent_paid ? '#10B981' : '#6B7280' }}>
                    {form.employer_agent_paid ? L.paid : L.unpaid}
                  </span>
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{L.candidateAgent}</label>
                  <select value={form.candidate_agent_id} onChange={e => set('candidate_agent_id', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">{L.none}</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{L.rate}</label>
                  <input type="number" value={form.candidate_agent_rate}
                    onChange={e => set('candidate_agent_rate', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
                <button type="button"
                  onClick={() => set('candidate_agent_paid', !form.candidate_agent_paid)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full"
                  style={{
                    background: form.candidate_agent_paid ? '#f0fdf4' : '#F7F6FB',
                    border: `1px solid ${form.candidate_agent_paid ? '#10B981' : '#ede9e3'}`
                  }}>
                  {form.candidate_agent_paid
                    ? <CheckCircle size={14} color="#10B981" />
                    : <Circle size={14} color="#9CA3AF" />}
                  <span className="text-xs" style={{ color: form.candidate_agent_paid ? '#10B981' : '#6B7280' }}>
                    {form.candidate_agent_paid ? L.paid : L.unpaid}
                  </span>
                </button>
              </div>
            </div>

            {fee > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-3 p-3 rounded-xl"
                style={{ background: '#F7F6FB', border: '1px solid #ede9e3' }}>
                <div className="text-center">
                  <p className="text-xs text-gray-400">{L.totalFee}</p>
                  <p className="text-sm font-bold" style={{ color: '#4A4A4A' }}>{fee} {form.fee_currency}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">{L.employerAgentShare}</p>
                  <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>{empShare} {form.fee_currency}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">{L.candidateAgentShare}</p>
                  <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>{canShare} {form.fee_currency}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">{L.bondlioNet}</p>
                  <p className="text-sm font-bold" style={{ color: '#10B981' }}>{bondlioNet} {form.fee_currency}</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>{L.followup}</p>
            <div className="flex gap-2">
              {[
                { field: 'followup_week1', label: L.week1Call },
                { field: 'followup_month1', label: L.month1Call },
                { field: 'followup_month3', label: L.month3Call },
              ].map(item => {
                const checked = !!form[item.field as keyof typeof form]
                return (
                  <button key={item.field} type="button"
                    onClick={() => set(item.field, !checked)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: checked ? '#f0fdf4' : '#F7F6FB',
                      border: `1px solid ${checked ? '#10B981' : '#ede9e3'}`
                    }}>
                    {checked
                      ? <CheckCircle size={14} color="#10B981" />
                      : <Circle size={14} color="#9CA3AF" />}
                    <span className="text-xs" style={{ color: checked ? '#10B981' : '#6B7280' }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{L.notes}</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
          </div>

          <div className="rounded-xl p-4 space-y-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#EF4444' }}>{L.departure}</p>

            <button type="button"
              onClick={() => set('replacement_requested', !form.replacement_requested)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
              style={{
                background: form.replacement_requested ? '#fee2e2' : '#fff',
                border: `1px solid ${form.replacement_requested ? '#EF4444' : '#FECACA'}`
              }}>
              <span className="text-xs" style={{ color: form.replacement_requested ? '#EF4444' : '#9CA3AF' }}>
                {form.replacement_requested ? `⚠️ ${L.replacementRequested}` : L.noReplacement}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#EF4444' }}>{L.departureReason}</label>
                <select value={form.departure_reason} onChange={e => set('departure_reason', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-white"
                  style={{ border: '1px solid #FECACA', color: '#4A4A4A' }}>
                  <option value="">{L.select}</option>
                  {lookups.departureReasons.map(r => (
                    <option key={r.id} value={r.name}>{showName(r.name, lookups.departureReasons, lang).split('/')[0].trim()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#EF4444' }}>{L.endDate}</label>
                <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none bg-white"
                  style={{ border: '1px solid #FECACA', color: '#4A4A4A' }} />
              </div>
            </div>
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