import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * POST /api/leads/:id/buy
 * B端包工头购买线索
 * 
 * 请求头：
 * - Authorization: Bearer <token>（TODO: 接入 Better Auth 验证）
 * 
 * 响应：
 * - 成功：返回订单ID和支付链接
 * - 失败：返回错误信息
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params

    // TODO: 从 Better Auth 获取当前登录用户
    // const session = await auth.api.getSession({ headers: request.headers })
    // if (!session) {
    //   return NextResponse.json({ error: '请先登录' }, { status: 401 })
    // }
    // const contractorId = session.user.id

    // 临时：从请求体获取包工头ID（正式版需要从session获取）
    const body = await request.json().catch(() => ({}))
    const contractorId = body.contractor_id

    if (!contractorId) {
      return NextResponse.json(
        { error: '请先登录后再购买线索' },
        { status: 401 }
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

    // TODO: 对接微信支付/支付宝，生成支付链接
    // 目前返回模拟的支付链接
    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: price,
      // TODO: 替换为真实支付链接
      pay_url: `/pay/${order.id}`,
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
 * 线索定价逻辑（与 market route 保持一致）
 */
function getLeadPrice(budgetLevel: number, source: string): number {
  if (budgetLevel >= 3 && source === 'h5_share') return 300
  if (budgetLevel >= 2 || source === 'h5_share') return 150
  return 30
}
