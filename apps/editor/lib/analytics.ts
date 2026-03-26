/**
 * 川渝云图 事件埋点系统
 *
 * PRD 7.3 关键事件：
 * - project_created：创建项目
 * - share_link_generated：生成分享链接
 * - h5_viewed：H5预览页浏览（记录停留时长）
 * - lead_submitted：提交线索
 * - lead_purchased：购买线索
 *
 * V1.0 阶段将事件发送到后端 API 存储到 Supabase。
 * V2.0 可对接第三方分析平台（如友盟、神策）。
 */

export interface AnalyticsEvent {
  /** 事件名称 */
  event: string
  /** 事件属性 */
  properties?: Record<string, string | number | boolean | null>
  /** 用户 ID（可选，后端从 JWT 解析） */
  userId?: string
  /** 时间戳 */
  timestamp?: string
}

/** 事件队列，用于批量发送 */
let eventQueue: AnalyticsEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

const FLUSH_INTERVAL = 5000 // 5秒批量发送
const MAX_QUEUE_SIZE = 20 // 队列满20条立即发送

/**
 * 记录一个埋点事件
 */
export function trackEvent(event: string, properties?: Record<string, string | number | boolean | null>) {
  const analyticsEvent: AnalyticsEvent = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  }

  // 开发环境打印到控制台
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event, properties)
  }

  eventQueue.push(analyticsEvent)

  // 队列满时立即发送
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flushEvents()
    return
  }

  // 设置定时发送
  if (!flushTimer) {
    flushTimer = setTimeout(flushEvents, FLUSH_INTERVAL)
  }
}

/**
 * 批量发送事件到后端
 */
async function flushEvents() {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (eventQueue.length === 0) return

  const events = [...eventQueue]
  eventQueue = []

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    await fetch('/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ events }),
    })
  } catch {
    // 发送失败，将事件放回队列（最多保留100条）
    eventQueue = [...events, ...eventQueue].slice(0, 100)
  }
}

/**
 * 页面卸载前发送剩余事件
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventQueue.length > 0) {
      const events = [...eventQueue]
      eventQueue = []
      // 使用 sendBeacon 确保页面关闭前发送
      const token = localStorage.getItem('auth_token')
      const blob = new Blob(
        [JSON.stringify({ events, token })],
        { type: 'application/json' },
      )
      navigator.sendBeacon('/api/analytics', blob)
    }
  })
}

// ── 便捷方法 ──────────────────────────────────────────────────────────────

/** 项目创建 */
export function trackProjectCreated(projectId: string, title: string) {
  trackEvent('project_created', { project_id: projectId, title })
}

/** 生成分享链接 */
export function trackShareLinkGenerated(projectId: string, shareCode: string) {
  trackEvent('share_link_generated', { project_id: projectId, share_code: shareCode })
}

/** H5 预览页浏览 */
export function trackH5Viewed(shareCode: string, durationMs: number) {
  trackEvent('h5_viewed', {
    share_code: shareCode,
    duration_ms: durationMs,
    duration_seconds: Math.round(durationMs / 1000),
  })
}

/** 提交线索 */
export function trackLeadSubmitted(leadId: string, budgetLevel: number) {
  trackEvent('lead_submitted', { lead_id: leadId, budget_level: budgetLevel })
}

/** 购买线索 */
export function trackLeadPurchased(leadId: string, orderId: string, amount: number) {
  trackEvent('lead_purchased', { lead_id: leadId, order_id: orderId, amount })
}
