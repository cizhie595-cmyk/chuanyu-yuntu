'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  lead_id: string
  amount: number
  status: string
  lead_phone: string
  lead_name: string
  lead_address: string
  lead_budget: string
  created_at: string
}

interface User {
  id: string
  phone: string
  role: string
  credit_score: number
}

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // ── 获取用户信息 ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  // ── 获取订单列表 ────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/leads/orders')
      const data = await res.json()
      if (data.success) {
        setOrders(data.data || [])
      }
    } catch {
      console.error('获取订单失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) fetchOrders()
  }, [user, fetchOrders])

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待支付', color: 'text-yellow-400 bg-yellow-500/20' },
    paid: { label: '已支付', color: 'text-green-400 bg-green-500/20' },
    refunded: { label: '已退款', color: 'text-gray-400 bg-gray-500/20' },
    appealing: { label: '申诉中', color: 'text-orange-400 bg-orange-500/20' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg bg-white/5 p-2 text-gray-400 hover:bg-white/10 hover:text-white"
              onClick={() => router.push('/market')}
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-white">我的订单</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">📋</p>
            <p className="mt-3 text-gray-400">暂无订单</p>
            <button
              className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700"
              onClick={() => router.push('/market')}
              type="button"
            >
              去抢单大厅看看
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = statusMap[order.status] || statusMap.pending
              return (
                <div
                  className="rounded-xl border border-white/5 bg-white/5 p-4 backdrop-blur"
                  key={order.id}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString('zh-CN')}
                        </span>
                      </div>
                      {order.status === 'paid' ? (
                        <>
                          <p className="text-sm text-gray-200">
                            业主：{order.lead_name} · {order.lead_phone}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">{order.lead_address}</p>
                          <p className="mt-1 text-xs text-gray-400">预算：{order.lead_budget}</p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">支付后可查看业主联系方式</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-white">¥{order.amount}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
