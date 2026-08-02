import { useEffect, useRef } from 'react'
import { TRACK } from '../world/track'
import { raceVisuals } from '../race/raceManager'

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const W = cv.width
    const H = cv.height
    const R = Math.min(W, H) / 2
    const scale = R / 350

    let raf = 0
    let last = 0
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - last < 66) return
      last = t

      const player = raceVisuals.cars.find((c) => c.isPlayer)
      const px = player ? player.x : 0
      const pz = player ? player.z : 0
      const heading = player ? player.heading : 0

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(5,8,16,0.82)'
      ctx.fillRect(0, 0, W, H)

      ctx.translate(W / 2, H / 2)
      ctx.rotate(heading - Math.PI)
      ctx.scale(scale, scale)
      ctx.translate(-px, -pz)

      ctx.lineWidth = 3 / scale
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(148,163,184,0.5)'
      ctx.beginPath()
      for (let i = 0; i < TRACK.samples.length; i++) {
        const p = TRACK.samples[i]
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
      ctx.closePath()
      ctx.stroke()

      for (const c of raceVisuals.cars) {
        if (c.isPlayer) continue
        ctx.beginPath()
        ctx.arc(c.x, c.z, 3.5 / scale, 0, Math.PI * 2)
        ctx.fillStyle = '#f472b6'
        ctx.fill()
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.beginPath()
      ctx.moveTo(W / 2, H / 2 - 6)
      ctx.lineTo(W / 2 - 4, H / 2 + 4)
      ctx.lineTo(W / 2 + 4, H / 2 + 4)
      ctx.closePath()
      ctx.fillStyle = '#22d3ee'
      ctx.fill()
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={190}
      height={190}
      className="rounded-xl border border-cyan-400/30 shadow-neon"
    />
  )
}
