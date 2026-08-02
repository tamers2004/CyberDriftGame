import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import type { Vehicle } from '../physics/vehicle'

interface Props {
  veh: Vehicle
  bodyColor: string
  glowColor: string
}

export default function CarModel({ veh, bodyColor, glowColor }: Props) {
  const root = useRef<Group>(null)
  const body = useRef<Group>(null)
  const wheelFL = useRef<Group>(null)
  const wheelFR = useRef<Group>(null)
  const wheelRL = useRef<Group>(null)
  const wheelRR = useRef<Group>(null)
  const flameL = useRef<Mesh>(null)
  const flameR = useRef<Mesh>(null)

  useFrame(() => {
    if (root.current) {
      root.current.position.copy(veh.pos)
      root.current.position.y = 0
      root.current.rotation.y = veh.heading
    }
    if (body.current) {
      body.current.rotation.z = veh.bodyRoll
      body.current.rotation.x =
        -veh.boost * 0.03 - Math.min(0.03, veh.speedKmh / 9000)
    }
    const spin = veh.wheelSpin
    const bob = Math.sin(spin * 2) * 0.02
    for (const w of [wheelFL.current, wheelFR.current]) {
      if (!w) continue
      w.rotation.y = veh.steerVisual
      w.rotation.x = spin
      w.position.y = 0.34 + bob
    }
    for (const w of [wheelRL.current, wheelRR.current]) {
      if (!w) continue
      w.rotation.x = spin
      w.position.y = 0.34 + bob
    }
    for (const flame of [flameL.current, flameR.current]) {
      if (!flame) continue
      const s = 0.5 + veh.boost * 2.2
      flame.scale.y = s
      flame.scale.z = 0.4 + veh.boost * 1.6
      flame.visible = veh.boost > 0.05
    }
  })

  return (
    <group ref={root}>
      <group ref={body}>
        <mesh castShadow position={[0, 0.5, 0.1]}>
          <boxGeometry args={[1.85, 0.55, 4.1]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.8}
            roughness={0.25}
          />
        </mesh>
        <mesh position={[0, 0.78, -0.25]}>
          <boxGeometry args={[1.62, 0.4, 2.0]} />
          <meshStandardMaterial
            color="#0a0e1a"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[0, 0.95, -1.75]}>
          <boxGeometry args={[1.7, 0.08, 0.7]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, 0.5, 2.08]}>
          <boxGeometry args={[1.7, 0.18, 0.15]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1.4}
          />
        </mesh>
        <mesh position={[0, 0.72, -2.08]}>
          <boxGeometry args={[1.7, 0.16, 0.15]} />
          <meshStandardMaterial
            color="#ff2038"
            emissive="#ff2038"
            emissiveIntensity={1.6}
          />
        </mesh>
        <mesh position={[0, 0.03, 0.1]}>
          <boxGeometry args={[1.9, 0.08, 4.2]} />
          <meshStandardMaterial
            color={bodyColor}
            emissive={glowColor}
            emissiveIntensity={0.9}
          />
        </mesh>
        <mesh position={[0, 0.03, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 3.4]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.5} />
        </mesh>
      </group>
      <group ref={wheelFL} position={[0.85, 0.34, 1.35]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.3, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
      </group>
      <group ref={wheelFR} position={[-0.85, 0.34, 1.35]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.3, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
      </group>
      <group ref={wheelRL} position={[0.85, 0.34, -1.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.3, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
      </group>
      <group ref={wheelRR} position={[-0.85, 0.34, -1.3]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.3, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>
      </group>
      <group position={[0.35, 0.55, -2.15]}>
        <mesh ref={flameL}>
          <coneGeometry args={[0.14, 0.6, 8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
        </mesh>
      </group>
      <group position={[-0.35, 0.55, -2.15]}>
        <mesh ref={flameR}>
          <coneGeometry args={[0.14, 0.6, 8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  )
}
