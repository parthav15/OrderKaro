import { GRID_SIZE, NODE_WIDTH, NODE_HEIGHT } from "./bounds"

const COLS = 6

export function placeholderPosition(index: number): { posX: number; posY: number } {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return {
    posX: col * (NODE_WIDTH + GRID_SIZE * 1.5),
    posY: row * (NODE_HEIGHT + GRID_SIZE * 1.5),
  }
}
