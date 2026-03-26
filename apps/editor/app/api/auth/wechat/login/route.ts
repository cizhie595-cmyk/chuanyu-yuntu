import { createClient } from '@/lib/supabase'
import { SignJWT } from 'jose'
import { NextResponse } from 'next/server'

const WECHAT_APPID = process.env.WECHAT_APPID || ''
const WECHAT_SECRET = process.env.WECHAT_SECRET || ''
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

/**
 * 微信登录 API
 *
 * 流程：
 * 1. 前端通过微信 SDK 获取 code
 * 2. 后端用 code 换取 access_token + openid
 * 3. 查找或创建用户
 * 4. 签发 JWT
 */
export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: '缺少微信授权码' }, { status: 400 })
    }

    // ── 用 code 换取 access_token 和 openid ──────────────────────────────
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`

    const tokenRes = await fetch(tokenUrl)
    const tokenData = await tokenRes.json()

    if (tokenData.errcode) {
      console.error('[wechat] 获取 access_token 失败:', tokenData)
      return NextResponse.json(
        { error: '微信授权失败', detail: tokenData.errmsg },
        { status: 401 },
      )
    }

    const { access_token, openid } = tokenData

    // ── 获取微信用户信息 ──────────────────────────────────────────────────
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`

    const userInfoRes = await fetch(userInfoUrl)
    const userInfo = await userInfoRes.json()

    const nickname = userInfo.nickname || '微信用户'
    const avatarUrl = userInfo.headimgurl || ''

    // ── 查找或创建用户 ──────────────────────────────────────────────────
    const supabase = createClient()

    // 先查找是否已有该 openid 的用户
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wechat_openid', openid)
      .single()

    let user = existingUser

    if (!user) {
      // 创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          wechat_openid: openid,
          nickname,
          avatar_url: avatarUrl,
          role: 'owner', // 默认为业主角色
          credit_score: 100,
        })
        .select()
        .single()

      if (createError) {
        console.error('[wechat] 创建用户失败:', createError)
        return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
      }

      user = newUser
    } else {
      // 更新用户昵称和头像
      await supabase
        .from('users')
        .update({ nickname, avatar_url: avatarUrl })
        .eq('id', user.id)
    }

    // ── 签发 JWT ────────────────────────────────────────────────────────
    const secret = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({
      userId: user.id,
      phone: user.phone || '',
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname || nickname,
        avatar_url: user.avatar_url || avatarUrl,
        role: user.role,
        credit_score: user.credit_score,
      },
    })
  } catch (error) {
    console.error('[wechat] 登录异常:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
