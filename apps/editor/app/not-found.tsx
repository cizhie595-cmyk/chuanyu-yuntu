import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="text-6xl font-bold text-neutral-700">404</div>
        <div>
          <h2 className="text-lg font-semibold text-white">页面不存在</h2>
          <p className="mt-1 text-sm text-neutral-400">
            您访问的页面不存在或已被移除。
          </p>
        </div>
        <Link
          className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200"
          href="/"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}
