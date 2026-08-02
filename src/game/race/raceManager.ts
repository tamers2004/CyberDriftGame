import type { RaceResult, VehicleStats } from '../../types'
import type { Vehicle, VehicleInput } from '../physics/vehicle'
import { Vehicle as VehicleImpl } from '../physics/vehicle'
import {
  TRACK,
  nearestOnTrack,
  roadFactorAt,
  startPosition,
} from '../world/track'
import { collideWithBuildings } from '../world/city'

export const LAPS = 3

const LAP_BONUS = 300
const FINISH_BONUS = [1600, 1200, 900, 650, 450, 300]
const DRIFT_SCALE = 10

export interface RaceVisualCar {
  x: number
  z: number
  heading: number
  isPlayer: boolean
}

export const raceVisuals = {
  cars: [] as RaceVisualCar[],
}

export interface Personality {
  name: string
  speedMul: number
  skill: number
  lookAhead: number
  laneOffset: number
  drifter: boolean
}

export const PERSONALITIES: Personality[] = [
  {
    name: 'Easy',
    speedMul: 0.72,
    skill: 0.75,
    lookAhead: 26,
    laneOffset: -3.5,
    drifter: false,
  },
  {
    name: 'Normal',
    speedMul: 0.86,
    skill: 0.88,
    lookAhead: 30,
    laneOffset: 3.5,
    drifter: false,
  },
  {
    name: 'Hard',
    speedMul: 0.97,
    skill: 0.98,
    lookAhead: 34,
    laneOffset: -3.5,
    drifter: true,
  },
  {
    name: 'Professional',
    speedMul: 1.06,
    skill: 1.1,
    lookAhead: 38,
    laneOffset: 3.5,
    drifter: true,
  },
]

interface Progress {
  cumRaw: number
  prevRaw: number
}

interface AIUnit {
  veh: Vehicle
  personality: Personality
  progress: Progress
}

interface Callbacks {
  onUpdate: (patch: {
    time: number
    lap: number
    position: number
    score: number
    driftCombo: number
    longestDrift: number
    highestSpeed: number
    fastestLap: number
  }) => void
  onFinish: (result: RaceResult) => void
}

export class RaceManager {
  player: Vehicle
  ai: AIUnit[] = []
  playerProgress: Progress
  private startTime = 0
  private elapsed = 0
  private finished = false
  private driftSeconds = 0
  private driftPoints = 0
  private racePoints = 0
  private lapCount = 1
  private combo = 0
  private longestDrift = 0
  private highestSpeed = 0
  private fastestLap = 0
  private lapStart = 0
  private lapTimes: number[] = []
  private lastPush = 0
  private cb: Callbacks

  constructor(
    playerStats: VehicleStats,
    aiStats: VehicleStats[],
    cb: Callbacks,
  ) {
    const total = aiStats.length + 1
    const start = startPosition(0, total)
    this.player = new VehicleImpl(playerStats, start)
    this.playerProgress = {
      cumRaw: 0,
      prevRaw: TRACK.cum[nearestOnTrack(start.x, start.z).index],
    }

    aiStats.forEach((stats, i) => {
      const sp = startPosition(i + 1, total)
      const veh = new VehicleImpl(stats, sp)
      this.ai.push({
        veh,
        personality: PERSONALITIES[i % PERSONALITIES.length],
        progress: {
          cumRaw: 0,
          prevRaw: TRACK.cum[nearestOnTrack(sp.x, sp.z).index],
        },
      })
    })

    this.startTime = performance.now()
    this.lapStart = this.startTime
    this.cb = cb
    this.pushVisuals()
  }

