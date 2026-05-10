export interface PointLike {
  posX: number | null
  posY: number | null
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export const NODE_WIDTH = 144
export const NODE_HEIGHT = 144
export const GRID_SIZE = 32
export const MIN_SCALE = 0.25
export const MAX_SCALE = 4
export const FIT_PADDING = 80

export function placedItems<T extends PointLike>(items: T[]): T[] {
  return items.filter((t) => t.posX !== null && t.posY !== null)
}

export function unplacedItems<T extends PointLike>(items: T[]): T[] {
  return items.filter((t) => t.posX === null || t.posY === null)
}

export function computeBounds(items: PointLike[]): Bounds | null {
  const placed = placedItems(items)
  if (placed.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const t of placed) {
    minX = Math.min(minX, t.posX!)
    minY = Math.min(minY, t.posY!)
    maxX = Math.max(maxX, t.posX! + NODE_WIDTH)
    maxY = Math.max(maxY, t.posY! + NODE_HEIGHT)
  }
  return { minX, minY, maxX, maxY }
}

export function snapToGrid(value: number, grid = GRID_SIZE): number {
  return Math.round(value / grid) * grid
}
