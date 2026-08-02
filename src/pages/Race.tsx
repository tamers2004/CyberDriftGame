import { useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useNavigate } from 'react-router-dom'
import { getCar } from '../data/cars'
import { useGame } from '../store/useGame'
import { RaceManager } from '../game/race/raceManager'
import { useKeyboard } from '../game/input/useKeyboard'
import CarModel from '../game/player/CarModel'
import AICars from '../game/ai/AICars'
import CameraRig from '../game/camera/CameraRig'
import Smoke from '../game/effects/Smoke'
import City from '../game/world/City'
import HUD from '../game/ui/HUD'
import { audio } from '../game/audio/AudioEngine'

const AI_IDS = ['starter', 'sport', 'supercar', 'sport', 'starter']

function Scene({
  manager,
  input,
  started,
  cameraMode,
  high,
  onTogglePause,
}: {
  manager: RaceManager
  input: ReturnType<typeof useKeyboard>
  started: boolean
  cameraMode: number
  high: boolean
  onTogglePause: () => void
}) {
  useFrame((_, delta) => {
    if (!started) return
    const dt = Math.min(delta, 0.05)
    manager.tick(dt, input.vehicle)

    const v = manager.player
    const ratio = Math.min(1, v.speedKmh / v.maxSpeed)
    audio.setEngine(ratio, input.vehicle.throttle, v.boost)
    audio.setSkid(v.drifting ? 1 : 0)
    audio.setNitro(v.boost > 0.3)

    if (input.consume('Escape')) onTogglePause()
    if (input.consume('KeyC')) {
      const s = useGame.getState()
      s.setSettings({ cameraMode: (s.save.settings.cameraMode + 1) % 4 })
    }
  })

  return (
    <>
      <color attach="background" args={['#070b15']} />
      <fog attach="fog" args={['#070b15', high ? 140 : 90, 520]} />
      <hemisphereLight intensity={0.35} color="#4a5a9a" groundColor="#0a0a12" />
      <directionalLight
        position={[60, 120, -40]}
        intensity={0.9}
        color="#8fb0ff"
        castShadow={high}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <City />
      <CarModel
        veh={manager.player}
        bodyColor={manager.player.params.bodyColor}
        glowColor={manager.player.params.glowColor}
      />
      <AICars manager={manager} />
      <Smoke veh={manager.player} />
      <CameraRig veh={manager.player} mode={cameraMode} />
      {high && (
        <EffectComposer>
          <Bloom
            intensity={1.1}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.25} darkness={0.7} />
        </EffectComposer>
      )}
    </>
  )
}

export default function Race() {
  const navigate = useNavigate()
  const selectedId = useGame((s) => s.save.selectedCar)
  const selected = getCar(selectedId)
  const updateRace = useGame((s) => s.updateRace)
  const resetRace = useGame((s) => s.resetRace)
  const finishRace = useGame((s) => s.finishRace)
  const cameraMode = useGame((s) => s.save.settings.cameraMode)
  const graphics = useGame((s) => s.save.settings.graphics)
  const input = useKeyboard()

  const [runId, setRunId] = useState(0)
  const [paused, setPaused] = useState(false)
  const [count, setCount] = useState(3)
  const [started, setStarted] = useState(false)
  const [showGo, setShowGo] = useState(false)

  const aiStats = useMemo(() => AI_IDS.map((id) => getCar(id)), [])

  const manager = useMemo(() => {
    resetRace(6)
    const mgr = new RaceManager(selected, aiStats, {
      onUpdate: (patch) => updateRace(patch),
      onFinish: (result) => {
        finishRace(result)
        navigate('/results')
      },
    })
    return mgr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  useEffect(() => {
    if (paused) return
    if (count <= 0) return
    const t = setTimeout(() => setCount((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, paused])

  useEffect(() => {
    if (count === 0) {
      setStarted(true)
      setShowGo(true)
      audio.click()
      const t = setTimeout(() => setShowGo(false), 1200)
      return () => clearTimeout(t)
    }
  }, [count])

  const restart = () => {
    setPaused(false)
    setStarted(false)
    setCount(3)
    setShowGo(false)
    setRunId((r) => r + 1)
    audio.click()
  }

  const high = graphics !== 'low'

  return (
    <div className="relative h-full w-full bg-[#070b15]">
      <Canvas
        shadows={high}
        dpr={graphics === 'low' ? [0.5, 1] : [1, 1.75]}
        camera={{ fov: 62, near: 0.1, far: 1200, position: [0, 5, -9] }}
      >
        <Scene
          manager={manager}
          input={input}
          started={started && !paused}
          cameraMode={cameraMode}
          high={high}
          onTogglePause={() => setPaused((p) => !p)}
        />
      </Canvas>

      {started && !paused && <HUD veh={manager.player} />}

      {!started && count > 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="font-display text-9xl font-black text-cyan-300 drop-shadow-[0_0_40px_rgba(34,211,238,0.8)]">
            {count}
          </div>
        </div>
      )}
      {started && showGo && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="font-display animate-pulse text-6xl font-black text-fuchsia-400 drop-shadow-[0_0_40px_rgba(244,114,182,0.8)]">
            GO!
          </div>
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="panel w-[min(360px,90vw)] p-8 text-center">
            <h2 className="font-display mb-6 text-3xl font-black tracking-widest text-cyan-300">
              PAUSED
            </h2>
            <div className="flex flex-col gap-3">
              <button
                className="btn-neon"
                onClick={() => {
                  audio.click()
                  setPaused(false)
                }}
              >
                Resume
              </button>
              <button className="btn-ghost" onClick={restart}>
                Restart
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  audio.click()
                  navigate('/')
                }}
              >
                Quit to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
