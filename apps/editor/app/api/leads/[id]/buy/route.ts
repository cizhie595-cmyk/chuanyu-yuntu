import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'
import { verifyToken } from '../../../../../lib/auth-utils'

/**
 * POST /api/leads/:id/buy
 * B端包工头购买线索
 *
 * 请求头：
 * - Authorization: Bearer <token> 或 cookie auth_token
 *
 * 响应：
 * - 成功：返回订单ID和支付信息
 * - 失败：返回错误信息
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params

    // ── 身份验证（从 JWT token 获取用户信息）─────────────────────────────
    const payload = await verifyToken(request)
    if (!payload) {
      return NextResponse.json(
        { error: '请先登录后再购买线索' },
        { status: 401 }
      )
    }

    const contractorId = payload.sub

    // 验证用户角色（只有包工头可以购买线索）
    if (payload.role !== 'contractor' && payload.role !== 'admin') {
      return NextResponse.json(
        { error: '只有包工头账号才能购买线索，请切换账号或注册包工头账号' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    // ── 查询线索信息 ────────────────────────────────────────────────────
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: '线索不存在' },
        { status: 404 }
      )
    }

    // ── 校验线索状态 ────────────────────────────────────────────────────
    if (lead.status !== 'open') {
      return NextResponse.json(
        { error: '该线索已关闭' },
        { status: 400 }
      )
    }

    if (new Date(lead.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '该线索已过期' },
        { status: 400 }
      )
    }

    if (lead.current_sales >= lead.max_sales) {
      return NextResponse.json(
        { error: '该线索已售罄' },
        { status: 400 }
      )
    }

    // ── 检查是否重复购买 ────────────────────────────────────────────────
    const { data: existingOrder } = await supabase
      .from('lead_orders')
      .select('id')
      .eq('lead_id', leadId)
      .eq('contractor_id', contractorId)
      .in('status', ['pending', 'paid'])
      .limit(1)

    if (existingOrder && existingOrder.length > 0) {
      return NextResponse.json(
        { error: '您已购买过该线索' },
        { status: 409 }
      )
    }

    // ── 检查信用分 ──────────────────────────────────────────────────────
    const { data: contractor } = await supabase
      .from('users')
      .select('credit_score')
      .eq('id', contractorId)
      .single()

    if (contractor && contractor.credit_score < 60) {
      return NextResponse.json(
        { error: '您的信用分不足，无法购买线索。请联系客服处理。' },
        { status: 403 }
      )
    }

    // ── 计算价格 ────────────────────────────────────────────────────────
    const price = getLeadPrice(lead.budget_level, lead.source)

    // ── 创建订单 ────────────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from('lead_orders')
      .insert({
        lead_id: leadId,
        contractor_id: contractorId,
        amount: price,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('创建订单失败:', orderError)
      return NextResponse.json(
        { error: '创建订单失败，请稍后重试' },
        { status: 500 }
      )
    }

    // ── 更新线索销售计数 ────────────────────────────────────────────────
    const newSales = lead.current_sales + 1
    const newStatus = newSales >= lead.max_sales ? 'sold_out' : 'open'

    await supabase
      .from('leads')
      .update({
        current_sales: newSales,
        status: newStatus,
      })
      .eq('id', leadId)

    // V1.0：返回订单信息，支付页面在前端处理
    // V2.0：对接微信支付/支付宝，返回真实支付链接
    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: price,
      pay_url: `/market/pay/${order.id}`,
      message: `订单创建成功，需支付 ${price} 元`,
    })
  } catch (error) {
    console.error('购买线索API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * 线索定价逻辑
 * - 基础线索（预算低/来源不明）：30元
 * - 意向线索（预算中等/H5分享来源）：150元
 * - 精准线索（预算高+有项目关联）：300元
 */
function getLeadPrice(budgetLevel: number, source: string): number {
  if (budgetLevel >= 3 && source === 'h5_share') return 300
  if (budgetLevel >= 2 || source === 'h5_share') return 150
  return 30
}
