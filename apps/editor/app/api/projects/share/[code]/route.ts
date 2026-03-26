import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../../lib/supabase'

/**
 * GET /api/projects/share/:code
 * 通过分享码获取项目数据（H5 预览页使用，无需登录）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code || code.length < 4) {
      return NextResponse.json(
        { error: '无效的分享码' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: project, error } = await supabase
      .from('projects')
      .select('id, title, scene_data, thumbnail_url, share_code, is_private')
      .eq('share_code', code)
      .single()

    if (error || !project) {
      return NextResponse.json(
        { error: '方案不存在或链接已失效' },
        { status: 404 }
      )
    }

    if (project.is_private) {
      return NextResponse.json(
        { error: '该方案为私有方案，无法预览' },
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
    console.error('获取分享项目API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
