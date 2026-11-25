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
  Plus, Search, ChevronUp, ChevronDown, ChevronsUpDown, DoorOpen, ClipboardList,
  ChevronLeft, ChevronRight, Pencil, Trash2, Info, X, Bell, Cigarette, Wine, PawPrint
} from 'lucide-react'

type Request = {
  id: number
  employer_id: number
  agent_id: number
  stage: string
  service: string
  city: string
  work_type: string
  salary_currency: string
  max_salary: number
  legal_required: boolean
  desired_nationality: string[]
  language_pref: string[]
  religion_pref: string
  min_age: number
  max_age: number
  smoking_ok: boolean
  drinking_ok: boolean
  has_pet: boolean
  num_kids: number
  kids_ages: string
  desired_start: string
  suggested_candidate_1: number
  suggested_candidate_2: number
  suggested_candidate_3: number
  followup_1: string
  followup_2: string
  followup_3: string
  farewell_date: string
  alert_date: string
  notes: string
  created_at: string
  employers?: { full_name: string }
  agents?: { full_name: string }
  is_active: boolean
  private_room: boolean
  responsibilities: string[]
}

export default function RequestsPage() {
  const supabase = createClient()
  const { lookups } = useLookups()
  const { lang } = useLang()
  const labels = getLabels(lang)
  const L = { ...labels, ...labels.requests }

  const [requests, setRequests] = useState<Request[]>([])
  const [employers, setEmployers] = useState<{ id: number; full_name: string }[]>([])
  const [agents, setAgents] = useState<{ id: number; full_name: string }[]>([])
  const [candidates, setCandidates] = useState<{ id: number; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: req }, { data: emp }, { data: agt }, { data: can }] = await Promise.all([
      supabase.from('requests').select('*, employers(full_name), agents(full_name)').order('created_at', { ascending: false }),
      supabase.from('employers').select('id, full_name').order('full_name'),
      supabase.from('agents').select('id, full_name').order('full_name'),
      supabase.from('candidates').select('id, full_name').order('full_name'),
    ])
    if (req) setRequests(req)
    if (emp) setEmployers(emp)
    if (agt) setAgents(agt)
    if (can) setCandidates(can)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm(L.deleteConfirm)) return
    await supabase.from('requests').delete().eq('id', id)
    fetchAll()
  }

  const columns = useMemo<ColumnDef<Request>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>#{getValue() as number}</span>
      ),
    },
    {
      accessorFn: row => row.employers?.full_name ?? '',
      id: 'employer',
      header: L.employer,
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium" style={{ color: '#4A4A4A' }}>
            {row.original.employers?.full_name ?? '-'}
          </p>
          {row.original.agents?.full_name && (
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.agents.full_name}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'service',
      header: L.service,
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>
          {showName(row.original.service, lookups.services, lang) || '-'}
        </span>
      ),
    },
    {
      id: 'stage',
      accessorFn: row => row.stage ?? '',
      header: L.stage,
      filterFn: 'equals',
      cell: ({ row }) => {
        const val = row.original.stage ?? ''
        const found = lookups.requestStages.find(s => s.name === val)
        const color = found?.color ?? '#6B7280'
        const label = lang === 'en' ? (found?.name_en || val) : val
        return val ? (
          <span className="px-1 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ background: color }}>{label}</span>
        ) : <span className="text-gray-400">-</span>
      },
    },
    {
      accessorKey: 'city',
      header: L.city,
      cell: ({ getValue }) => {
        const val = String(getValue() ?? '')
        const found = lookups.cities?.find(c => c.name === val)
        const label = lang === 'en' ? (found?.name_en || val) : val
        return <span className="text-sm" style={{ color: '#4A4A4A' }}>{label || '-'}</span>
      },
    },
    {
      accessorKey: 'max_salary',
      header: L.maxSalary,
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>
          {row.original.max_salary ? `${Number(row.original.max_salary).toLocaleString(lang === 'en' ? 'en-GB' : 'tr-TR')} ${row.original.salary_currency}` : '—'}
        </span>
      ),
    },
    {
      id: 'criteria',
      header: L.criteria,
      cell: ({ row }) => (
        <div>
          {row.original.desired_nationality?.length > 0 && (
            <p className="text-xs" style={{ color: '#4A4A4A' }}>
              {row.original.desired_nationality.map((n: string) =>
                showName(n, lookups.nationalities, lang)
              ).join(', ')}
            </p>
          )}
          {row.original.language_pref?.length > 0 && (
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              {row.original.language_pref.map((l: string) =>
                showName(l, lookups.languages, lang)
              ).join(', ')}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'kids',
      header: L.person,
      cell: ({ row }) => (
        <div>
          {row.original.num_kids ? (
            <p className="text-sm" style={{ color: '#4A4A4A' }}>{row.original.num_kids}</p>
          ) : <span style={{ color: '#E5E7EB' }}>—</span>}
          {row.original.kids_ages && (
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{row.original.kids_ages}</p>
          )}
        </div>
      ),
    },
    {
      id: 'suggested',
      header: L.suggested,
      cell: ({ row }) => {
        const suggested = [
          row.original.suggested_candidate_1,
          row.original.suggested_candidate_2,
          row.original.suggested_candidate_3,
        ].filter(Boolean)
        if (!suggested.length) return <span style={{ color: '#E5E7EB' }}>—</span>
        return (
          <div>
            {suggested.map((id, i) => {
              const candidate = candidates.find(c => c.id === id)
              return (
                <p key={i} className="text-xs" style={{ color: '#4A4A4A' }}>
                  {candidate?.full_name ?? `#${id}`}
                </p>
              )
            })}
          </div>
        )
      },
    },
    {
      id: 'conditions',
      header: L.conditions,
      cell: ({ row }) => (
        <div className="flex gap-1.5 items-center">
          <Cigarette size={14} color={!row.original.smoking_ok ? '#EF4444' : '#E5E7EB'} />
          <Wine size={14} color={!row.original.drinking_ok ? '#EF4444' : '#E5E7EB'} />
          <PawPrint size={14} color={row.original.has_pet ? '#10B981' : '#E5E7EB'} />
          <DoorOpen size={14} color={row.original.private_room ? '#10B981' : '#E5E7EB'} />
        </div>
      ),
    },
    {
      id: 'responsibilities',
      header: L.duties,
      cell: ({ row }) => {
        const resp = row.original.responsibilities
        if (!resp?.length) return <span style={{ color: '#E5E7EB' }}>—</span>
        return (
          <div>
            {resp.map((r: string, i: number) => (
              <span key={r} className="text-xs" style={{ color: '#4A4A4A' }}>
                {showName(r, lookups.responsibilities, lang)}{i < resp.length - 1 ? ', ' : ''}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      id: 'followups',
      header: L.followup,
      cell: ({ row }) => {
        const dates = [row.original.followup_1, row.original.followup_2, row.original.followup_3].filter(Boolean)
        const alert = row.original.alert_date
        return (
          <div>
            {dates.length ? dates.map((d, i) => (
              <p key={i} className="text-xs" style={{ color: '#9CA3AF' }}>
                {new Date(d!).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR')}
              </p>
            )) : <span style={{ color: '#E5E7EB' }}>—</span>}
            {alert && (
              <div className="flex items-center gap-1 mt-0.5">
                <Bell size={11} color="#EF4444" />
                <span className="text-xs" style={{ color: '#EF4444' }}>
                  {new Date(alert).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR')}
                </span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'desired_start',
      header: L.desiredStart,
      cell: ({ getValue }) => (
        <div>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>
            {getValue() ? new Date(String(getValue())).toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR') : '—'}
          </p>
        </div>
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
          <div className="w-2.5 h-2.5 rounded-full mr-1"
            style={{ background: row.original.is_active ? '#10B981' : '#D1D5DB' }}
            title={row.original.is_active ? L.active : L.passive}
          />
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
            onClick={() => { setEditingRequest(row.original); setShowModal(true) }}
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
  ], [lookups, candidates, lang])

  const table = useReactTable({
    data: requests,
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
          <p className="text-sm text-gray-500 mt-0.5">{requests.length} {L.recordCount}</p>
        </div>
        <button
          onClick={() => { setEditingRequest(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ background: '#E8673A' }}>
          <Plus size={16} /> {L.newRequest}
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
          value={stageFilter}
          onChange={e => {
            setStageFilter(e.target.value)
            table.getColumn('stage')?.setFilterValue(e.target.value || undefined)
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
          <option value="">{L.allStages}</option>
          {lookups.requestStages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        {(globalFilter || columnFilters.length > 0) && (
          <button onClick={() => { setGlobalFilter(''); setColumnFilters([]); setStageFilter('') }}
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
                    <tr key={hg.id} style={{ background: '#e5fad3', borderBottom: '1px solid #ede9e3' }}>
                      {hg.headers.map(header => (
                        <th key={header.id} className="text-left px-4 py-3">
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center gap-1 text-xs font-semibold tracking-wide select-none ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                              style={{ color: '#373737' }}
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
                        {L.notFound}
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
        <RequestModal
          request={editingRequest}
          employers={employers}
          agents={agents}
          candidates={candidates}
          lookups={lookups}
          lang={lang}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAll() }}
        />
      )}
    </div>
  )
}

function RequestModal({ request, employers, agents, candidates, lookups, lang, onClose, onSave }: {
  request: Request | null
  employers: { id: number; full_name: string }[]
  agents: { id: number; full_name: string }[]
  candidates: { id: number; full_name: string }[]
  lookups: ReturnType<typeof useLookups>['lookups']
  lang: string
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const labels = getLabels(lang)
  const L = { ...labels, ...labels.requests }

  const [form, setForm] = useState({
    employer_id: request?.employer_id ?? '',
    agent_id: request?.agent_id ?? '',
    stage: request?.stage ?? 'Yeni Geldi',
    service: request?.service ?? '',
    city: request?.city ?? '',
    work_type: request?.work_type ?? '',
    salary_currency: request?.salary_currency ?? 'USD',
    max_salary: request?.max_salary ?? '',
    legal_required: request?.legal_required ?? true,
    desired_nationality: request?.desired_nationality ?? [],
    language_pref: request?.language_pref ?? [],
    religion_pref: request?.religion_pref ?? '',
    min_age: request?.min_age ?? '',
    max_age: request?.max_age ?? '',
    smoking_ok: request?.smoking_ok ?? true,
    drinking_ok: request?.drinking_ok ?? true,
    has_pet: request?.has_pet ?? false,
    num_kids: request?.num_kids ?? '',
    kids_ages: request?.kids_ages ?? '',
    desired_start: request?.desired_start ?? '',
    suggested_candidate_1: request?.suggested_candidate_1 ?? '',
    suggested_candidate_2: request?.suggested_candidate_2 ?? '',
    suggested_candidate_3: request?.suggested_candidate_3 ?? '',
    followup_1: request?.followup_1 ?? '',
    followup_2: request?.followup_2 ?? '',
    followup_3: request?.followup_3 ?? '',
    farewell_date: request?.farewell_date ?? '',
    alert_date: request?.alert_date ?? '',
    notes: request?.notes ?? '',
    is_active: request?.is_active ?? true,
    private_room: request?.private_room ?? true,
    responsibilities: request?.responsibilities ?? [],
  })
  const [saving, setSaving] = useState(false)
  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const toggleArray = (field: 'desired_nationality' | 'language_pref', value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v: string) => v !== value)
        : [...f[field], value]
    }))
  }

  const handleSave = async () => {
    if (!form.employer_id) return alert(L.employerRequired)
    setSaving(true)
    const payload = {
      ...form,
      employer_id: Number(form.employer_id),
      agent_id: form.agent_id ? Number(form.agent_id) : null,
      max_salary: form.max_salary ? Number(form.max_salary) : null,
      min_age: form.min_age ? Number(form.min_age) : null,
      max_age: form.max_age ? Number(form.max_age) : null,
      num_kids: form.num_kids ? Number(form.num_kids) : null,
      suggested_candidate_1: form.suggested_candidate_1 ? Number(form.suggested_candidate_1) : null,
      suggested_candidate_2: form.suggested_candidate_2 ? Number(form.suggested_candidate_2) : null,
      suggested_candidate_3: form.suggested_candidate_3 ? Number(form.suggested_candidate_3) : null,
      desired_start: form.desired_start || null,
      followup_1: form.followup_1 || null,
      followup_2: form.followup_2 || null,
      followup_3: form.followup_3 || null,
      farewell_date: form.farewell_date || null,
      alert_date: form.alert_date || null,
    }
    if (request) {
      const { error } = await supabase.from('requests').update(payload).eq('id', request.id)
      if (error) { alert(L.errorPrefix + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('requests').insert(payload)
      if (error) { alert(L.errorPrefix + error.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  const toggleTraits = [
    { field: 'legal_required', trueLabel: L.legalRequired, falseLabel: L.legalNotRequired },
    { field: 'smoking_ok', trueLabel: L.smokingOk, falseLabel: L.smokingNotOk },
    { field: 'drinking_ok', trueLabel: L.drinkingOk, falseLabel: L.drinkingNotOk },
    { field: 'has_pet', trueLabel: L.hasPet, falseLabel: L.noPet },
    { field: 'private_room', trueLabel: L.privateRoom, falseLabel: L.noPrivateRoom },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}>

        <div className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid #ede9e3' }}>
          <h3 className="font-bold text-lg" style={{ color: '#4A4A4A' }}>
            {request ? L.editRequest : L.newRequest}
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
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.agent}</label>
              <select value={form.agent_id} onChange={e => set('agent_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.stage}</label>
              <select value={form.stage} onChange={e => set('stage', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                {lookups.requestStages.map(s => (
                  <option key={s.id} value={s.name}>
                    {lang === 'en' ? (s.name_en || s.name) : s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.service}</label>
              <select value={form.service} onChange={e => set('service', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {lookups.services.map(s => (
                  <option key={s.id} value={s.name}>{showName(s.name, lookups.services, lang)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.city}</label>
              <select value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {lookups.cities?.map(c => (
                  <option key={c.id} value={c.name}>
                    {lang === 'en' ? (c.name_en || c.name) : c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.workType}</label>
              <select value={form.work_type} onChange={e => set('work_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {lookups.workTypes.map(w => <option key={w.id} value={w.name}>{showName(w.name, lookups.workTypes, lang)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.maxSalary}</label>
              <input type="number" value={form.max_salary}
                onChange={e => set('max_salary', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.currency}</label>
              <select value={form.salary_currency} onChange={e => set('salary_currency', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.religionPref}</label>
              <select value={form.religion_pref} onChange={e => set('religion_pref', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">{L.select}</option>
                {lookups.religions.map(r => (
                  <option key={r.id} value={r.name}>{showName(r.name, lookups.religions, lang)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.minAge}</label>
              <input type="number" value={form.min_age} onChange={e => set('min_age', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.maxAge}</label>
              <input type="number" value={form.max_age} onChange={e => set('max_age', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.numKids}</label>
              <input type="number" value={form.num_kids} onChange={e => set('num_kids', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{L.kidsAges}</label>
              <input value={form.kids_ages} onChange={e => set('kids_ages', e.target.value)}
                placeholder="2, 5"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-wide mb-3" style={{ color: '#E8673A' }}>{L.candidateCriteria}</p>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-2" style={{ color: '#eb8a67' }}>{L.nationalityPref}</label>
              <div className="flex flex-wrap gap-2">
                {lookups.nationalities.map(n => {
                  const checked = form.desired_nationality.includes(n.name)
                  return (
                    <button key={n.id} type="button"
                      onClick={() => toggleArray('desired_nationality', n.name)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                      style={{
                        background: checked ? '#E8673A' : '#F7F6FB',
                        color: checked ? '#fff' : '#4A4A4A',
                        border: `1px solid ${checked ? '#E8673A' : '#ede9e3'}`
                      }}>
                      {showName(n.name, lookups.nationalities, lang)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: '#E8673A' }}>{L.responsibilities}</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {lookups.responsibilities.map(r => {
                  const checked = form.responsibilities.includes(r.name)
                  return (
                    <button key={r.id} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        responsibilities: checked
                          ? f.responsibilities.filter(v => v !== r.name)
                          : [...f.responsibilities, r.name]
                      }))}
                      className="px-3 py-1.5 rounded-lg text-xs transition-colors"
                      style={{
                        background: checked ? '#E8673A' : '#F7F6FB',
                        color: checked ? '#fff' : '#4A4A4A',
                        border: `1px solid ${checked ? '#E8673A' : '#ede9e3'}`
                      }}>
                      {showName(r.name, lookups.responsibilities, lang)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium" style={{ color: '#eb8a67' }}>{L.languagePref}</label>
              <div className="flex gap-2 overflow-x-auto pb-5">
                {lookups.languages.map(l => {
                  const checked = form.language_pref.includes(l.name)
                  return (
                    <button key={l.id} type="button"
                      onClick={() => toggleArray('language_pref', l.name)}
                      className="px-3 py-1.5 rounded-lg text-xs transition-colors flex-shrink-0"
                      style={{
                        background: checked ? '#3B82F6' : '#F7F6FB',
                        color: checked ? '#fff' : '#4A4A4A',
                        border: `1px solid ${checked ? '#3B82F6' : '#ede9e3'}`
                      }}>
                      {showName(l.name, lookups.languages, lang)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {toggleTraits.map(item => {
                const checked = !!form[item.field as keyof typeof form]
                const isSmokeOrDrink = item.field === 'smoking_ok' || item.field === 'drinking_ok'
                const isHighlighted = isSmokeOrDrink ? !checked : checked
                const activeBg = isSmokeOrDrink && isHighlighted ? '#d82f2f' : '#fdf1ec'
                const activeBorder = isSmokeOrDrink && isHighlighted ? '#cc1e1e' : '#E8673A'
                const activeColor = isSmokeOrDrink && isHighlighted ? '#ffffff' : '#E8673A'

                return (
                  <button key={item.field} type="button"
                    onClick={() => set(item.field, !checked)}
                    className="flex items-center px-3 py-2 rounded-lg transition-colors text-left"
                    style={{
                      background: isHighlighted ? activeBg : '#F7F6FB',
                      border: `1px solid ${isHighlighted ? activeBorder : '#ede9e3'}`
                    }}>
                    <span className="text-xs" style={{ color: isHighlighted ? activeColor : '#4A4A4A' }}>
                      {checked ? item.trueLabel : item.falseLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#E8673A' }}>{L.suggestedCandidates}</p>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{L.candidate} {i}</label>
                  <select
                    value={form[`suggested_candidate_${i}` as keyof typeof form] as string}
                    onChange={e => set(`suggested_candidate_${i}`, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                    <option value="">{L.select}</option>
                    {candidates.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#E8673A' }}>{L.followupCalls}</p>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{L.followupCall} {i}</label>
                  <input type="date" value={form[`followup_${i}` as keyof typeof form] as string}
                    onChange={e => set(`followup_${i}`, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{L.farewellDate}</label>
                <input type="date" value={form.farewell_date} onChange={e => set('farewell_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#E8673A' }}>{L.otherDates}</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{L.desiredStart}</label>
                <input type="date" value={form.desired_start} onChange={e => set('desired_start', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">🔔 {L.alertDate}</label>
                <input type="date" value={form.alert_date} onChange={e => set('alert_date', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{L.status}</label>
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