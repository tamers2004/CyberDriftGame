import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vehicle } from '../physics/vehicle'

interface Props {
  veh: Vehicle
  mode: number
}

const MODES = [
  { dist: 7.2, height: 3.6, fov: 62 },
  { dist: 11.5, height: 5.2, fov: 58 },
  { dist: 1.4, height: 1.25, fov: 70 },
  { dist: 16, height: 9, fov: 50 },
]

export default function CameraRig({ veh, mode }: Props) {
  const { camera } = useThree()
  const smooth = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const m = MODES[mode]
    const fwd = veh.forward
    const target = veh.pos

    let desired: THREE.Vector3
    if (mode === 3) {
      // free / cinematic orbit
      const t = state.clock.elapsedTime * 0.25
      desired = new THREE.Vector3(
        target.x + Math.cos(t) * m.dist,
        m.height,
        target.z + Math.sin(t) * m.dist,
      )
    } else {
      const behind = new THREE.Vector3()
        .copy(target)
        .addScaledVector(fwd, -m.dist)
      desired = new THREE.Vector3(behind.x, target.y + m.height, behind.z)
      if (mode === 2)
        desired = new THREE.Vector3(target.x, target.y + 1.15, target.z)
    }

    const lerp =
      mode === 2 ? 1 - Math.exp(-18 * delta) : 1 - Math.exp(-6 * delta)
    if (!smooth.current.x && !smooth.current.y && !smooth.current.z) {
      smooth.current.copy(desired)
    }
    smooth.current.lerp(desired, lerp)

    // drift shake
    const shake =
      Math.min(0.5, Math.abs(veh.driftAngle) / 60) *
      Math.min(1, veh.speedKmh / 120)
    const sx = (Math.random() - 0.5) * shake * 0.4
    const sy = (Math.random() - 0.5) * shake * 0.4

    camera.position.set(
      smooth.current.x + sx,
      smooth.current.y +
        sy +
        Math.abs(Math.sin(state.clock.elapsedTime * 30)) * shake * 0.06,
      smooth.current.z,
    )

    const lookTarget = new THREE.Vector3().copy(target).addScaledVector(fwd, 4)
    if (mode === 3) lookTarget.set(target.x, target.y + 1, target.z)
    camera.lookAt(lookTarget)

    const targetFov = m.fov + veh.boost * 14 + Math.min(6, veh.speedKmh / 60)
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov += (targetFov - camera.fov) * 0.08
      camera.updateProjectionMatrix()
    }
  })

  return null
}
