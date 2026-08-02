import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useNavigate } from 'react-router-dom'
import type { VehicleStats } from '../types'
import { CARS } from '../data/cars'
import { carUnlocked } from '../utils/save'
import { useGame } from '../store/useGame'
import { Vehicle } from '../game/physics/vehicle'
import CarModel from '../game/player/CarModel'
import { audio } from '../game/audio/AudioEngine'

function PreviewCar({ stats }: { stats: VehicleStats }) {
  const veh = useMemo(
    () => new Vehicle(stats, { x: 0, z: 0, heading: Math.PI / 2 }),
    [stats],
  )
  return (
    <group rotation={[0, Math.PI * 1.5, 0]}>
      <CarModel
        veh={veh}
        bodyColor={stats.bodyColor}
        glowColor={stats.glowColor}
      />
    </group>
  )
}

function StatBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className="mb-1.5">
      <div className="flex justify-between text-[10px] tracking-widest text-white/50">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function Garage() {
  const navigate = useNavigate()
  const save = useGame((s) => s.save)
  const selectCar = useGame((s) => s.selectCar)
  const resetRace = useGame((s) => s.resetRace)
  const selected = CARS.find((c) => c.id === save.selectedCar) ?? CARS[0]

  const startRace = () => {
    audio.click()
    resetRace(6)
    navigate('/race')
  }

  return (
    <div className="cyber-bg scanlines relative flex h-full flex-col overflow-hidden text-white">
      <header className="flex items-center justify-between px-8 py-5">
        <button
          className="btn-ghost !px-4 !py-2"
          onClick={() => {
            audio.click()
            navigate('/')
          }}
        >
          ← Back
        </button>
        <h1 className="font-display text-2xl font-black tracking-[0.3em] text-cyan-300">
          GARAGE
        </h1>
        <button className="btn-neon" onClick={startRace}>
          Start Race ▶
        </button>
      </header>

      <div className="flex flex-1 gap-4 px-8 pb-8">
        <div className="flex flex-1 flex-col">
          <div className="panel flex flex-1 flex-col items-center justify-center">
            <Canvas camera={{ position: [0, 2.6, 8], fov: 45 }} dpr={[1, 2]}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 8, 5]} intensity={1.2} />
              <pointLight
                position={[-4, 3, -4]}
                intensity={0.6}
                color={selected.glowColor}
              />
              <PreviewCar stats={selected} />
            </Canvas>
            <div className="pb-4 text-center">
              <h2 className="font-display text-3xl font-black tracking-widest">
                {selected.name}
              </h2>
              <p className="mt-1 text-sm tracking-widest text-fuchsia-400">
                {selected.tier.toUpperCase()}
              </p>
              <div className="mx-auto mt-4 grid w-full max-w-md grid-cols-2 gap-x-8">
                <StatBar
                  label="TOP SPEED"
                  value={selected.topSpeed / 3}
                  color="#facc15"
                />
                <StatBar label="ACCEL" value={selected.accel} color="#34d399" />
                <StatBar label="GRIP" value={selected.grip} color="#22d3ee" />
                <StatBar
                  label="NITRO"
                  value={selected.nitroCapacity}
                  color="#a78bfa"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-[340px] space-y-3 overflow-y-auto pr-1">
          {CARS.map((car) => {
            const unlocked = carUnlocked(save, car.unlockScore)
            const isSel = car.id === selected.id
            return (
              <button
                key={car.id}
                disabled={!unlocked}
                onClick={() => {
                  audio.click()
                  selectCar(car.id)
                }}
                className={`panel relative w-full p-4 text-left transition ${
                  isSel ? '!border-cyan-400/70 shadow-neon' : ''
                } ${unlocked ? 'cursor-pointer hover:border-cyan-400/40' : 'opacity-60'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold tracking-wider">
                      {car.name}
                    </div>
                    <div className="text-[11px] tracking-widest text-fuchsia-400/80">
                      {car.tier.toUpperCase()}
                    </div>
                  </div>
                  <div
                    className="h-6 w-6 rounded-full border-2"
                    style={{
                      background: car.bodyColor,
                      borderColor: car.glowColor,
                    }}
                  />
                </div>
                {!unlocked && (
                  <div className="mt-2 text-[11px] text-amber-300">
                    🔒 Score {car.unlockScore.toLocaleString()} to unlock
                  </div>
                )}
              </button>
            )
          })}
          <div className="panel p-4 text-xs leading-5 text-white/50">
            <div className="mb-1 font-bold tracking-widest text-cyan-300">
              PROGRESS
            </div>
            <div>Total Score: {save.totalScore.toLocaleString()}</div>
            <div>Best Drift: {save.bestDrift.toFixed(1)}s</div>
          </div>
        </div>
      </div>
    </div>
  )
}
