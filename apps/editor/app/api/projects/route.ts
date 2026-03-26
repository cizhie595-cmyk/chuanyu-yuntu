import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase'
import { verifyToken } from '../../../lib/auth-utils'

/**
 * GET /api/projects
 * 获取当前用户的项目列表
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

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, thumbnail_url, share_code, is_private, created_at, updated_at')
      .eq('user_id', payload.sub)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('获取项目列表失败:', error)
      return NextResponse.json(
        { error: '获取项目列表失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: projects || [],
    })
  } catch (error) {
    console.error('项目列表API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/projects
 * 创建新项目
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyToken(request)
    if (!payload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const title = body.title || '未命名方案'

    const supabase = getSupabaseAdmin()

    // 生成分享码
    const shareCode = generateShareCode()

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: payload.sub,
        title,
        share_code: shareCode,
        is_private: false,
      })
      .select('id, title, share_code, created_at')
      .single()

    if (error) {
      console.error('创建项目失败:', error)
      return NextResponse.json(
        { error: '创建项目失败' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, project },
      { status: 201 }
    )
  } catch (error) {
    console.error('创建项目API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
