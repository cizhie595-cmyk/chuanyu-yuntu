import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getBudgetLabel } from '../../../../lib/supabase'

/**
 * GET /api/leads/market
 * B端抢单大厅 - 获取脱敏线索列表
 * 
 * 查询参数：
 * - region: 地区代码（可选）
 * - budget_level: 预算等级 1-4（可选）
 * - page: 页码（默认1）
 * - limit: 每页数量（默认20，最大50）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const budgetLevel = searchParams.get('budget_level')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    const supabase = getSupabaseAdmin()

    // ── 构建查询 ────────────────────────────────────────────────────────
    let query = supabase
      .from('leads')
      .select('id, budget_level, address, address_code, source, status, max_sales, current_sales, expires_at, created_at', { count: 'exact' })
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (region) {
      query = query.like('address_code', `${region}%`)
    }

    if (budgetLevel) {
      query = query.eq('budget_level', parseInt(budgetLevel))
    }

    const { data: leads, error, count } = await query

    if (error) {
      console.error('获取线索列表失败:', error)
      return NextResponse.json(
        { error: '获取线索列表失败' },
        { status: 500 }
      )
    }

    // ── 脱敏处理 ────────────────────────────────────────────────────────
    const desensitizedLeads = (leads || []).map((lead) => ({
      id: lead.id,
      budget: getBudgetLabel(lead.budget_level),
      budget_level: lead.budget_level,
      // 地址脱敏：只显示到区/县级
      address: desensitizeAddress(lead.address),
      address_code: lead.address_code,
      source: lead.source,
      remaining_slots: lead.max_sales - lead.current_sales,
      created_at: lead.created_at,
      expires_at: lead.expires_at,
      // 线索定价：基础线索30元，意向线索150元，精准线索300元
      // 7天后降价至70%，14天后降价至50%，30天下架
      price: getLeadPrice(lead.budget_level, lead.source, lead.created_at),
      original_price: getLeadBasePrice(lead.budget_level, lead.source),
    }))

    return NextResponse.json({
      success: true,
      data: desensitizedLeads,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('线索大厅API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * 地址脱敏：只显示省市区，隐藏详细地址
 */
function desensitizeAddress(address: string): string {
  if (!address) return '未知地区'
  // 匹配 "XX省XX市XX区/县" 或 "XX市XX区/县"
  const match = address.match(/^(.{2,}?(?:省|自治区|市))(.{2,}?(?:市|地区|州|盟))?(.{2,}?(?:区|县|市|旗))?/)
  if (match) {
    return match.slice(1).filter(Boolean).join('')
  }
  // 如果无法解析，只返回前6个字符
  return address.slice(0, 6) + '***'
}

/**
 * 线索基础定价逻辑
 * - 基础线索（预算低/来源不明）：30元
 * - 意向线索（预算中等/H5分享来源）：150元
 * - 精准线索（预算高/有项目关联）：300元
 */
function getLeadBasePrice(budgetLevel: number, source: string): number {
  if (budgetLevel >= 3 && source === 'h5_share') return 300
  if (budgetLevel >= 2 || source === 'h5_share') return 150
  return 30
}

/**
 * 线索实际价格（含降价逻辑）
 * PRD 规则：
 * - 0~7天：原价
 * - 7~14天：降价至 70%
 * - 14~30天：降价至 50%
 * - 30天后：自动下架（已通过 expires_at 过滤）
 */
function getLeadPrice(budgetLevel: number, source: string, createdAt: string): number {
  const basePrice = getLeadBasePrice(budgetLevel, source)
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceCreated >= 14) return Math.round(basePrice * 0.5)
  if (daysSinceCreated >= 7) return Math.round(basePrice * 0.7)
  return basePrice
}
