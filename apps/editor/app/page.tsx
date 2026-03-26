'use client'

import { Editor } from '@pascal-app/editor'
import { useCallback, useEffect, useState } from 'react'
import { useCloudSync } from '../lib/use-cloud-sync'

interface User {
  id: string
  phone: string
  role: string
}

interface Project {
  id: string
  name: string
  share_code: string
  updated_at: string
}

/**
 * 首页编辑器
 *
 * - 未登录用户：使用 localStorage 本地存储（projectId = "local-editor"）
 * - 已登录用户：自动获取/创建云端项目，通过 onSave/onLoad 实现云同步
 */
export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 获取当前用户信息
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  // 登录用户自动获取或创建默认项目
  useEffect(() => {
    if (!user) return

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '我的设计' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.id) {
          setProject(data)
        }
      })
      .catch(() => {})
  }, [user])

  const projectId = project?.id || 'local-editor'
  const { autoSync, loadFromCloud } = useCloudSync(project?.id || null)

  // 云端加载回调
  const handleLoad = useCallback(async () => {
    if (!project) return null
    return await loadFromCloud()
  }, [project, loadFromCloud])

  // 云端保存回调
  const handleSave = useCallback(
    async (scene: unknown) => {
      if (!project) return
      autoSync(scene)
    },
    [project, autoSync]
  )

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-neutral-950">
        <div className="text-neutral-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen">
      <Editor
        projectId={projectId}
        {...(user && project
          ? {
              onLoad: handleLoad,
              onSave: handleSave,
            }
          : {})}
      />
    </div>
  )
}
