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
  ChevronLeft, ChevronRight, Pencil, Trash2, Info, X,
  CheckCircle, Circle
} from 'lucide-react'

type Income = {
  id: number
  description: string
  match_id: number
  category: string
  account: string
  currency: string
  total_amount: number
  paid_amount: number
  installments: number
  installment_1: number
  installment_1_date: string
  installment_1_paid: boolean
  installment_2: number
  installment_2_date: string
  installment_2_paid: boolean
  installment_3: number
  installment_3_date: string
  installment_3_paid: boolean
  installment_4: number
  installment_4_date: string
  installment_4_paid: boolean
  installment_5: number
  installment_5_date: string
  installment_5_paid: boolean
  installment_6: number
  installment_6_date: string
  installment_6_paid: boolean
  income_date: string
  debtor_type: string
  debtor_id: number
  notes: string
  created_at: string
  matches?: {
    employers?: { full_name: string }
    candidates?: { full_name: string }
  }
}

export default function IncomePage() {
  const supabase = createClient()
  const { lookups } = useLookups()
  const [incomes, setIncomes] = useState<Income[]>([])
  const [matches, setMatches] = useState<{ id: number; employer: string; candidate: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: inc }, { data: mat }] = await Promise.all([
      supabase.from('income').select(`
        *,
        matches(
          employers(full_name),
          candidates(full_name)
        )
      `).order('created_at', { ascending: false }),
      supabase.from('matches').select(`
        id,
        employers(full_name),
        candidates(full_name)
      `).order('id', { ascending: false }),
    ])
    if (inc) setIncomes(inc)
    if (mat) setMatches(mat.map((m: any) => ({
      id: m.id,
      employer: m.employers?.full_name ?? '-',
      candidate: m.candidates?.full_name ?? '-',
    })))
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Bu geliri silmek istediğinizden emin misiniz?')) return
    await supabase.from('income').delete().eq('id', id)
    fetchAll()
  }

  const columns = useMemo<ColumnDef<Income>[]>(() => [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono" style={{ color: '#9CA3AF' }}>#{getValue() as number}</span>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Açıklama',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium" style={{ color: '#4A4A4A' }}>{row.original.description || '—'}</p>
          {row.original.matches && (
            <p className="text-xs" style={{ color: '#9CA3AF' }}>
              {row.original.matches.employers?.full_name} → {row.original.matches.candidates?.full_name}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: ({ getValue }) => (
        <span className="text-sm" style={{ color: '#4A4A4A' }}>{String(getValue() ?? '') || '—'}</span>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: 'Toplam',
      cell: ({ row }) => (
        <span className="text-sm font-medium" style={{ color: '#4A4A4A' }}>
          {row.original.total_amount ? `${Number(row.original.total_amount).toLocaleString('tr-TR')} ${row.original.currency}` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'paid_amount',
      header: 'Ödenen',
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: '#10B981' }}>
          {row.original.paid_amount ? `${Number(row.original.paid_amount).toLocaleString('tr-TR')} ${row.original.currency}` : '—'}
        </span>
      ),
    },
    {
      id: 'remaining',
      header: 'Kalan',
      cell: ({ row }) => {
        const remaining = (row.original.total_amount || 0) - (row.original.paid_amount || 0)
        return (
          <span className="text-sm" style={{ color: remaining > 0 ? '#EF4444' : '#10B981' }}>
            {remaining > 0 ? `${remaining} ${row.original.currency}` : '✓'}
          </span>
        )
      },
    },
    {
      id: 'installments',
      header: 'Taksit',
      cell: ({ row }) => {
        if (row.original.installments <= 1) return <span style={{ color: '#E5E7EB' }}>—</span>
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].slice(0, row.original.installments).map(i => {
              const paid = row.original[`installment_${i}_paid` as keyof Income] as boolean
              return (
                <span key={i} className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: paid ? '#dcfce7' : '#FEF2F2', color: paid ? '#16a34a' : '#EF4444' }}>
                  {i}
                </span>
              )
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'account',
      header: 'Hesap',
      cell: ({ getValue }) => (
        <span className="text-xs" style={{ color: '#9CA3AF' }}>{String(getValue() ?? '') || '—'}</span>
      ),
    },
    {
      accessorKey: 'income_date',
      header: 'Tarih',
      cell: ({ getValue }) => (
        <span className="text-xs" style={{ color: '#9CA3AF' }}>
          {getValue() ? new Date(String(getValue())).toLocaleDateString('tr-TR') : '—'}
        </span>
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
            onClick={() => { setEditingIncome(row.original); setShowModal(true) }}
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
    data: incomes,
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

  // Toplam istatistikler
  const summary = useMemo(() => {
    const byCurrency: Record<string, { total: number; paid: number }> = {}
    incomes.forEach(i => {
      const cur = i.currency || 'USD'
      if (!byCurrency[cur]) byCurrency[cur] = { total: 0, paid: 0 }
      byCurrency[cur].total += i.total_amount || 0
      byCurrency[cur].paid += i.paid_amount || 0
    })
    return byCurrency
  }, [incomes])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#4A4A4A' }}>Gelirler</h2>
          <p className="text-sm text-gray-500 mt-0.5">{incomes.length} gelir kaydı</p>
        </div>
        <button
          onClick={() => { setEditingIncome(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium hover:opacity-90"
          style={{ background: '#E8673A' }}>
          <Plus size={16} /> Yeni Gelir
        </button>
      </div>

      {/* Özet kartlar */}
      <div className="bg-white rounded-2xl p-4 mb-4" style={{ border: '1px solid #ede9e3' }}>
        <div className="flex flex-wrap gap-6">
          {Object.entries(summary).map(([cur, vals]) => (
            <div key={cur} className="flex gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-1">Toplam ({cur})</p>
                <p className="text-lg font-bold" style={{ color: '#4A4A4A' }}>
                  {vals.total.toLocaleString('tr-TR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Ödenen ({cur})</p>
                <p className="text-lg font-bold" style={{ color: '#10B981' }}>
                  {vals.paid.toLocaleString('tr-TR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Kalan ({cur})</p>
                <p className="text-lg font-bold" style={{ color: (vals.total - vals.paid) > 0 ? '#EF4444' : '#10B981' }}>
                  {(vals.total - vals.paid).toLocaleString('tr-TR')}
                </p>
              </div>
              <div style={{ borderRight: '1px solid #ede9e3', marginRight: '8px' }} />
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
        {globalFilter && (
          <button onClick={() => setGlobalFilter('')}
            className="px-3 py-2 rounded-lg text-sm" style={{ color: '#E8673A' }}>
            Temizle
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
                        Gelir kaydı bulunamadı.
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
        <IncomeModal
          income={editingIncome}
          matches={matches}
          lookups={lookups}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchAll() }}
        />
      )}
    </div>
  )
}

function IncomeModal({ income, matches, lookups, onClose, onSave }: {
  income: Income | null
  matches: { id: number; employer: string; candidate: string }[]
  lookups: ReturnType<typeof useLookups>['lookups']
  onClose: () => void
  onSave: () => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState({
    description: income?.description ?? '',
    match_id: income?.match_id ?? '',
    category: income?.category ?? '',
    account: income?.account ?? '',
    currency: income?.currency ?? 'USD',
    total_amount: income?.total_amount ?? '',
    paid_amount: income?.paid_amount ?? 0,
    installments: income?.installments ?? 1,
    installment_1: income?.installment_1 ?? '',
    installment_1_date: income?.installment_1_date ?? '',
    installment_1_paid: income?.installment_1_paid ?? false,
    installment_2: income?.installment_2 ?? '',
    installment_2_date: income?.installment_2_date ?? '',
    installment_2_paid: income?.installment_2_paid ?? false,
    installment_3: income?.installment_3 ?? '',
    installment_3_date: income?.installment_3_date ?? '',
    installment_3_paid: income?.installment_3_paid ?? false,
    installment_4: income?.installment_4 ?? '',
    installment_4_date: income?.installment_4_date ?? '',
    installment_4_paid: income?.installment_4_paid ?? false,
    installment_5: income?.installment_5 ?? '',
    installment_5_date: income?.installment_5_date ?? '',
    installment_5_paid: income?.installment_5_paid ?? false,
    installment_6: income?.installment_6 ?? '',
    installment_6_date: income?.installment_6_date ?? '',
    installment_6_paid: income?.installment_6_paid ?? false,
    income_date: income?.income_date ?? '',
    notes: income?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const set = (field: string, value: unknown) => setForm(f => ({ ...f, [field]: value }))

  // Ödenen tutarı otomatik hesapla
  const calcPaid = () => {
    let paid = 0
    for (let i = 1; i <= form.installments; i++) {
      const paidKey = `installment_${i}_paid` as keyof typeof form
      const amountKey = `installment_${i}` as keyof typeof form
      if (form[paidKey]) paid += Number(form[amountKey]) || 0
    }
    return paid
  }

  const remaining = (Number(form.total_amount) || 0) - calcPaid()

  const handleSave = async () => {
    setSaving(true)
    const paid = calcPaid()
    const payload = {
      ...form,
      match_id: form.match_id ? Number(form.match_id) : null,
      total_amount: form.total_amount ? Number(form.total_amount) : null,
      paid_amount: paid,
      installment_1: form.installment_1 ? Number(form.installment_1) : null,
      installment_2: form.installment_2 ? Number(form.installment_2) : null,
      installment_3: form.installment_3 ? Number(form.installment_3) : null,
      installment_4: form.installment_4 ? Number(form.installment_4) : null,
      installment_5: form.installment_5 ? Number(form.installment_5) : null,
      installment_6: form.installment_6 ? Number(form.installment_6) : null,
      installment_1_date: form.installment_1_date || null,
      installment_2_date: form.installment_2_date || null,
      installment_3_date: form.installment_3_date || null,
      installment_4_date: form.installment_4_date || null,
      installment_5_date: form.installment_5_date || null,
      installment_6_date: form.installment_6_date || null,
      income_date: form.income_date || null,

    }
    if (income) {
      const { error } = await supabase.from('income').update(payload).eq('id', income.id)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('income').insert(payload)
      if (error) { alert('Hata: ' + error.message); setSaving(false); return }
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
            {income ? 'Geliri Düzenle' : 'Yeni Gelir'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} color="#9CA3AF" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Açıklama</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
          </div>

          {/* Eşleşme & Kategori & Hesap */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Eşleşme</label>
              <select value={form.match_id} onChange={e => set('match_id', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">Seçiniz</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>#{m.id} {m.employer} → {m.candidate}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                <option value="">Seçiniz</option>
                {lookups.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
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

          {/* Toplam Tutar & Para Birimi & Tarih */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Toplam Tutar</label>
              <input type="number" value={form.total_amount}
                onChange={e => set('total_amount', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Para Birimi</label>
              <select value={form.currency} onChange={e => set('currency', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }}>
                {lookups.currencies.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
              <input type="date" value={form.income_date}
                onChange={e => set('income_date', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
            </div>
          </div>

          {/* Taksit Sayısı */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Taksit Sayısı</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button key={n} type="button"
                  onClick={() => set('installments', n)}
                  className="px-4 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: form.installments === n ? '#E8673A' : '#F7F6FB',
                    color: form.installments === n ? '#fff' : '#4A4A4A',
                    border: `1px solid ${form.installments === n ? '#E8673A' : '#ede9e3'}`
                  }}>
                  {n === 1 ? 'Tek Ödeme' : `${n} Taksit`}
                </button>
              ))}
            </div>
          </div>

          {/* Taksit Detayları */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#9CA3AF' }}>Ödeme Detayları</p>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].slice(0, form.installments).map(i => {
                const amountKey = `installment_${i}` as keyof typeof form
                const dateKey = `installment_${i}_date` as keyof typeof form
                const paidKey = `installment_${i}_paid` as keyof typeof form
                const isPaid = !!form[paidKey]
                return (
                  <div key={i} className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {form.installments === 1 ? 'Tutar' : `${i}. Taksit`}
                      </label>
                      <input type="number" value={form[amountKey] as string}
                        onChange={e => set(amountKey, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Tarih</label>
                      <input type="date" value={form[dateKey] as string}
                        onChange={e => set(dateKey, e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                        style={{ border: '1px solid #ede9e3', color: '#4A4A4A' }} />
                    </div>
                    <button type="button"
                      onClick={() => set(paidKey, !isPaid)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                      style={{
                        background: isPaid ? '#f0fdf4' : '#F7F6FB',
                        border: `1px solid ${isPaid ? '#10B981' : '#ede9e3'}`
                      }}>
                      {isPaid
                        ? <CheckCircle size={14} color="#10B981" />
                        : <Circle size={14} color="#9CA3AF" />}
                      <span className="text-xs" style={{ color: isPaid ? '#10B981' : '#6B7280' }}>
                        {isPaid ? 'Ödendi' : 'Ödenmedi'}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Özet */}
            {Number(form.total_amount) > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3 p-3 rounded-xl"
                style={{ background: '#F7F6FB', border: '1px solid #ede9e3' }}>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Toplam</p>
                  <p className="text-sm font-bold" style={{ color: '#4A4A4A' }}>
                    {Number(form.total_amount).toLocaleString('tr-TR')} {form.currency}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Ödenen</p>
                  <p className="text-sm font-bold" style={{ color: '#10B981' }}>
                    {calcPaid().toLocaleString('tr-TR')} {form.currency}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Kalan</p>
                  <p className="text-sm font-bold" style={{ color: remaining > 0 ? '#EF4444' : '#10B981' }}>
                    {remaining > 0 ? `${remaining.toLocaleString('tr-TR')} ${form.currency}` : '✓ Tamamlandı'}
                  </p>
                </div>
              </div>
            )}
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