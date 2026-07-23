"use client"

import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

export function MenuSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="px-5 pt-12 pb-8">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-12 w-2/3 rounded-xl mt-3" />
        <Skeleton className="h-3 w-48 rounded-full mt-4" />
      </div>

      <div className="px-5 pb-3">
        <Skeleton className="h-10 w-full rounded-full" />
      </div>

      <div className="flex gap-2 px-5 pb-5">
        {[80, 100, 90, 110].map((w, i) => (
          <Skeleton key={i} className="h-7 rounded-full" style={{ width: w }} />
        ))}
      </div>

      <div className="px-5 mt-2 space-y-10">
        {[0, 1].map((s) => (
          <div key={s}>
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-9 w-44 rounded-xl mt-3" />
            <Skeleton className="h-px w-full mt-4" />
            <div className="mt-5 space-y-5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 py-2">
                  <Skeleton className="h-4 w-6 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                    <Skeleton className="h-7 w-20 rounded-full mt-2" />
                  </div>
                  <Skeleton className="h-20 w-20 rounded-2xl" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
