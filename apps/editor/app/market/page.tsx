'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── 类型定义 ──────────────────────────────────────────────────────────────
interface Lead {
  id: string
  budget: string
  budget_level: number
  address: string
  address_code: string
  source: string
  remaining_slots: number
  created_at: string
  expires_at: string
  price: number
  original_price?: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

interface User {
  id: string
  phone: string
  role: string
  credit_score: number
}

// ── 预算筛选选项 ────────────────────────────────────────────────────
const BUDGET_FILTERS = [
  { value: '', label: '全部预算' },
  { value: '1', label: '10-20万' },
  { value: '2', label: '20-30万' },
  { value: '3', label: '30-50万' },
  { value: '4', label: '50万以上' },
]

// ── 区域筛选选项（川渝地区）──────────────────────────────────────────
const REGION_FILTERS = [
  { value: '', label: '全部地区' },
  { value: '51', label: '四川省' },
  { value: '5101', label: '成都市' },
  { value: '5107', label: '绵阳市' },
  { value: '5108', label: '广元市' },
  { value: '5110', label: '内江市' },
  { value: '5113', label: '南充市' },
  { value: '5115', label: '宜宾市' },
  { value: '50', label: '重庆市' },
  { value: '5001', label: '渝中区' },
  { value: '5002', label: '万州区' },
  { value: '5003', label: '涪陵区' },
]

export default function MarketPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [budgetFilter, setBudgetFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [buying, setBuying] = useState<string | null>(null)

  // ── 获取用户信息 ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
  }, [])

  // ── 获取线索列表 ────────────────────────────────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (budgetFilter) params.set('budget_level', budgetFilter)
      if (regionFilter) params.set('region', regionFilter)

      const res = await fetch(`/api/leads/market?${params}`)
      const data = await res.json()

      if (data.success) {
        setLeads(data.data)
        setPagination(data.pagination)
      }
    } catch {
      console.error('获取线索列表失败')
    } finally {
      setLoading(false)
    }
  }, [page, budgetFilter, regionFilter])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // ── 购买线索 ────────────────────────────────────────────────────────────
  const handleBuy = useCallback(
    async (leadId: string, price: number) => {
      if (!user) {
        router.push('/login')
        return
      }

      if (user.role !== 'contractor') {
        alert('请使用包工头账号登录后购买')
        return
      }

      if (!confirm(`确认购买该线索？需支付 ${price} 元`)) return

      setBuying(leadId)
      try {
        const res = await fetch(`/api/leads/${leadId}/buy`, {
          method: 'POST',
        })
        const data = await res.json()

        if (data.success) {
          alert(`购买成功！订单号：${data.order_id}\n${data.message}`)
          fetchLeads() // 刷新列表
        } else {
          alert(data.error || '购买失败')
        }
      } catch {
        alert('网络错误，请稍后重试')
      } finally {
        setBuying(null)
      }
    },
    [user, router, fetchLeads]
  )

  // ── 时间格式化 ──────────────────────────────────────────────────────────
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours}小时前`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  // ── 价格标签样式 ────────────────────────────────────────────────────────
  const getPriceTag = (price: number) => {
    if (price >= 300) return { label: '精准线索', color: 'bg-red-500/20 text-red-400' }
    if (price >= 150) return { label: '意向线索', color: 'bg-orange-500/20 text-orange-400' }
    return { label: '基础线索', color: 'bg-green-500/20 text-green-400' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-white">抢单大厅</h1>
            <p className="text-xs text-gray-400">川渝云图 · 装修线索市场</p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                  信用 {user.credit_score}
                </span>
              </div>
            ) : (
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => router.push('/login')}
                type="button"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 筛选栏 */}
      <div className="sticky top-[57px] z-40 border-b border-white/5 bg-slate-900/60 backdrop-blur-md">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-3">
          {/* 预算筛选 */}
          <div className="flex gap-2 overflow-x-auto">
            {BUDGET_FILTERS.map((filter) => (
              <button
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${
                  budgetFilter === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
                key={filter.value}
                onClick={() => {
                  setBudgetFilter(filter.value)
                  setPage(1)
                }}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          {/* 区域筛选 */}
          <div className="flex gap-2 overflow-x-auto">
            {REGION_FILTERS.map((filter) => (
              <button
                className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                  regionFilter === filter.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
                key={filter.value}
                onClick={() => {
                  setRegionFilter(filter.value)
                  setPage(1)
                }}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 线索列表 */}
      <main className="mx-auto max-w-5xl px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">📭</p>
            <p className="mt-3 text-gray-400">暂无可用线索</p>
            <p className="mt-1 text-sm text-gray-500">请稍后再来查看</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => {
              const priceTag = getPriceTag(lead.price)
              return (
                <div
                  className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur transition-colors hover:bg-white/10"
                  key={lead.id}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 标签行 */}
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priceTag.color}`}>
                          {priceTag.label}
                        </span>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-gray-400">
                          {lead.budget}
                        </span>
                        {lead.source === 'h5_share' && (
                          <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs text-purple-400">
                            H5分享
                          </span>
                        )}
                      </div>

                      {/* 地址 */}
                      <p className="text-sm text-gray-200">{lead.address || '未知地区'}</p>

                      {/* 底部信息 */}
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatTime(lead.created_at)}</span>
                        <span>剩余 {lead.remaining_slots} 个名额</span>
                      </div>
                    </div>

                    {/* 价格和购买按钮 */}
                    <div className="ml-4 flex flex-col items-end gap-2">
                      <div className="text-right">
                        {lead.original_price && lead.original_price > lead.price ? (
                          <>
                            <span className="text-xs text-gray-500 line-through">¥{lead.original_price}</span>
                            <span className="ml-1 rounded bg-red-500/20 px-1 py-0.5 text-[10px] text-red-400">降价</span>
                          </>
                        ) : null}
                        <span className="block text-xl font-bold text-white">¥{lead.price}</span>
                      </div>
                      <button
                        className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-orange-700 disabled:opacity-50"
                        disabled={buying === lead.id || lead.remaining_slots <= 0}
                        onClick={() => handleBuy(lead.id, lead.price)}
                        type="button"
                      >
                        {buying === lead.id
                          ? '购买中...'
                          : lead.remaining_slots <= 0
                            ? '已售罄'
                            : '立即抢单'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 分页 */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400 hover:bg-white/10 disabled:opacity-30"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              type="button"
            >
              上一页
            </button>
            <span className="px-4 text-sm text-gray-400">
              {page} / {pagination.total_pages}
            </span>
            <button
              className="rounded-lg bg-white/5 px-4 py-2 text-sm text-gray-400 hover:bg-white/10 disabled:opacity-30"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => p + 1)}
              type="button"
            >
              下一页
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
