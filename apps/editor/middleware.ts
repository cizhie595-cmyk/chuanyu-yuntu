import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Next.js 中间件
 * 保护需要登录的路由，未登录时重定向到登录页
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 需要登录的路由
  const protectedRoutes = ['/market/orders']

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtected) {
    return NextResponse.next()
  }

  // 检查 auth token
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.BETTER_AUTH_SECRET || 'dev-secret-key-change-in-production'
    )
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    // token 无效，重定向到登录页
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set('auth_token', '', { maxAge: 0 })
    return response
  }
}

export const config = {
  matcher: ['/market/orders/:path*'],
}
