'use client'

import { useFrame } from '@react-three/fiber'
import { useCallback, useRef } from 'react'

/**
 * GPU 性能降级检测器
 *
 * 在 Canvas 内部运行，持续监测帧率。
 * 当连续 5 秒帧率低于 15fps 时，调用 onDegrade 回调通知外层卸载 Canvas。
 */
export function GPUFallbackMonitor({ onDegrade }: { onDegrade: () => void }) {
  const lowFpsStart = useRef<number | null>(null)
  const frameCount = useRef(0)
  const elapsed = useRef(0)
  const hasFired = useRef(false)

  const checkPerformance = useCallback(
    (fps: number, now: number) => {
      if (hasFired.current) return

      if (fps < 15) {
        if (lowFpsStart.current === null) {
          lowFpsStart.current = now
        } else if (now - lowFpsStart.current >= 5) {
          // 连续 5 秒低于 15fps，触发降级
          hasFired.current = true
          onDegrade()
        }
      } else {
        // 帧率恢复，重置计时
        lowFpsStart.current = null
      }
    },
    [onDegrade],
  )

  useFrame(({ clock }) => {
    frameCount.current++
    const now = clock.elapsedTime
    const dt = now - elapsed.current

    if (dt >= 1) {
      const fps = Math.round(frameCount.current / dt)
      checkPerformance(fps, now)
      frameCount.current = 0
      elapsed.current = now
    }
  })

  return null
}

/**
 * 检测当前浏览器是否支持 WebGPU 或 WebGL
 * 在 Canvas 外部调用，用于决定是否渲染 3D 场景
 */
export function checkGPUSupport(): {
  webgpu: boolean
  webgl2: boolean
  webgl1: boolean
  supported: boolean
} {
  if (typeof window === 'undefined') {
    return { webgpu: false, webgl2: false, webgl1: false, supported: false }
  }

  const webgpu = 'gpu' in navigator
  let webgl2 = false
  let webgl1 = false

  try {
    const canvas = document.createElement('canvas')
    webgl2 = !!canvas.getContext('webgl2')
    webgl1 = !!canvas.getContext('webgl')
  } catch {
    // 忽略
  }

  return {
    webgpu,
    webgl2,
    webgl1,
    supported: webgpu || webgl2 || webgl1,
  }
}

/**
 * 2D 降级提示组件
 * 当 GPU 不可用或性能过低时显示
 */
export function GPUFallbackUI({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900 p-8 text-white">
      <div className="max-w-md text-center">
        <svg
          className="mx-auto mb-6 h-16 w-16 text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h2 className="mb-3 text-xl font-bold">3D 渲染不可用</h2>
        <p className="mb-2 text-sm text-gray-300">
          您的设备不支持 WebGPU/WebGL，或 GPU 性能不足以流畅运行 3D 编辑器。
        </p>
        <p className="mb-6 text-sm text-gray-400">
          建议使用最新版 Chrome、Edge 或 Safari 浏览器，并确保已启用硬件加速。
        </p>
        <div className="flex items-center justify-center gap-3">
          {onRetry && (
            <button
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-400"
              onClick={onRetry}
              type="button"
            >
              重试加载
            </button>
          )}
          <a
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-800"
            href="/"
          >
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
}
