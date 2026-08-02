import { useEffect, useRef } from 'react'
import type { Vehicle } from '../physics/vehicle'
import { LAPS } from '../race/raceManager'
import { useGame } from '../../store/useGame'
import MiniMap from './MiniMap'

interface Props {
  veh: Vehicle
}

export default function HUD({ veh }: Props) {
  const speedRef = useRef<HTMLSpanElement>(null)
  const rpmRef = useRef<HTMLDivElement>(null)
  const nitroRef = useRef<HTMLDivElement>(null)
  const boostRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<HTMLSpanElement>(null)
  const fpsRef = useRef<HTMLSpanElement>(null)

  const lap = useGame((s) => s.race.lap)
  const position = useGame((s) => s.race.position)
  const totalCars = useGame((s) => s.race.totalCars)
  const score = useGame((s) => s.race.score)
  const driftCombo = useGame((s) => s.race.driftCombo)
  const highestSpeed = useGame((s) => s.race.highestSpeed)

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    let frames = 0
    let fpsLast = start
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      frames++
      if (t - fpsLast > 500) {
        if (fpsRef.current)
          fpsRef.current.textContent = String(
            Math.round((frames * 1000) / (t - fpsLast)),
          )
        frames = 0
        fpsLast = t
      }
      const elapsed = (t - start) / 1000
      const m = Math.floor(elapsed / 60)
      const s = Math.floor(elapsed % 60)
      if (timerRef.current)
        timerRef.current.textContent = `${m}:${s.toString().padStart(2, '0')}`

      const speed = veh.speedKmh
      if (speedRef.current)
        speedRef.current.textContent = String(Math.round(speed))
      const maxV = veh.maxSpeed
      const ratio = Math.min(1, speed / maxV)
      const rpm = Math.min(1, 0.3 + ratio * 0.9)
      if (rpmRef.current) rpmRef.current.style.width = `${rpm * 100}%`
      if (nitroRef.current)
        nitroRef.current.style.width = `${(veh.nitro / veh.params.nitroCapacity) * 100}%`
      if (boostRef.current) {
        boostRef.current.style.opacity = String(0.35 + veh.boost * 0.65)
        boostRef.current.style.boxShadow = `0 0 ${12 + veh.boost * 30}px rgba(56,189,248,${0.3 + veh.boost * 0.6})`
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [veh])

  return (
    <div className="pointer-events-none absolute inset-0 select-none font-mono text-cyan-100">
      <div
        ref={boostRef}
        className="absolute inset-0 opacity-40"
        style={{ boxShadow: 'inset 0 0 120px rgba(56,189,248,0.25)' }}
      />

      <div className="absolute left-5 top-5 space-y-1 rounded-xl bg-black/40 px-4 py-3 backdrop-blur-sm">
        <div className="text-sm tracking-widest text-cyan-300">
          LAP <span className="text-2xl font-bold text-white">{lap}</span>
          <span className="text-white/50">/{LAPS}</span>
        </div>
        <div className="text-sm tracking-widest text-fuchsia-300">
          POS <span className="text-2xl font-bold text-white">{position}</span>
          <span className="text-white/50">/{totalCars}</span>
        </div>
      </div>

      <div className="absolute right-5 top-5 flex flex-col items-end gap-2">
        <span
          ref={timerRef}
          className="rounded-xl bg-black/40 px-3 py-1 text-2xl tabular-nums backdrop-blur-sm"
        >
          0:00
        </span>
        <span className="rounded-xl bg-black/40 px-2 py-1 text-xs text-white/60 backdrop-blur-sm">
          <span ref={fpsRef}>0</span> FPS
        </span>
      </div>

      <div className="absolute left-5 top-1/2 -translate-y-1/2 space-y-4">
        <div className="rounded-xl bg-black/40 px-5 py-4 backdrop-blur-sm">
          <div className="text-xs tracking-widest text-cyan-300">SCORE</div>
          <div className="text-3xl font-bold tabular-nums">
            {Math.round(score)}
          </div>
          {driftCombo > 1.5 && (
            <div className="mt-1 animate-pulse text-sm font-bold text-fuchsia-400">
              DRIFT ×{driftCombo.toFixed(1)}
            </div>
          )}
        </div>
        <div className="rounded-xl bg-black/40 px-4 py-3 text-xs backdrop-blur-sm">
          <div className="text-white/50">TOP SPEED</div>
          <div className="text-lg font-bold tabular-nums text-amber-300">
            {Math.round(highestSpeed)} km/h
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-5 w-64 space-y-2 rounded-xl bg-black/40 px-4 py-3 backdrop-blur-sm">
        <div className="text-6xl font-bold leading-none tabular-nums">
          <span ref={speedRef}>0</span>
          <span className="text-xl text-white/50"> km/h</span>
        </div>
        <div>
          <div className="mb-1 text-[10px] tracking-widest text-white/50">
            RPM
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              ref={rpmRef}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500"
              style={{ width: '0%' }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[10px] tracking-widest text-white/50">
            <span>NITRO</span>
            <span className="text-cyan-300">SHIFT</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              ref={nitroRef}
              className="h-full rounded-full"
              style={{
                width: '0%',
                background: 'linear-gradient(90deg,#22d3ee,#a78bfa)',
              }}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 right-5">
        <MiniMap />
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center text-[11px] leading-4 text-white/45">
        W/S accel · A/D steer · SPACE handbrake · SHIFT nitro · C camera · ESC
        pause
      </div>
    </div>
  )
}
