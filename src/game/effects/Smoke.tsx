import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vehicle } from '../physics/vehicle'

const MAX = 240

interface Particle {
  alive: boolean
  life: number
  maxLife: number
  size: number
  pos: THREE.Vector3
  vel: THREE.Vector3
}

interface SmokeProps {
  veh: Vehicle
}

export default function Smoke({ veh }: SmokeProps) {
  const geo = useRef<THREE.BufferGeometry>(null)

  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTex: { value: tex } },
        vertexShader: /* glsl */ `
          attribute float aSize;
          attribute float aAlpha;
          varying float vAlpha;
          void main() {
            vAlpha = aAlpha;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uTex;
          varying float vAlpha;
          void main() {
            vec4 t = texture2D(uTex, gl_PointCoord);
            gl_FragColor = vec4(vec3(0.75, 0.77, 0.82), t.a * vAlpha);
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    [tex],
  )

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: MAX }, () => ({
        alive: false,
        life: 0,
        maxLife: 1,
        size: 1,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
      })),
    [],
  )

  const buffers = useMemo(() => {
    const pos = new Float32Array(MAX * 3)
    const size = new Float32Array(MAX)
    const alpha = new Float32Array(MAX)
    return { pos, size, alpha }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const f = veh.forward
    let spawnSide = 0
    let spawnBack = 0
    if (veh.drifting) {
      spawnSide = veh.bodyRoll > 0 ? 1 : -1
      spawnBack = 1
    } else if (Math.abs(veh.steerVisual) > 0.4 && veh.speedKmh > 60) {
      spawnSide = veh.steerVisual > 0 ? -1 : 1
      spawnBack = 0.4
    }
    if (spawnSide !== 0) {
      for (let k = 0; k < 2; k++) {
        const p =
          particles.find((q) => !q.alive) ??
          particles[Math.floor(Math.random() * MAX)]
        p.alive = true
        p.life = 0
        p.maxLife = 0.9 + Math.random() * 0.8
        p.size = 0.6 + Math.random() * 0.7
        p.pos.copy(veh.pos).addScaledVector(f, -1.2 * spawnBack)
        p.vel.set(
          spawnSide * (1.5 + Math.random() * 1.5) - veh.vel.x * 0.1,
          0.5 + Math.random() * 0.6,
          veh.vel.z * 0.1,
        )
      }
    }

    const alive: Particle[] = []
    for (const p of particles) {
      if (!p.alive) continue
      p.life += dt
      if (p.life > p.maxLife) {
        p.alive = false
        continue
      }
      p.pos.addScaledVector(p.vel, dt)
      p.pos.y += dt * 0.3
      p.vel.multiplyScalar(1 - dt * 1.1)
      alive.push(p)
    }

    const g = geo.current
    if (!g) return
    const n = alive.length
    for (let i = 0; i < n; i++) {
      const p = alive[i]
      const t = p.life / p.maxLife
      buffers.pos[i * 3] = p.pos.x
      buffers.pos[i * 3 + 1] = p.pos.y
      buffers.pos[i * 3 + 2] = p.pos.z
      buffers.size[i] = p.size * (0.4 + t * 1.6)
      buffers.alpha[i] = (1 - t) * 0.5
    }
    if (!g.attributes.position) {
      g.setAttribute('position', new THREE.BufferAttribute(buffers.pos, 3))
      g.setAttribute('aSize', new THREE.BufferAttribute(buffers.size, 1))
      g.setAttribute('aAlpha', new THREE.BufferAttribute(buffers.alpha, 1))
    }
    g.setDrawRange(0, n)
    g.attributes.position.needsUpdate = true
    g.attributes.aSize.needsUpdate = true
    g.attributes.aAlpha.needsUpdate = true
    g.computeBoundingSphere()
  })

  return (
    <points material={mat}>
      <bufferGeometry ref={geo} />
    </points>
  )
}
