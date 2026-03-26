import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../../lib/auth-utils'
import { getSupabaseAdmin } from '../../../../lib/supabase'

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyToken(request)
    if (!payload) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone, role, credit_score, created_at')
      .eq('id', payload.sub)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/me (logout)
 * 退出登录
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: '已退出登录' })
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}
