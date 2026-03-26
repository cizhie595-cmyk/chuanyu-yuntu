import { jwtVerify, type JWTPayload } from 'jose'
import { NextRequest } from 'next/server'

interface AuthPayload extends JWTPayload {
  sub: string
  phone: string
  role: string
}

/**
 * 从请求中提取并验证 JWT token
 * 优先从 cookie 读取，其次从 Authorization header 读取
 */
export async function verifyToken(request: NextRequest): Promise<AuthPayload | null> {
  try {
    // 优先从 cookie 获取
    let token = request.cookies.get('auth_token')?.value

    // 其次从 Authorization header 获取
    if (!token) {
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7)
      }
    }

    if (!token) return null

    const secret = new TextEncoder().encode(
      process.env.BETTER_AUTH_SECRET || 'dev-secret-key-change-in-production'
    )

    const { payload } = await jwtVerify(token, secret)
    return payload as AuthPayload
  } catch {
    return null
  }
}

/**
 * 要求用户必须登录的辅助函数
 * 返回用户 ID，未登录时抛出错误
 */
export async function requireAuth(request: NextRequest): Promise<AuthPayload> {
  const payload = await verifyToken(request)
  if (!payload) {
    throw new Error('UNAUTHORIZED')
  }
  return payload
}
