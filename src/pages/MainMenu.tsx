import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { audio } from '../game/audio/AudioEngine'
import { music } from '../game/audio/Music'
import { useGame } from '../store/useGame'

export default function MainMenu() {
  const navigate = useNavigate()
  const save = useGame((s) => s.save)
  const setSettings = useGame((s) => s.setSettings)
  const setPlayerName = useGame((s) => s.setPlayerName)
  const [panel, setPanel] = useState<
    'none' | 'leaderboard' | 'settings' | 'controls'
  >('none')

  const click = () => audio.click()

  const start = () => {
    click()
    navigate('/garage')
  }

  return (
    <div className="cyber-bg scanlines relative flex h-full flex-col items-center justify-center text-white">
      <div className="absolute top-8 right-8 text-xs tracking-widest text-fuchsia-400/70">
        v0.1.0
      </div>

      <h1 className="font-display bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-violet-400 bg-clip-text text-center text-7xl font-black tracking-[0.2em] text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
        CYBER DRIFT
      </h1>
      <p className="mt-3 text-sm tracking-[0.5em] text-white/50">
        A NEON ARCADE RACER
      </p>

      <div className="mt-12 flex w-72 flex-col gap-3">
        <button className="btn-neon" onClick={start}>
          ▶ Start Race
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            click()
            setPanel(panel === 'leaderboard' ? 'none' : 'leaderboard')
          }}
        >
          Leaderboard
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            click()
            setPanel(panel === 'settings' ? 'none' : 'settings')
          }}
        >
          Settings
        </button>
        <button
          className="btn-ghost"
          onClick={() => {
            click()
            setPanel(panel === 'controls' ? 'none' : 'controls')
          }}
        >
          Controls
        </button>
      </div>

      <div className="mt-10 text-[11px] text-white/35">
        Save data & leaderboard stored locally in your browser
      </div>

      <footer className="absolute bottom-5 left-0 right-0 text-center text-[11px] tracking-widest text-white/40">
        © 2026 Tamer Satel
      </footer>

      {panel === 'leaderboard' && (
        <div className="panel absolute top-1/2 left-1/2 z-20 max-h-[70vh] w-[min(520px,90vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-widest text-cyan-300">
              LEADERBOARD
            </h2>
            <button
              className="btn-ghost !px-3 !py-1 text-xs"
              onClick={() => setPanel('none')}
            >
              Close
            </button>
          </div>
          {save.leaderboard.length === 0 ? (
            <p className="text-sm text-white/50">No scores yet — go drift!</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/40">
                  <th className="py-1">#</th>
                  <th>DRIVER</th>
                  <th className="text-right">SCORE</th>
                  <th className="text-right">BEST LAP</th>
                </tr>
              </thead>
              <tbody>
                {save.leaderboard.map((e, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="py-1.5 text-cyan-300">{i + 1}</td>
                    <td>{e.name}</td>
                    <td className="text-right tabular-nums">
                      {e.score.toLocaleString()}
                    </td>
                    <td className="text-right tabular-nums">
                      {e.fastestLap ? e.fastestLap.toFixed(1) + 's' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {panel === 'settings' && (
        <div className="panel absolute top-1/2 left-1/2 z-20 w-[min(480px,90vw)] -translate-x-1/2 -translate-y-1/2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-widest text-cyan-300">
              SETTINGS
            </h2>
            <button
              className="btn-ghost !px-3 !py-1 text-xs"
              onClick={() => setPanel('none')}
            >
              Close
            </button>
          </div>
          <label className="mb-4 block text-sm">
            <span className="mb-1 block text-xs tracking-widest text-white/50">
              PILOT NAME
            </span>
            <input
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-cyan-200 outline-none focus:border-cyan-400/60"
              value={save.playerName}
              maxLength={12}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
            />
          </label>
          <div className="mb-4">
            <span className="mb-1 block text-xs tracking-widest text-white/50">
              GRAPHICS
            </span>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    click()
                    setSettings({ graphics: g })
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm uppercase tracking-widest transition ${
                    save.settings.graphics === g
                      ? 'border-cyan-400/70 bg-cyan-400/15 text-cyan-200'
                      : 'border-white/15 text-white/50 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <span className="mb-1 block text-xs tracking-widest text-white/50">
              VOLUME {Math.round(save.settings.volume * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(save.settings.volume * 100)}
              onChange={(e) =>
                setSettings({ volume: Number(e.target.value) / 100 })
              }
              className="w-full accent-cyan-400"
            />
          </div>
          <div>
            <span className="mb-1 block text-xs tracking-widest text-white/50">
              MUSIC {Math.round(save.settings.musicVolume * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(save.settings.musicVolume * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100
                setSettings({ musicVolume: v })
                music.setVolume(v)
              }}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      )}

      {panel === 'controls' && (
        <div className="panel absolute top-1/2 left-1/2 z-20 w-[min(480px,90vw)] -translate-x-1/2 -translate-y-1/2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-widest text-cyan-300">
              CONTROLS
            </h2>
            <button
              className="btn-ghost !px-3 !py-1 text-xs"
              onClick={() => setPanel('none')}
            >
              Close
            </button>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ['W / ↑', 'Accelerate'],
              ['S / ↓', 'Brake / Reverse'],
              ['A / D', 'Steer'],
              ['SPACE', 'Handbrake (drift)'],
              ['SHIFT', 'Nitro'],
              ['C', 'Camera mode'],
              ['ESC', 'Pause'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between border-b border-white/5 pb-1.5"
              >
                <span className="rounded bg-white/10 px-2 py-0.5 font-bold text-cyan-200">
                  {k}
                </span>
                <span className="text-white/60">{v}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/40">
            Drift to build combo and score points. Drifting also recharges
            nitro.
          </p>
        </div>
      )}
    </div>
  )
}
