import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getBudgetLabel } from '../../../../lib/supabase'
import { verifyToken } from '../../../../lib/auth-utils'

/**
 * GET /api/leads/orders
 * 获取当前包工头的订单列表
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyToken(request)
    if (!payload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // 获取订单及关联的线索信息
    const { data: orders, error } = await supabase
      .from('lead_orders')
      .select(`
        id, lead_id, amount, status, created_at,
        leads:lead_id (name, phone, address, budget_level)
      `)
      .eq('contractor_id', payload.sub)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取订单列表失败:', error)
      return NextResponse.json(
        { error: '获取订单列表失败' },
        { status: 500 }
      )
    }

    // 处理数据：已支付订单显示完整信息，未支付订单脱敏
    const processedOrders = (orders || []).map((order: any) => {
      const lead = order.leads || {}
      const isPaid = order.status === 'paid'

      return {
        id: order.id,
        lead_id: order.lead_id,
        amount: order.amount,
        status: order.status,
        created_at: order.created_at,
        // 已支付才显示完整信息
        lead_name: isPaid ? lead.name : '***',
        lead_phone: isPaid ? lead.phone : '***',
        lead_address: lead.address || '未知地区',
        lead_budget: getBudgetLabel(lead.budget_level || 2),
      }
    })

    return NextResponse.json({
      success: true,
      data: processedOrders,
    })
  } catch (error) {
    console.error('订单列表API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
