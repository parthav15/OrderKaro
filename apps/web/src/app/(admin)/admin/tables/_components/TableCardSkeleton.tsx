"use client"

export function TableCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white px-5 pt-5 pb-4">
      <div className="flex items-start gap-4">
        <div className="w-[88px] h-[88px] rounded-xl bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100 animate-pulse" />
        <div className="flex-1 space-y-2.5">
          <div className="h-2 w-32 rounded-full bg-neutral-100 animate-pulse" />
          <div className="h-6 w-24 rounded bg-neutral-100 animate-pulse" />
          <div className="h-3 w-40 rounded bg-neutral-100 animate-pulse" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5">
        <div className="flex-1 h-9 rounded-xl bg-neutral-100 animate-pulse" />
        <div className="w-9 h-9 rounded-xl bg-neutral-100 animate-pulse" />
        <div className="w-9 h-9 rounded-xl bg-neutral-100 animate-pulse" />
        <div className="w-9 h-9 rounded-full bg-neutral-100 animate-pulse" />
      </div>
    </div>
  )
}
