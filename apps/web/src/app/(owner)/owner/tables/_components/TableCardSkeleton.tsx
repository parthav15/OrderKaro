"use client"

export function TableCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 pt-5 pb-4">
      <div className="flex items-start gap-4">
        <div className="w-[88px] h-[88px] rounded-xl bg-gradient-to-br from-surface-elevated via-surface to-surface-elevated animate-pulse" />
        <div className="flex-1 space-y-2.5">
          <div className="h-2 w-32 rounded-full bg-surface-elevated animate-pulse" />
          <div className="h-6 w-24 rounded bg-surface-elevated animate-pulse" />
          <div className="h-3 w-40 rounded bg-surface-elevated animate-pulse" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <div className="flex-1 h-9 rounded-xl bg-surface-elevated animate-pulse" />
        <div className="w-9 h-9 rounded-xl bg-surface-elevated animate-pulse" />
        <div className="w-9 h-9 rounded-xl bg-surface-elevated animate-pulse" />
        <div className="w-9 h-9 rounded-full bg-surface-elevated animate-pulse" />
      </div>
    </div>
  )
}
