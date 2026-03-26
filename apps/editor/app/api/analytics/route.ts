import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * 事件埋点收集 API
 *
 * 接收前端批量发送的埋点事件，存储到 Supabase analytics_events 表。
 * 支持 POST 请求体和 sendBeacon 的 Blob 格式。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const events = body.events

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: '缺少事件数据' }, { status: 400 })
    }

    // 从 Authorization header 或 body.token 获取用户 ID
    let userId: string | null = null
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '') || body.token

    if (token) {
      try {
        const { jwtVerify } = await import('jose')
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret')
        const { payload } = await jwtVerify(token, secret)
        userId = (payload.userId as string) || null
      } catch {
        // JWT 无效，继续匿名记录
      }
    }

    const supabase = createClient()

    // 批量插入事件
    const rows = events.map((event: any) => ({
      event_name: event.event,
      properties: event.properties || {},
      user_id: userId,
      client_timestamp: event.timestamp || new Date().toISOString(),
      user_agent: request.headers.get('User-Agent') || '',
      ip: request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() || '',
    }))

    const { error } = await supabase.from('analytics_events').insert(rows)

    if (error) {
      // 表不存在时静默失败（V1.0 可能尚未建表）
      if (error.code === '42P01') {
        console.warn('[analytics] analytics_events 表不存在，跳过存储')
        return NextResponse.json({ success: true, stored: false })
      }
      console.error('[analytics] 存储失败:', error)
      return NextResponse.json({ error: '存储失败' }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: rows.length })
  } catch (error) {
    console.error('[analytics] 请求处理失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
