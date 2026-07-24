"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export type TablesViewMode = "grid" | "list" | "map"
export type TablesSortMode = "natural" | "recent" | "active"
export type MapMode = "operations" | "edit"

export interface TablesUrlState {
  view: TablesViewMode
  sort: TablesSortMode
  section: string | null
  query: string
  floor: string | null
  mapMode: MapMode
  snap: boolean
}

const DEFAULTS: TablesUrlState = {
  view: "grid",
  sort: "natural",
  section: null,
  query: "",
  floor: null,
  mapMode: "operations",
  snap: false,
}

function readState(params: URLSearchParams): TablesUrlState {
  const view = (params.get("view") as TablesViewMode | null) ?? DEFAULTS.view
  const sort = (params.get("sort") as TablesSortMode | null) ?? DEFAULTS.sort
  const section = params.get("section")
  const query = params.get("q") ?? ""
  const floor = params.get("floor")
  const mapMode = (params.get("mode") as MapMode | null) ?? DEFAULTS.mapMode
  const snap = params.get("snap") === "1"
  return {
    view: ["grid", "list", "map"].includes(view) ? view : "grid",
    sort: ["natural", "recent", "active"].includes(sort) ? sort : "natural",
    section: section || null,
    query,
    floor: floor || null,
    mapMode: mapMode === "edit" ? "edit" : "operations",
    snap,
  }
}

export function useTablesUrlState() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [state, setState] = useState<TablesUrlState>(() =>
    readState(new URLSearchParams(searchParams.toString()))
  )

  useEffect(() => {
    setState(readState(new URLSearchParams(searchParams.toString())))
  }, [searchParams])

  const update = useCallback(
    (next: Partial<TablesUrlState>) => {
      const merged = { ...state, ...next }
      const params = new URLSearchParams()
      if (merged.view !== DEFAULTS.view) params.set("view", merged.view)
      if (merged.sort !== DEFAULTS.sort) params.set("sort", merged.sort)
      if (merged.section) params.set("section", merged.section)
      if (merged.query.trim()) params.set("q", merged.query.trim())
      if (merged.floor) params.set("floor", merged.floor)
      if (merged.mapMode !== DEFAULTS.mapMode) params.set("mode", merged.mapMode)
      if (merged.snap) params.set("snap", "1")
      const qs = params.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [pathname, router, state]
  )

  return { state, update }
}
