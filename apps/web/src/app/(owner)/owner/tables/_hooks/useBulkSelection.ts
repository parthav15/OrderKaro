"use client"

import { useCallback, useMemo, useState } from "react"

export function useBulkSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setLastSelectedId(id)
  }, [])

  const toggleRange = useCallback(
    (id: string, ordered: string[]) => {
      if (!lastSelectedId) {
        toggle(id)
        return
      }
      const fromIdx = ordered.indexOf(lastSelectedId)
      const toIdx = ordered.indexOf(id)
      if (fromIdx === -1 || toIdx === -1) {
        toggle(id)
        return
      }
      const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
      const ids = ordered.slice(start, end + 1)
      setSelected((prev) => {
        const next = new Set(prev)
        ids.forEach((x) => next.add(x))
        return next
      })
      setLastSelectedId(id)
    },
    [lastSelectedId, toggle]
  )

  const selectMany = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((x) => next.add(x))
      return next
    })
  }, [])

  const deselectMany = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev)
      ids.forEach((x) => next.delete(x))
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setSelected(new Set())
    setLastSelectedId(null)
  }, [])

  const selectedIds = useMemo(() => Array.from(selected), [selected])

  return {
    selected,
    selectedIds,
    count: selected.size,
    isSelected,
    toggle,
    toggleRange,
    selectMany,
    deselectMany,
    clear,
  }
}
