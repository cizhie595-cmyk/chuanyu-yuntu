'use client'

import { useCallback, useRef, useState } from 'react'

interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error'
  lastSyncedAt: string | null
  error: string | null
}

/**
 * 项目云同步 Hook
 *
 * 提供自动保存和手动同步功能：
 * - 场景变更后自动延迟同步（防抖 3 秒）
 * - 手动触发立即同步
 * - 同步状态反馈
 */
export function useCloudSync(projectId: string | null) {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    lastSyncedAt: null,
    error: null,
  })
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * 执行同步
   */
  const doSync = useCallback(
    async (sceneData: unknown, thumbnailUrl?: string) => {
      if (!projectId) return

      setSyncState((prev) => ({ ...prev, status: 'syncing', error: null }))

      try {
        const res = await fetch(`/api/projects/${projectId}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scene_data: sceneData,
            thumbnail_url: thumbnailUrl,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setSyncState({
            status: 'error',
            lastSyncedAt: null,
            error: data.error || '同步失败',
          })
          return false
        }

        setSyncState({
          status: 'synced',
          lastSyncedAt: data.updated_at || new Date().toISOString(),
          error: null,
        })
        return true
      } catch {
        setSyncState({
          status: 'error',
          lastSyncedAt: null,
          error: '网络错误，同步失败',
        })
        return false
      }
    },
    [projectId]
  )

  /**
   * 自动同步（防抖 3 秒）
   */
  const autoSync = useCallback(
    (sceneData: unknown, thumbnailUrl?: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(() => {
        doSync(sceneData, thumbnailUrl)
      }, 3000)
    },
    [doSync]
  )

  /**
   * 立即同步
   */
  const syncNow = useCallback(
    (sceneData: unknown, thumbnailUrl?: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      return doSync(sceneData, thumbnailUrl)
    },
    [doSync]
  )

  /**
   * 从云端加载项目
   */
  const loadFromCloud = useCallback(
    async () => {
      if (!projectId) return null

      try {
        const res = await fetch(`/api/projects/${projectId}/sync`)
        if (!res.ok) return null

        const data = await res.json()
        return data.scene || null
      } catch {
        return null
      }
    },
    [projectId]
  )

  return {
    syncState,
    autoSync,
    syncNow,
    loadFromCloud,
  }
}
