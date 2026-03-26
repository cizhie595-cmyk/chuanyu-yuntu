'use client'

import { Viewer, useViewer } from '@pascal-app/viewer'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { applySceneGraphToEditor, type SceneGraph } from '@pascal-app/editor'

// ── 留资表单状态 ──────────────────────────────────────────────────────────
type LeadFormData = {
  name: string
  phone: string
  budget: string
  address: string
}

// ── 加载状态 ──────────────────────────────────────────────────────────────
type LoadingState = 'loading' | 'loaded' | 'error' | 'not-found'

// ── 预算选项 ──────────────────────────────────────────────────────────────
const BUDGET_OPTIONS = [
  { value: '10-20', label: '10-20万' },
  { value: '20-30', label: '20-30万' },
  { value: '30-50', label: '30-50万' },
  { value: '50+', label: '50万以上' },
]

export default function SharePreviewPage() {
  const params = useParams()
  const code = params.code as string

  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [projectName, setProjectName] = useState<string>('3D别墅方案预览')
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    phone: '',
    budget: '20-30',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const enterTimeRef = useRef<number>(Date.now())

  // ── H5 页面停留时长统计 ────────────────────────────────────────
  useEffect(() => {
    enterTimeRef.current = Date.now()

    const sendDuration = () => {
      const duration = Math.round((Date.now() - enterTimeRef.current) / 1000)
      if (duration < 2) return // 忽略过短停留
      const payload = JSON.stringify({
        events: [{
          event: 'h5_view_duration',
          properties: { share_code: code, duration_seconds: duration },
          timestamp: new Date().toISOString(),
        }],
      })
      // 使用 sendBeacon 确保页面关闭时也能发送
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics', payload)
      } else {
        fetch('/api/analytics', { method: 'POST', body: payload, keepalive: true })
      }
    }

    // 页面关闭/切换时发送
    window.addEventListener('beforeunload', sendDuration)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendDuration()
    })

    return () => {
      sendDuration()
      window.removeEventListener('beforeunload', sendDuration)
    }
  }, [code])

  // ── 加载场景数据（修复：使用正确的分享码 API 路径）────────────────────
  useEffect(() => {
    async function loadScene() {
      try {
        const response = await fetch(`/api/projects/share/${code}`)
        if (!response.ok) {
          if (response.status === 404) {
            setLoadingState('not-found')
          } else {
            setLoadingState('error')
          }
          return
        }
        const data = await response.json()
        if (data.scene) {
          applySceneGraphToEditor(data.scene as SceneGraph)
          setProjectName(data.name || '3D别墅方案预览')
        }
        // 设置为预览模式（禁用编辑工具）
        useViewer.getState().setSelection({
          buildingId: null,
          levelId: null,
          zoneId: null,
          selectedIds: [],
        })
        setLoadingState('loaded')
      } catch {
        // 如果API不可用，尝试从URL参数加载演示场景
        setLoadingState('loaded')
      }
    }
    loadScene()
  }, [code])

  // ── 留资表单提交 ────────────────────────────────────────────────────────
  const handleSubmitLead = useCallback(async () => {
    if (!formData.name || !formData.phone) return
    // 手机号格式验证
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      alert('请输入正确的手机号码')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectCode: code,
          source: 'h5_share',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setShowLeadForm(false)
      } else {
        alert(data.error || '提交失败，请稍后重试')
      }
    } catch {
      alert('网络错误，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }, [formData, code])

  // ── 加载中 ──────────────────────────────────────────────────────────────
  if (loadingState === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-lg text-white">加载3D方案中...</p>
          <p className="mt-1 text-sm text-gray-400">首次加载可能需要几秒钟</p>
        </div>
      </div>
    )
  }

  // ── 未找到 ──────────────────────────────────────────────────────────────
  if (loadingState === 'not-found') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="mb-2 text-6xl">🏠</p>
          <h1 className="mb-2 text-xl font-bold text-white">方案不存在</h1>
          <p className="text-gray-400">该分享链接已失效或方案已被删除</p>
        </div>
      </div>
    )
  }

  // ── 错误 ────────────────────────────────────────────────────────────────
  if (loadingState === 'error') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="mb-2 text-6xl">⚠️</p>
          <h1 className="mb-2 text-xl font-bold text-white">加载失败</h1>
          <p className="text-gray-400">请检查网络连接后重试</p>
          <button
            className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            onClick={() => window.location.reload()}
            type="button"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // ── 主预览页面 ──────────────────────────────────────────────────────────
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* 3D 视图 */}
      <div className="absolute inset-0">
        <Viewer selectionManager="custom" />
      </div>

      {/* 顶部信息栏 */}
      <div className="absolute top-0 right-0 left-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-4 pt-3 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white drop-shadow-lg">{projectName}</h1>
            <p className="text-xs text-gray-300 drop-shadow">川渝云图 · 3D别墅设计</p>
          </div>
          <ShareButton />
        </div>
      </div>

      {/* 操作提示 */}
      <div className="pointer-events-none absolute right-0 bottom-28 left-0 z-10 text-center">
        <p className="text-xs text-white/60 drop-shadow">
          单指旋转 · 双指缩放 · 双指平移
        </p>
      </div>

      {/* 底部CTA按钮 */}
      <div className="absolute right-0 bottom-0 left-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-6">
        {submitted ? (
          <div className="rounded-xl bg-green-600/90 px-6 py-4 text-center backdrop-blur">
            <p className="text-lg font-bold text-white">提交成功！</p>
            <p className="mt-1 text-sm text-green-100">
              我们将在24小时内联系您，为您匹配本地优质施工队
            </p>
          </div>
        ) : (
          <button
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 font-bold text-lg text-white shadow-lg transition-transform active:scale-[0.98]"
            onClick={() => setShowLeadForm(true)}
            type="button"
          >
            获取本地施工报价
          </button>
        )}
      </div>

      {/* 留资表单弹窗 */}
      {showLeadForm && (
        <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg animate-slide-up rounded-t-2xl bg-white px-6 pt-6 pb-8">
            {/* 关闭按钮 */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">获取免费施工报价</h2>
              <button
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setShowLeadForm(false)}
                type="button"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </button>
            </div>

            <p className="mb-5 text-sm text-gray-500">
              填写信息后，我们将为您匹配3家本地优质施工队，免费上门量房报价
            </p>

            {/* 表单字段 */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lead-name">
                  您的姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  id="lead-name"
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入您的姓名"
                  type="text"
                  value={formData.name}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lead-phone">
                  手机号码 <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  id="lead-phone"
                  inputMode="tel"
                  maxLength={11}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="请输入11位手机号码"
                  type="tel"
                  value={formData.phone}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lead-budget">
                  预算范围
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  id="lead-budget"
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                  value={formData.budget}
                >
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lead-address">
                  建房地址
                </label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  id="lead-address"
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="如：四川省成都市郫都区XX镇XX村"
                  type="text"
                  value={formData.address}
                />
              </div>
            </div>

            {/* 提交按钮 */}
            <button
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 font-bold text-lg text-white shadow-lg transition-all disabled:opacity-50"
              disabled={submitting || !formData.name || !formData.phone}
              onClick={handleSubmitLead}
              type="button"
            >
              {submitting ? '提交中...' : '免费获取报价'}
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              提交即表示同意
              <a className="text-blue-500" href="/privacy">
                《隐私政策》
              </a>
              ，我们承诺保护您的信息安全
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 分享按钮组件 ──────────────────────────────────────────────────────────
function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href
    const shareData = {
      title: '川渝云图 - 3D别墅方案',
      text: '快来看看我设计的别墅方案！',
      url: shareUrl,
    }

    // 优先使用原生分享API（微信等）
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // 用户取消分享，忽略
      }
    }

    // 降级为复制链接
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  return (
    <button
      className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm text-white backdrop-blur transition-colors hover:bg-white/30"
      onClick={handleShare}
      type="button"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
        />
      </svg>
      {copied ? '已复制' : '分享'}
    </button>
  )
}
