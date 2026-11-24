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
  ChevronLeft, ChevronRight, Pencil, Trash2, Info, X
} from 'lucide-react'

type Expense = {
  id: number
  description: string
  category: string
  account: string
  currency: string
  amount: number
  expense_date: string
  agent_id: number
  notes: string
  created_at: string
  agents?: { full_name: string }
}

export default function ExpensesPage() {
  const supabase = createClient()
  const { lookups } = useLookups()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [agents, setAgents] = useState<{ id: number; full_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: exp }, { data: agt }] = await Promise.all([
      supabase.from('expenses').select('*, agents(full_name)').order('created_at', { ascending: false }),
      supabase.from('agents').select('id, full_name').order('full_name'),
    ])
    if (exp) setExpenses(exp)
    if (agt) setAgents(agt)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu gideri silmek istediğinizden emin misiniz?')) return
    await supabase.from('expenses').delete().eq('id', id)
    fetchAll()
  }

  const columns = useMemo<ColumnDef<Expense>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>#{getValue() as number}</span>
      ),
    },
    {
      accessorKey: 'expense_date',
      header: 'Tarih',
      cell: ({ getValue }) => (
        <span className="text-xs" style={{ color: '#9CA3AF' }}>
          {getValue() ? new Date(String(getValue())).toLocaleDateString('tr-TR') : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Açıklama',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium" style={{ color: '#4A4A4A' }}>{row.original.description || '—'}</p>
          {row.original.agents?.full_name && (
            <p className="text-xs" style={{ color: '#E8673A' }}>{row.original.agents.full_name}</p>
          )}
        </div>
      ),
    },
    {
      id: 'category',
      accessorFn: row => row.category ?? '',
      header: 'Kategori',
      filterFn: 'equals',
      cell: ({ getValue }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>{String(getValue() ?? '') || '—'}</span>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Tutar',
      cell: ({ row }) => (
        <span className="text-sm font-medium" style={{ color: '#EF4444' }}>
          {row.original.amount ? `${row.original.amount.toLocaleString('tr-TR')} ${row.original.currency}` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'account',
      header: 'Hesap',
      cell: ({ getValue }) => (
        <span className="text-xs" style={{ color: '#9CA3AF' }}>{String(getValue() ?? '') || '—'}</span>
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
            onClick={() => { setEditingExpense(row.original); setShowModal(true) }}
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
  ], [lookups])

  const table = useReactTable({
    data: expenses,
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

  const expenseSummary = useMemo(() => {
  const byCurrency: Record<string, number> = {}
  expenses.forEach(e => {
    const cur = e.currency || 'USD'
    if (!byCurrency[cur]) byCurrency[cur] = 0
    byCurrency[cur] += e.amount || 0
  })
  return byCurrency
}, [expenses])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#4A4A4A' }}>Giderler</h2>
          <p className="text-sm text-gray-500 mt-0.5">{expenses.length} gider kaydı</p>
        </div>
        <button
          onClick={() => { setEditingExpense(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ background: '#E8673A' }}>
          <Plus size={16} /> Yeni Gider
        </button>
      </div>

      {/* Özet kart */}
      <div className="bg-white rounded-2xl p-4 mb-4" style={{ border: '1px solid #ede9e3' }}>
        <div className="flex flex-wrap gap-6">
          {Object.entries(expenseSummary).map(([cur, total]) => (
            <div key={cur}>
              <p className="text-xs text-gray-400 mb-1">Toplam Gider ({cur})</p>
              <p className="text-lg font-bold" style={{ color: '#EF4444' }}>
                {total.toLocaleString('tr-TR')}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 flex flex-wrap gap-3" style={{ border: '1px solid #ede9e3' }}>
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Ara..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => {
            setCategoryFilter(e.target.value)
            table.getColumn('category')?.setFilterValue(e.target.value || undefined)
          }}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#F7F6FB', border: '1px solid #ede9e3', color: '#4A4A4A' }}>
          <option value="">Tüm Kategoriler</option>
          {lookups.categories.map(c => <option key={c.id} value={c.name}>{c.name.split('/')[0].trim()}</option>)}
        </select>
        {(globalFilter || columnFilters.length > 0) && (
          <button onClick={() => { setGlobalFilter(''); setColumnFilters([]); setCategoryFilter('') }}
            className="px-3 py-2 rounded-lg text-sm" style={{ color: '#E8673A' }}>
            Temizle
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
                      Gider kaydı bulunamadı.
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
        <ExpenseModal
          expense={editingExpense}
          agents={agents}
          lookups={lookups}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAll() }}
        />
      )}
    </div>
  )
}

function ExpenseModal({ expense, agents, lookups, onClose, onSave }: {
  expense: Expense | null
  agents: { id: number; full_name: string }[]
  lookups: ReturnType<typeof useLookups>['lookups']
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    description: expense?.description ?? '',
    category: expense?.category ?? '',
    account: expense?.account ?? '',
    currency: expense?.currency ?? 'TRY',
    amount: expense?.amount ?? '',
    expense_date: expense?.expense_date ?? '',
    agent_id: expense?.agent_id ?? '',
    notes: expense?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      ...form,
      amount: form.amount ? Number(form.amount) : null,
      agent_id: form.agent_id ? Number(form.agent_id) : null,
      expense_date: form.expense_date || null,
    }
    if (expense) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', expense.id)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('expenses').insert(payload)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
    }
    setSaving(false)
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col"
        style={{ maxHeight: '90vh' }}>

        <div className="flex items-center justify-between p-6 flex-shrink-0"
          style={{ borderBottom: '1px solid #ede9e3' }}>
          <h3 className="font-bold text-lg" style={{ color: '#4A4A4A' }}>
            {expense ? 'Gideri Düzenle' : 'Yeni Gider'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#9CA3AF" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Açıklama</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
          </div>

          {/* Tarih & Kategori & Aracı */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
              <input type="date" value={form.expense_date} onChange={e => set('expense_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kalem Türü</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">Seçiniz</option>
                {lookups.categories.map(c => <option key={c.id} value={c.name}>{c.name.split('/')[0].trim()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Aracı</label>
              <select value={form.agent_id} onChange={e => set('agent_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">Yok</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          </div>

          {/* Para Birimi & Tutar & Hesap */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Para Birimi</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tutar</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hesap</label>
              <select value={form.account} onChange={e => set('account', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">Seçiniz</option>
                {lookups.accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
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

        <div className="flex gap-3 p-6 flex-shrink-0" style={{ borderTop: '1px solid #ede9e3' }}>
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