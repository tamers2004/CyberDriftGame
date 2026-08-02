import type { SaveData } from '../types'
import { CARS } from '../data/cars'

const KEY = 'cyberdrift.save.v1'

const DEFAULTS: SaveData = {
  unlockedCars: ['starter'],
  selectedCar: 'starter',
  playerName: 'DRIVER',
  leaderboard: [],
  bestDrift: 0,
  bestTime: 0,
  totalScore: 0,
  settings: {
    graphics: 'high',
    volume: 0.7,
    musicVolume: 0.5,
    cameraMode: 0,
  },
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEFAULTS)
    const parsed = JSON.parse(raw) as Partial<SaveData>
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings ?? {}) },
    }
  } catch {
    return structuredClone(DEFAULTS)
  }
}

export function persistSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // storage full or unavailable — fail silently
  }
}

export function carUnlocked(save: SaveData, unlockScore: number): boolean {
  if (unlockScore === 0) return true
  return save.totalScore >= unlockScore
}

export function unlockedCarsList(save: SaveData): string[] {
  return CARS.filter((c) => carUnlocked(save, c.unlockScore)).map((c) => c.id)
}
