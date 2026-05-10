"use client"

import { useEffect, useState } from "react"

interface ScrollSpyOptions {
  rootMargin?: string
  threshold?: number | number[]
}

export function useScrollSpy(ids: string[], options?: ScrollSpyOptions): string {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "")
  const key = ids.join("|")

  useEffect(() => {
    if (typeof window === "undefined") return
    if (ids.length === 0) {
      setActiveId("")
      return
    }

    const visibility = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibility.set(entry.target.id, entry.intersectionRatio)
        }
        let bestId = ids[0]
        let bestRatio = -1
        for (const id of ids) {
          const ratio = visibility.get(id) ?? 0
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }
        if (bestRatio > 0) setActiveId(bestId)
      },
      {
        rootMargin: options?.rootMargin ?? "-30% 0% -55% 0%",
        threshold: options?.threshold ?? [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    )

    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [key, options?.rootMargin, options?.threshold])

  return activeId
}
