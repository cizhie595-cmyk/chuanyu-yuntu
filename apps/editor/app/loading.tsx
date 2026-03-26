export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
        <p className="text-sm text-neutral-400">加载中...</p>
      </div>
    </div>
  )
}
