import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { audio } from './game/audio/AudioEngine'
import { music } from './game/audio/Music'
import { useGame } from './store/useGame'
import MainMenu from './pages/MainMenu'
import Garage from './pages/Garage'
import Race from './pages/Race'
import Results from './pages/Results'

export default function App() {
  const settings = useGame((s) => s.save.settings)

  useEffect(() => {
    const init = () => {
      audio.init()
      audio.setVolume(settings.volume)
      music.setVolume(settings.musicVolume)
      music.start()
    }
    window.addEventListener('pointerdown', init, { once: true })
    window.addEventListener('keydown', init, { once: true })
    return () => {
      window.removeEventListener('pointerdown', init)
      window.removeEventListener('keydown', init)
    }
  }, [settings.volume, settings.musicVolume])

  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/garage" element={<Garage />} />
      <Route path="/race" element={<Race />} />
      <Route path="/results" element={<Results />} />
      <Route path="*" element={<MainMenu />} />
    </Routes>
  )
}
