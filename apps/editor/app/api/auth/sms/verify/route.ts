import { NextRequest, NextResponse } from 'next/server'
import { verifySmsCode, findOrCreateUserByPhone } from '../../../../../lib/auth'
import { SignJWT } from 'jose'

/**
 * POST /api/auth/sms/verify
 * 验证短信验证码并登录/注册
 *
 * 请求体：{ phone: "13800138000", code: "123456", role: "owner" }
 * 响应：{ token: "jwt_token", user: { id, phone, role } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code, role = 'owner' } = body

    if (!phone || !code) {
      return NextResponse.json(
        { error: '请输入手机号和验证码' },
        { status: 400 }
      )
    }

    // 验证验证码
    const isValid = verifySmsCode(phone, code)
    if (!isValid) {
      return NextResponse.json(
        { error: '验证码错误或已过期' },
        { status: 401 }
      )
    }

    // 查找或创建用户
    const user = await findOrCreateUserByPhone(phone, role)

    // 生成 JWT token
    const secret = new TextEncoder().encode(
      process.env.BETTER_AUTH_SECRET || 'dev-secret-key-change-in-production'
    )

    const token = await new SignJWT({
      sub: user.id,
      phone: user.phone,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(secret)

    // 设置 cookie
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        credit_score: user.credit_score,
      },
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30天
      path: '/',
    })

    return response
  } catch (error) {
    console.error('验证码登录失败:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
