import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { InstancedMesh } from 'three'
import { BUILDINGS, NEON_STRIPS, STREET_LIGHTS, generateCity } from './city'
import { TRACK } from './track'

if (BUILDINGS.length === 0) generateCity()

function buildRibbon(width: number): THREE.BufferGeometry {
  const pts = TRACK.samples
  const n = pts.length
  const positions = new Float32Array(n * 2 * 3)
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n]
    const b = pts[i]
    const c = pts[(i + 1) % n]
    const dx = c.x - a.x
    const dz = c.y - a.y
    const len = Math.hypot(dx, dz) || 1
    const px = (dz / len) * width
    const pz = (-dx / len) * width
    positions[i * 6] = b.x - px
    positions[i * 6 + 1] = 0.02
    positions[i * 6 + 2] = b.y - pz
    positions[i * 6 + 3] = b.x + px
    positions[i * 6 + 4] = 0.02
    positions[i * 6 + 5] = b.y + pz
  }
  const indices: number[] = []
  for (let i = 0; i < n; i++) {
    const i2 = (i + 1) % n
    const a1 = i * 2
    const a2 = i * 2 + 1
    const b1 = i2 * 2
    const b2 = i2 * 2 + 1
    indices.push(a1, b1, a2, a2, b1, b2)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function Buildings() {
  const ref = useRef<InstancedMesh>(null)
  const { matrices, colors } = useMemo(() => {
    const matrices: THREE.Matrix4[] = []
    const colors: THREE.Color[] = []
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    for (const b of BUILDINGS) {
      m.compose(
        new THREE.Vector3(b.x, b.height / 2, b.z),
        q,
        new THREE.Vector3(b.w, b.height, b.d),
      )
      matrices.push(m.clone())
      colors.push(new THREE.Color(b.color))
    }
    return { matrices, colors }
  }, [])

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    matrices.forEach((m, i) => {
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, colors[i])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [matrices, colors])

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, matrices.length]}
      castShadow
    >
      <boxGeometry />
      <meshStandardMaterial metalness={0.35} roughness={0.7} />
    </instancedMesh>
  )
}

function NeonStrips() {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    NEON_STRIPS.forEach((s, i) => {
      m.compose(
        new THREE.Vector3(s.x, s.y + 0.2, s.z),
        q,
        new THREE.Vector3(30, 0.3, 30),
      )
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, new THREE.Color(s.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, NEON_STRIPS.length]}>
      <boxGeometry />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

function StreetLights() {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    STREET_LIGHTS.forEach((s, i) => {
      m.compose(
        new THREE.Vector3(s.x, 8, s.z),
        new THREE.Quaternion(),
        new THREE.Vector3(2.4, 2.4, 2.4),
      )
      mesh.setMatrixAt(i, m)
      mesh.setColorAt(i, new THREE.Color('#fde68a'))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, STREET_LIGHTS.length]}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

export default function City() {
  const roadGeo = useMemo(() => buildRibbon(16), [])
  const lineGeo = useMemo(() => buildRibbon(0.6), [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#0a0e18" roughness={1} />
      </mesh>
      <mesh geometry={roadGeo}>
        <meshStandardMaterial color="#151b2e" roughness={0.9} metalness={0.2} />
      </mesh>
      <mesh geometry={lineGeo}>
        <meshBasicMaterial color="#22d3ee" toneMapped={false} />
      </mesh>
      <Buildings />
      <NeonStrips />
      <StreetLights />
    </group>
  )
}
