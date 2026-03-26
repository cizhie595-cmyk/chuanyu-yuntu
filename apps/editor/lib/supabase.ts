import { createClient } from '@supabase/supabase-js'

/**
 * Supabase 服务端客户端（使用 Service Role Key，仅在 API 路由中使用）
 * 
 * 环境变量要求：
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase 项目 URL
 * - SUPABASE_SERVICE_ROLE_KEY: 服务端密钥（具有完整数据库访问权限）
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      '缺少 Supabase 环境变量。请在 .env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ── 类型定义 ──────────────────────────────────────────────────────────────

export type LeadStatus = 'open' | 'sold_out' | 'closed'
export type LeadOrderStatus = 'pending' | 'paid' | 'refunded' | 'appealing'

export interface Lead {
  id: string
  name: string
  phone: string
  address: string
  address_code: string
  budget: string
  budget_level: number
  project_code: string | null
  source: string
  status: LeadStatus
  max_sales: number
  current_sales: number
  expires_at: string
  created_at: string
  updated_at: string
}

export interface LeadOrder {
  id: string
  lead_id: string
  contractor_id: string
  amount: number
  status: LeadOrderStatus
  created_at: string
}

// ── 预算映射 ──────────────────────────────────────────────────────────────

const BUDGET_LEVEL_MAP: Record<string, number> = {
  '10-20': 1,
  '20-30': 2,
  '30-50': 3,
  '50+': 4,
}

export function getBudgetLevel(budget: string): number {
  return BUDGET_LEVEL_MAP[budget] ?? 2
}

export function getBudgetLabel(level: number): string {
  const labels: Record<number, string> = {
    1: '10-20万',
    2: '20-30万',
    3: '30-50万',
    4: '50万以上',
  }
  return labels[level] ?? '未知'
}