  tick(dt: number, input: VehicleInput): void {
    if (this.finished) return
    this.elapsed = performance.now() - this.startTime

    const rf = roadFactorAt(this.player.pos.x, this.player.pos.z)
    this.player.update(dt, input, rf)
    this.resolveCollision(this.player)
    this.highestSpeed = Math.max(this.highestSpeed, this.player.speedKmh)

    this.updateProgress(
      this.playerProgress,
      this.player.pos.x,
      this.player.pos.z,
    )
    this.handleLaps()

    for (const unit of this.ai) {
      const v = unit.veh
      const p = unit.personality
      const lookup = nearestOnTrack(v.pos.x, v.pos.z)
      const look = p.lookAhead * p.skill
      const ti = (lookup.index + Math.round(look)) % TRACK.samples.length
      const t = TRACK.samples[ti]
      const prev =
        TRACK.samples[(ti - 1 + TRACK.samples.length) % TRACK.samples.length]
      const nx = -(t.y - prev.y)
      const nz = t.x - prev.x
      const nl = Math.hypot(nx, nz) || 1
      const targetX = t.x + (nx / nl) * p.laneOffset
      const targetZ = t.y + (nz / nl) * p.laneOffset

      const desired = Math.atan2(targetX - v.pos.x, targetZ - v.pos.z)
      let diff = desired - v.heading
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2

      const steer = Math.max(-1, Math.min(1, diff * 2.2))
      const effTop = v.maxSpeed * p.speedMul
      let throttle: number
      if (v.speedKmh > effTop * 1.04) throttle = 0.05
      else if (Math.abs(diff) > 0.85) throttle = 0.5
      else if (Math.abs(diff) > 0.6) throttle = 0.75
      else throttle = 1
      if (v.speedKmh < 12 && Math.abs(diff) > 1.2) throttle = 0.6

      const handbrake = p.drifter && Math.abs(diff) > 0.9 && v.speedKmh > 55

      const arf = roadFactorAt(v.pos.x, v.pos.z)
      v.update(dt, { throttle, steer, handbrake, nitro: false }, arf)
      this.resolveCollision(v)
      this.updateProgress(unit.progress, v.pos.x, v.pos.z)
    }

    this.tickDrift(dt)
    this.pushVisuals()

    const tSec = this.elapsed / 1000
    if (performance.now() - this.lastPush >= 100) {
      this.lastPush = performance.now()
      this.cb.onUpdate({
        time: tSec,
        lap: Math.min(this.playerLap(), LAPS),
        position: this.position(),
        score: this.score(),
        driftCombo: this.combo,
        longestDrift: this.longestDrift,
        highestSpeed: this.highestSpeed,
        fastestLap: this.fastestLap,
      })
    }
  }

  private playerLap(): number {
    return Math.floor(this.playerProgress.cumRaw / TRACK.length) + 1
  }

  private handleLaps(): void {
    const lap = this.playerLap()
    if (lap > this.lapCount) {
      this.lapCount = lap
      if (lap > 1 && lap <= LAPS) {
        this.racePoints += LAP_BONUS
        const lapTime = (performance.now() - this.lapStart) / 1000
        this.lapStart = performance.now()
        this.lapTimes.push(lapTime)
        if (this.fastestLap === 0 || lapTime < this.fastestLap)
          this.fastestLap = lapTime
      }
    }
    if (lap > LAPS) {
      this.finished = true
      const pos = this.position()
      this.racePoints +=
        FINISH_BONUS[Math.min(pos - 1, FINISH_BONUS.length - 1)]
      this.cb.onFinish({
        score: Math.round(this.score()),
        position: pos,
        totalCars: this.ai.length + 1,
        fastestLap: this.fastestLap,
        longestDrift: this.longestDrift,
        highestSpeed: this.highestSpeed,
        laps: LAPS,
        time: this.elapsed / 1000,
      })
    }
  }

  private updateProgress(p: Progress, x: number, z: number): void {
    const raw = TRACK.cum[nearestOnTrack(x, z).index]
    let delta = raw - p.prevRaw
    const half = TRACK.length / 2
    if (delta > half) delta -= TRACK.length
    if (delta < -half) delta += TRACK.length
    p.cumRaw += delta
    p.prevRaw = raw
  }

  private position(): number {
    const totals = this.ai.map((a) => a.progress.cumRaw)
    totals.push(this.playerProgress.cumRaw)
    totals.sort((a, b) => b - a)
    return totals.indexOf(this.playerProgress.cumRaw) + 1
  }

  private score(): number {
    return this.driftPoints + this.racePoints
  }

  private tickDrift(dt: number): void {
    const v = this.player
    if (v.drifting) {
      this.driftSeconds += dt
      this.combo += dt
      const rate =
        (Math.abs(v.driftAngle) / 10) * (v.speedKmh / 12) * DRIFT_SCALE
      this.driftPoints += rate * dt
      v.nitro = Math.min(
        v.params.nitroCapacity,
        v.nitro + v.params.nitroCapacity * 0.055 * dt,
      )
    } else {
      this.driftSeconds = 0
      this.combo = 0
    }
    this.longestDrift = Math.max(this.longestDrift, this.driftSeconds)
  }

  private resolveCollision(v: Vehicle): void {
    const { pushX, pushZ } = collideWithBuildings(v.pos.x, v.pos.z, 2.3)
    if (pushX !== 0 || pushZ !== 0) {
      v.pos.x += pushX
      v.pos.z += pushZ
      const d = Math.hypot(pushX, pushZ)
      const nx = pushX / d
      const nz = pushZ / d
      const vd = v.vel.x * nx + v.vel.z * nz
      if (vd < 0) {
        v.vel.x -= vd * nx
        v.vel.z -= vd * nz
      }
    }
  }

  private pushVisuals(): void {
    const cars: RaceVisualCar[] = [
      {
        x: this.player.pos.x,
        z: this.player.pos.z,
        heading: this.player.heading,
        isPlayer: true,
      },
    ]
    for (const unit of this.ai) {
      cars.push({
        x: unit.veh.pos.x,
        z: unit.veh.pos.z,
        heading: unit.veh.heading,
        isPlayer: false,
      })
    }
    raceVisuals.cars = cars
  }
}
