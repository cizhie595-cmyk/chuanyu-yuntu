import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getBudgetLevel } from '../../../lib/supabase'
import { geocodeAddress } from '../../../lib/amap'

/**
 * POST /api/leads
 * C端业主提交留资信息
 *
 * 请求体：
 * {
 *   name: string        - 姓名（必填）
 *   phone: string       - 手机号（必填，11位）
 *   budget: string      - 预算范围（如 '20-30'）
 *   address: string     - 建房地址
 *   projectCode: string - 关联的项目分享码
 *   source: string      - 来源（如 'h5_share'）
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, budget, address, projectCode, source } = body

    // ── 参数校验 ────────────────────────────────────────────────────────
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: '请输入您的姓名' },
        { status: 400 }
      )
    }

    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: '请输入正确的11位手机号码' },
        { status: 400 }
      )
    }

    // ── 防重复提交（同一手机号24小时内不能重复提交同一项目）────────────
    const supabase = getSupabaseAdmin()

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data: existingLeads } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .eq('project_code', projectCode || '')
      .gte('created_at', twentyFourHoursAgo)
      .limit(1)

    if (existingLeads && existingLeads.length > 0) {
      return NextResponse.json(
        { error: '您已提交过该方案的报价申请，我们将尽快联系您' },
        { status: 409 }
      )
    }

    // ── 计算预算等级 ────────────────────────────────────────────────────
    const budgetLevel = getBudgetLevel(budget || '20-30')

    // ── 高德地图地址解析（获取行政区划代码）──────────────────────────────
    let addressCode = ''
    if (address) {
      const geoResult = await geocodeAddress(address)
      if (geoResult) {
        addressCode = geoResult.adcode
      }
    }

    // ── 计算过期时间（30天后下架）────────────────────────────────────────
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // ── 写入数据库 ──────────────────────────────────────────────────────
    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name: name.trim(),
        phone,
        budget: budget || '20-30',
        budget_level: budgetLevel,
        address: address?.trim() || '',
        address_code: addressCode,
        project_code: projectCode || null,
        source: source || 'unknown',
        status: 'open',
        max_sales: 3,
        current_sales: 0,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (error) {
      console.error('创建线索失败:', error)
      return NextResponse.json(
        { error: '提交失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        lead_id: lead.id,
        message: '提交成功！我们将在24小时内联系您',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('线索API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
