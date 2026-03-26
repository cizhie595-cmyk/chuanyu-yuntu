import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * POST /api/projects/:id/sync
 * 同步场景数据到云端
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

    // TODO: 从 Better Auth 验证用户身份
    // const session = await auth.api.getSession({ headers: request.headers })
    // if (!session) {
    //   return NextResponse.json({ error: '请先登录' }, { status: 401 })
    // }

    const supabase = getSupabaseAdmin()

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
 * 获取项目场景数据（用于H5预览页加载）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

    const supabase = getSupabaseAdmin()

    const { data: project, error } = await supabase
      .from('projects')
      .select('id, title, scene_data, thumbnail_url, share_code, is_private')
      .eq('id', projectId)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      )
    }

    if (project.is_private) {
      // TODO: 验证访问权限
      return NextResponse.json(
        { error: '该项目为私有项目' },
        { status: 403 }
      )
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
