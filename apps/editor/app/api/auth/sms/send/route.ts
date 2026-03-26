import { NextRequest, NextResponse } from 'next/server'
import { sendSmsCode } from '../../../../../lib/auth'

/**
 * POST /api/auth/sms/send
 * 发送短信验证码
 *
 * 请求体：{ phone: "13800138000" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: '请输入手机号' },
        { status: 400 }
      )
    }

    const result = await sendSmsCode(phone)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 429 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (error) {
    console.error('发送验证码失败:', error)
    return NextResponse.json(
      { error: '发送失败，请稍后重试' },
      { status: 500 }
    )
  }
}
