import * as THREE from 'three'

const G = 72
const ROAD_HALF = 8

const CORE: [number, number][] = [
  [0, -4],
  [2, -4],
  [2, -2],
  [4, -2],
  [4, 2],
  [2, 2],
  [2, 4],
  [-2, 4],
  [-2, 2],
  [-4, 2],
  [-4, -2],
  [-2, -2],
  [-2, -4],
]

const CONTROL: THREE.Vector2[] = CORE.map(
  ([x, z]) => new THREE.Vector2(x * G, z * G),
)

interface TrackData {
  samples: THREE.Vector2[]
  cum: number[]
  length: number
}

function buildTrack(): TrackData {
  const curve = new THREE.CatmullRomCurve3(
    CONTROL.map((p) => new THREE.Vector3(p.x, 0, p.y)),
    true,
    'catmullrom',
    0.6,
  )
  const count = 900
  const samples: THREE.Vector2[] = []
  const cum: number[] = [0]
  for (let i = 0; i < count; i++) {
    const p = curve.getPoint(i / count)
    samples.push(new THREE.Vector2(p.x, p.z))
    if (i > 0) {
      cum.push(cum[i - 1] + samples[i].distanceTo(samples[i - 1]))
    }
  }
  return { samples, cum, length: cum[count - 1] }
}

export const TRACK: TrackData = buildTrack()

export interface TrackLookup {
  index: number
  dist: number
}

export function nearestOnTrack(x: number, z: number): TrackLookup {
  const { samples } = TRACK
  let best = 0
  let bestD = Infinity
  for (let i = 0; i < samples.length; i++) {
    const d = (x - samples[i].x) ** 2 + (z - samples[i].y) ** 2
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return { index: best, dist: Math.sqrt(bestD) }
}

export function pointAt(dist: number): THREE.Vector2 {
  const { samples, length } = TRACK
  let d = dist
  while (d < 0) d += length
  while (d >= length) d -= length
  const idx = Math.floor((d / length) * samples.length)
  return samples[Math.min(idx, samples.length - 1)].clone()
}

export function isOnRoad(x: number, z: number): boolean {
  return nearestOnTrack(x, z).dist < ROAD_HALF + 1
}

export function roadFactorAt(x: number, z: number): number {
  const { dist } = nearestOnTrack(x, z)
  if (dist < ROAD_HALF) return 1
  if (dist > ROAD_HALF + 14) return 0.35
  return 1 - ((dist - ROAD_HALF) / 14) * 0.65
}

export interface StartPoint {
  x: number
  z: number
  heading: number
}

export function startPosition(index: number, total: number): StartPoint {
  const gap = 16
  const base = TRACK.length * 0.985
  const at = base - gap * index - 12
  const p = pointAt(at)
  const ahead = pointAt(at + 10)
  const heading = Math.atan2(ahead.x - p.x, ahead.y - p.y)
  void total
  return { x: p.x, z: p.y, heading }
}
