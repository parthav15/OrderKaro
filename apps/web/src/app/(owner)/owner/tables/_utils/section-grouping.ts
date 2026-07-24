export type GroupedSection<T> = {
  section: string
  displaySection: string
  items: T[]
}

const UNGROUPED_KEY = "__ungrouped__"
const UNGROUPED_LABEL = "Other"

export function groupBySection<T extends { section: string | null }>(
  items: T[]
): GroupedSection<T>[] {
  const buckets = new Map<string, T[]>()

  for (const item of items) {
    const key = item.section?.trim() || UNGROUPED_KEY
    const list = buckets.get(key) ?? []
    list.push(item)
    buckets.set(key, list)
  }

  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => {
    if (a === UNGROUPED_KEY) return 1
    if (b === UNGROUPED_KEY) return -1
    return a.localeCompare(b, undefined, { numeric: true })
  })

  return sortedKeys.map((key) => ({
    section: key,
    displaySection: key === UNGROUPED_KEY ? UNGROUPED_LABEL : key,
    items: buckets.get(key)!,
  }))
}

export function uniqueSections<T extends { section: string | null }>(
  items: T[]
): string[] {
  const set = new Set<string>()
  for (const item of items) {
    const trimmed = item.section?.trim()
    if (trimmed) set.add(trimmed)
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}
