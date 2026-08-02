import { create } from 'zustand'
import type { GameSettings, RaceResult, SaveData } from '../types'
import { loadSave, persistSave } from '../utils/save'

interface RaceState {
  lap: number
  position: number
  totalCars: number
  score: number
  driftCombo: number
  longestDrift: number
  highestSpeed: number
  fastestLap: number
  time: number
  finished: boolean
}

interface GameStore {
  save: SaveData
  race: RaceState
  selectCar: (id: string) => void
  setPlayerName: (name: string) => void
  setSettings: (patch: Partial<GameSettings>) => void
  resetRace: (totalCars: number) => void
  updateRace: (patch: Partial<RaceState>) => void
  finishRace: (result: RaceResult) => void
}

export const useGame = create<GameStore>((set, get) => {
  const save = loadSave()

  return {
    save,
    race: {
      lap: 1,
      position: 1,
      totalCars: 1,
      score: 0,
      driftCombo: 0,
      longestDrift: 0,
      highestSpeed: 0,
      fastestLap: 0,
      time: 0,
      finished: false,
    },

    selectCar: (id) =>
      set((s) => {
        const next = { ...s.save, selectedCar: id }
        persistSave(next)
        return { save: next }
      }),

    setPlayerName: (name) =>
      set((s) => {
        const next = { ...s.save, playerName: name || 'DRIVER' }
        persistSave(next)
        return { save: next }
      }),

    setSettings: (patch) =>
      set((s) => {
        const next: SaveData = {
          ...s.save,
          settings: { ...s.save.settings, ...patch },
        }
        persistSave(next)
        return { save: next }
      }),

    resetRace: (totalCars) =>
      set({
        race: {
          lap: 1,
          position: 1,
          totalCars,
          score: 0,
          driftCombo: 0,
          longestDrift: 0,
          highestSpeed: 0,
          fastestLap: 0,
          time: 0,
          finished: false,
        },
      }),

    updateRace: (patch) => set((s) => ({ race: { ...s.race, ...patch } })),

    finishRace: (result) => {
      const s = get()
      const score = result.score
      const save: SaveData = {
        ...s.save,
        totalScore: s.save.totalScore + score,
        bestDrift: Math.max(s.save.bestDrift, result.longestDrift),
        bestTime: Math.min(s.save.bestTime || Infinity, result.time),
      }
      const entries = [...save.leaderboard]
        .concat({
          name: save.playerName,
          score,
          fastestLap: result.fastestLap,
          longestDrift: result.longestDrift,
          highestSpeed: result.highestSpeed,
          date: Date.now(),
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
      persistSave({ ...save, leaderboard: entries })
      set({ save: { ...save, leaderboard: entries } })
    },
  }
})
