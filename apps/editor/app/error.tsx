'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('页面错误:', error)
  }, [error])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="text-4xl">😵</div>
        <div>
          <h2 className="text-lg font-semibold text-white">页面出错了</h2>
          <p className="mt-1 text-sm text-neutral-400">
            抱歉，页面遇到了意外错误。请尝试刷新页面。
          </p>
        </div>
        <button
          className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
          onClick={reset}
        >
          重新加载
        </button>
      </div>
    </div>
  )
}
