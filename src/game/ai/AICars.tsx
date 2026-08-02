import type { RaceManager } from '../race/raceManager'
import CarModel from '../player/CarModel'

const AI_COLORS = [
  { body: '#f59e0b', glow: '#facc15' },
  { body: '#10b981', glow: '#34d399' },
  { body: '#ec4899', glow: '#f472b6' },
  { body: '#8b5cf6', glow: '#a78bfa' },
  { body: '#ef4444', glow: '#f87171' },
]

interface Props {
  manager: RaceManager
}

export default function AICars({ manager }: Props) {
  return (
    <group>
      {manager.ai.map((unit, i) => (
        <CarModel
          key={i}
          veh={unit.veh}
          bodyColor={AI_COLORS[i % AI_COLORS.length].body}
          glowColor={AI_COLORS[i % AI_COLORS.length].glow}
        />
      ))}
    </group>
  )
}
