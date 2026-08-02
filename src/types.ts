import type { ReactNode } from 'react'

export type Screen = 'menu' | 'garage' | 'race' | 'results'

export interface VehicleStats {
  id: string
  name: string
  tier: string
  topSpeed: number
  accel: number
  grip: number
  handling: number
  nitroCapacity: number
  weight: number
  unlockScore: number
  bodyColor: string
  glowColor: string
}

export interface LeaderboardEntry {
  name: string
  score: number
  fastestLap: number
  longestDrift: number
  highestSpeed: number
  date: number
}

export interface SaveData {
  unlockedCars: string[]
  selectedCar: string
  playerName: string
  leaderboard: LeaderboardEntry[]
  bestDrift: number
  bestTime: number
  totalScore: number
  settings: GameSettings
}

export interface GameSettings {
  graphics: 'low' | 'medium' | 'high'
  volume: number
  musicVolume: number
  cameraMode: number
}

export interface RaceResult {
  score: number
  position: number
  totalCars: number
  fastestLap: number
  longestDrift: number
  highestSpeed: number
  laps: number
  time: number
}

export interface CarProps {
  stats: VehicleStats
  children?: ReactNode
}
