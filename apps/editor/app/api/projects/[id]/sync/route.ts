import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'
import { verifyToken } from '../../../../../lib/auth-utils'

/**
 * POST /api/projects/:id/sync
 * 同步场景数据到云端（需要登录）
 *
 * 请求体：
 * {
 *   scene_data: SceneGraph  - 完整的场景图数据
 *   thumbnail_url?: string  - 缩略图URL（可选）
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { scene_data, thumbnail_url } = body

    if (!scene_data) {
      return NextResponse.json(
        { error: '缺少场景数据' },
        { status: 400 }
      )
    }

    // ── 身份验证 ────────────────────────────────────────────────────────
    const payload = await verifyToken(request)
    if (!payload) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    const userId = payload.sub
    const supabase = getSupabaseAdmin()

    // ── 验证项目归属权 ──────────────────────────────────────────────────
    const { data: project } = await supabase
      .from('projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (project && project.user_id !== userId) {
      return NextResponse.json(
        { error: '无权操作此项目' },
        { status: 403 }
      )
    }

    // ── 如果项目不存在，创建新项目 ──────────────────────────────────────
    if (!project) {
      const shareCode = generateShareCode()
      const { error: createError } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          user_id: userId,
          title: '未命名方案',
          scene_data,
          thumbnail_url: thumbnail_url || null,
          share_code: shareCode,
          is_private: false,
        })

      if (createError) {
        console.error('创建项目失败:', createError)
        return NextResponse.json(
          { error: '创建项目失败，请稍后重试' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        created: true,
        share_code: shareCode,
        updated_at: new Date().toISOString(),
      })
    }

    // ── 更新项目场景数据 ────────────────────────────────────────────────
    const updateData: Record<string, unknown> = {
      scene_data,
      updated_at: new Date().toISOString(),
    }

    if (thumbnail_url) {
      updateData.thumbnail_url = thumbnail_url
    }

    const { error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)

    if (error) {
      console.error('同步场景数据失败:', error)
      return NextResponse.json(
        { error: '同步失败，请稍后重试' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('项目同步API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/projects/:id/sync
 * 获取项目场景数据（公开项目无需登录，私有项目需验证权限）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const supabase = getSupabaseAdmin()

    const { data: project, error } = await supabase
      .from('projects')
      .select('id, user_id, title, scene_data, thumbnail_url, share_code, is_private')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }

    // ── 私有项目权限验证 ────────────────────────────────────────────────
    if (project.is_private) {
      const payload = await verifyToken(request)
      if (!payload || payload.sub !== project.user_id) {
        return NextResponse.json(
          { error: '该项目为私有项目，无权访问' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      id: project.id,
      name: project.title,
      scene: project.scene_data,
      thumbnail: project.thumbnail_url,
      share_code: project.share_code,
    })
  } catch (error) {
    console.error('获取项目API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

/**
 * 生成8位随机分享码
 */
function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
