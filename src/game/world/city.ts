export interface Building {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  height: number
  color: number
  neon: boolean
  x: number
  z: number
  w: number
  d: number
}

const G = 72
const BLOCK = 26
const MAX_BLOCKS = 5

function mulberry(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PALETTE = [0x1e293b, 0x312e81, 0x1e1b4b, 0x0f172a, 0x2e1065, 0x164e63]
const NEON_PALETTE = [
  0x22d3ee, 0xf472b6, 0xa78bfa, 0xfacc15, 0x34d399, 0xf87171,
]

export const BUILDINGS: Building[] = []
export const NEON_STRIPS: { x: number; y: number; z: number; color: number }[] =
  []
export const STREET_LIGHTS: { x: number; z: number }[] = []

export const CITY_RADIUS = G * MAX_BLOCKS + G / 2

export function generateCity(): void {
  BUILDINGS.length = 0
  NEON_STRIPS.length = 0
  STREET_LIGHTS.length = 0

  const rand = mulberry(1337)
  const trackBlocks = new Set<string>([
    '0,-4',
    '2,-4',
    '2,-2',
    '4,-2',
    '4,2',
    '2,2',
    '2,4',
    '-2,4',
    '-2,2',
    '-4,2',
    '-4,-2',
    '-2,-2',
    '-2,-4',
  ])

  for (let bx = -MAX_BLOCKS; bx <= MAX_BLOCKS; bx++) {
    for (let bz = -MAX_BLOCKS; bz <= MAX_BLOCKS; bz++) {
      const key = `${bx},${bz}`
      if (trackBlocks.has(key)) continue
      const cx = bx * G
      const cz = bz * G
      const towers = 1 + Math.floor(rand() * 3)
      for (let t = 0; t < towers; t++) {
        const w = BLOCK * (0.34 + rand() * 0.4)
        const d = BLOCK * (0.34 + rand() * 0.4)
        const ox = (rand() - 0.5) * (BLOCK - w)
        const oz = (rand() - 0.5) * (BLOCK - d)
        const distFromCenter = Math.hypot(cx + ox, cz + oz)
        const height =
          14 + rand() * 26 * (1 + Math.max(0, 1 - distFromCenter / 300))
        const minX = cx + ox - w / 2
        const maxX = cx + ox + w / 2
        const minZ = cz + oz - d / 2
        const maxZ = cz + oz + d / 2
        const color = PALETTE[Math.floor(rand() * PALETTE.length)]
        const neon = rand() > 0.55
        BUILDINGS.push({
          minX,
          maxX,
          minZ,
          maxZ,
          height,
          color,
          neon,
          x: cx + ox,
          z: cz + oz,
          w,
          d,
        })
        if (neon) {
          const strip = NEON_PALETTE[Math.floor(rand() * NEON_PALETTE.length)]
          NEON_STRIPS.push({ x: cx + ox, y: height, z: cz + oz, color: strip })
        }
      }
      if (rand() > 0.3) {
        STREET_LIGHTS.push({ x: cx + G / 2, z: cz - G / 2 })
      }
    }
  }
}

export function collideWithBuildings(
  x: number,
  z: number,
  r: number,
): { pushX: number; pushZ: number } {
  let pushX = 0
  let pushZ = 0
  for (const b of BUILDINGS) {
    if (x < b.minX - r || x > b.maxX + r || z < b.minZ - r || z > b.maxZ + r)
      continue
    const cx = Math.max(b.minX, Math.min(b.maxX, x))
    const cz = Math.max(b.minZ, Math.min(b.maxZ, z))
    const dx = x - cx
    const dz = z - cz
    const d2 = dx * dx + dz * dz
    if (d2 > r * r) continue
    const d = Math.sqrt(d2) || 1
    const push = (r - d) / d
    pushX += dx * push
    pushZ += dz * push
  }
  return { pushX, pushZ }
}
