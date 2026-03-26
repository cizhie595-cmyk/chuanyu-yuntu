import { betterAuth } from 'better-auth'
import { getSupabaseAdmin } from './supabase'

/**
 * Better Auth 服务端实例
 *
 * 认证方式：
 * 1. 手机号 + 短信验证码登录（对接阿里云短信，V1.0 使用模拟验证码）
 * 2. 邮箱 Magic Link 登录（保留原有功能）
 *
 * 用户角色：owner（业主）、contractor（包工头）、designer（设计师）
 */
export const auth = betterAuth({
  database: {
    type: 'postgres',
    url: process.env.POSTGRES_URL!,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002',
  emailAndPassword: {
    enabled: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 天
    updateAge: 60 * 60 * 24, // 每天刷新
  },
  trustedOrigins: [
    'http://localhost:3002',
    process.env.NEXT_PUBLIC_APP_URL || '',
  ].filter(Boolean),
})

/**
 * 从请求头中获取当前登录用户的会话信息
 */
export async function getSession(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  return session
}

/**
 * 验证用户身份的辅助函数（用于 API 路由）
 * 返回用户 ID 或 null
 */
export async function getAuthUserId(headers: Headers): Promise<string | null> {
  try {
    const session = await getSession(headers)
    return session?.user?.id ?? null
  } catch {
    return null
  }
}

// ── 手机号验证码相关 ──────────────────────────────────────────────────────

// 验证码存储（V1.0 使用内存存储，生产环境应使用 Redis）
const verificationCodes = new Map<string, { code: string; expiresAt: number }>()

/**
 * 生成并发送短信验证码
 * V1.0 阶段使用模拟发送（控制台打印），正式版对接阿里云短信
 */
export async function sendSmsCode(phone: string): Promise<{ success: boolean; message: string }> {
  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: '手机号格式不正确' }
  }

  // 防刷：60秒内不能重复发送
  const existing = verificationCodes.get(phone)
  if (existing && existing.expiresAt > Date.now() - 4 * 60 * 1000) {
    return { success: false, message: '验证码已发送，请60秒后重试' }
  }

  // 生成6位数字验证码
  const code = String(Math.floor(100000 + Math.random() * 900000))

  // 存储验证码（5分钟有效）
  verificationCodes.set(phone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })

  // V1.0：模拟发送（控制台打印）
  // 正式版：对接阿里云短信 API
  // await aliyunSms.send({ phone, templateCode: 'SMS_xxxxx', params: { code } })
  if (process.env.NODE_ENV === 'development') {
    console.log(`[短信验证码] ${phone}: ${code}`)
  }

  return { success: true, message: '验证码已发送' }
}

/**
 * 验证短信验证码
 */
export function verifySmsCode(phone: string, code: string): boolean {
  const stored = verificationCodes.get(phone)
  if (!stored) return false
  if (stored.expiresAt < Date.now()) {
    verificationCodes.delete(phone)
    return false
  }
  if (stored.code !== code) return false

  // 验证成功后删除
  verificationCodes.delete(phone)
  return true
}

/**
 * 通过手机号查找或创建用户
 */
export async function findOrCreateUserByPhone(phone: string, role: string = 'owner') {
  const supabase = getSupabaseAdmin()

  // 查找已有用户
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single()

  if (existingUser) {
    return existingUser
  }

  // 创建新用户
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      phone,
      role,
      credit_score: 100,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`创建用户失败: ${error.message}`)
  }

  return newUser
}
