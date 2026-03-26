'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

type Role = 'owner' | 'contractor'
type Step = 'phone' | 'code'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('owner')
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState('')

  // ── 发送验证码 ──────────────────────────────────────────────────────────
  const handleSendCode = useCallback(async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的11位手机号码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '发送失败')
        return
      }

      setStep('code')
      // 60秒倒计时
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [phone])

  // ── 验证码登录 ──────────────────────────────────────────────────────────
  const handleLogin = useCallback(async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/sms/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, role }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '登录失败')
        return
      }

      // 登录成功，根据角色跳转
      if (role === 'contractor') {
        router.push('/market')
      } else {
        router.push('/')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [phone, code, role, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">川渝云图</h1>
          <p className="mt-2 text-sm text-gray-400">3D 乡村别墅智能设计平台</p>
        </div>

        {/* 登录卡片 */}
        <div className="rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur-lg">
          {/* 角色切换 */}
          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            <button
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                role === 'owner'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setRole('owner')}
              type="button"
            >
              我是业主
            </button>
            <button
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${
                role === 'contractor'
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setRole('contractor')}
              type="button"
            >
              我是包工头
            </button>
          </div>

          {/* 手机号输入 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-300" htmlFor="phone">
              手机号码
            </label>
            <input
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              disabled={step === 'code'}
              id="phone"
              inputMode="tel"
              maxLength={11}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, ''))
                setError('')
              }}
              placeholder="请输入11位手机号码"
              type="tel"
              value={phone}
            />
          </div>

          {/* 验证码输入 */}
          {step === 'code' && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-300" htmlFor="code">
                短信验证码
              </label>
              <div className="flex gap-3">
                <input
                  autoFocus
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  id="code"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, ''))
                    setError('')
                  }}
                  placeholder="6位验证码"
                  type="text"
                  value={code}
                />
                <button
                  className="shrink-0 rounded-xl bg-white/10 px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-white/20 disabled:opacity-50"
                  disabled={countdown > 0}
                  onClick={handleSendCode}
                  type="button"
                >
                  {countdown > 0 ? `${countdown}s` : '重新发送'}
                </button>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* 操作按钮 */}
          {step === 'phone' ? (
            <button
              className="w-full rounded-xl bg-blue-600 py-3.5 font-medium text-white shadow-lg transition-all hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || phone.length !== 11}
              onClick={handleSendCode}
              type="button"
            >
              {loading ? '发送中...' : '获取验证码'}
            </button>
          ) : (
            <button
              className={`w-full rounded-xl py-3.5 font-medium text-white shadow-lg transition-all disabled:opacity-50 ${
                role === 'contractor'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={loading || code.length !== 6}
              onClick={handleLogin}
              type="button"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          )}

          {/* 返回修改手机号 */}
          {step === 'code' && (
            <button
              className="mt-3 w-full text-center text-sm text-gray-400 hover:text-white"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError('')
              }}
              type="button"
            >
              修改手机号
            </button>
          )}
        </div>

        {/* 底部说明 */}
        <p className="mt-6 text-center text-xs text-gray-500">
          登录即表示同意
          <a className="text-blue-400 hover:underline" href="/terms">《服务条款》</a>
          和
          <a className="text-blue-400 hover:underline" href="/privacy">《隐私政策》</a>
        </p>
      </div>
    </div>
  )
}
