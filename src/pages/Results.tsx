import { useNavigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { audio } from '../game/audio/AudioEngine'

function fmt(sec: number): string {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = (sec % 60).toFixed(1)
  return `${m}:${s.padStart(4, '0')}`
}

export default function Results() {
  const navigate = useNavigate()
  const save = useGame((s) => s.save)
  const race = useGame((s) => s.race)
  const resetRace = useGame((s) => s.resetRace)

  const raceAgain = () => {
    audio.click()
    resetRace(6)
    navigate('/race')
  }

  const podium = race.position === 1

  return (
    <div className="cyber-bg scanlines relative flex h-full items-center justify-center text-white">
      <div className="panel w-[min(560px,92vw)] p-8">
        <div className="text-center">
          <h1 className="font-display bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-4xl font-black tracking-[0.2em] text-transparent">
            {podium ? 'VICTORY' : 'FINISH'}
          </h1>
          <div className="mt-2 text-sm tracking-widest text-white/50">
            POSITION{' '}
            <span className="text-2xl font-black text-cyan-300">
              {race.position}
            </span>
            <span className="text-white/40">/{race.totalCars}</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-xs tracking-widest text-white/40">SCORE</div>
            <div className="text-3xl font-black tabular-nums text-cyan-300">
              {Math.round(race.score).toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-xs tracking-widest text-white/40">
              RACE TIME
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {fmt(race.time)}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-xs tracking-widest text-white/40">
              FASTEST LAP
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {race.fastestLap ? race.fastestLap.toFixed(1) + 's' : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-xs tracking-widest text-white/40">
              LONGEST DRIFT
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {race.longestDrift.toFixed(1)}s
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-xs tracking-widest text-white/40">
              TOP SPEED
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {Math.round(race.highestSpeed)} km/h
            </div>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <div className="text-xs tracking-widest text-white/40">
              TOTAL SCORE
            </div>
            <div className="text-2xl font-bold tabular-nums text-fuchsia-300">
              {save.totalScore.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2 font-display text-sm font-bold tracking-widest text-cyan-300">
            LEADERBOARD
          </div>
          <div className="max-h-44 overflow-y-auto">
            {save.leaderboard.length === 0 ? (
              <p className="text-sm text-white/40">No scores yet.</p>
            ) : (
              save.leaderboard.slice(0, 10).map((e, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-t border-white/5 py-1 text-sm"
                >
                  <span className="text-white/40">{i + 1}.</span>
                  <span className="flex-1 pl-2">{e.name}</span>
                  <span className="tabular-nums">
                    {e.score.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button className="btn-neon flex-1" onClick={raceAgain}>
            Race Again
          </button>
          <button
            className="btn-ghost flex-1"
            onClick={() => {
              audio.click()
              navigate('/')
            }}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}
