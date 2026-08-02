import * as THREE from 'three'
import type { VehicleStats } from '../../types'

export interface VehicleInput {
  throttle: number
  steer: number
  handbrake: boolean
  nitro: boolean
}

export interface VehicleStart {
  x: number
  z: number
  heading: number
}

const SLIP = 2.2
const GRIP_STIFF = 4.8
const MAX_STEER = 0.55
const TURN_SCALE = 2.1
const DRIFT_DEG = 8 * (Math.PI / 180)

export class Vehicle {
  pos = new THREE.Vector3()
  vel = new THREE.Vector3()
  heading = 0
  steer = 0
  steerVisual = 0
  wheelSpin = 0
  nitro = 0
  boost = 0
  speedKmh = 0
  driftAngle = 0
  drifting = false
  bodyRoll = 0
  forward = new THREE.Vector3(0, 0, 1)

  params: VehicleStats

  constructor(params: VehicleStats, start: VehicleStart) {
    this.params = params
    this.pos.set(start.x, 0, start.z)
    this.heading = start.heading
    this.nitro = params.nitroCapacity
  }

  get maxSpeed(): number {
    return this.params.topSpeed / 3.6
  }

  private maxAccel(): number {
    return this.params.accel / 5
  }

  reset(start: VehicleStart): void {
    this.pos.set(start.x, 0, start.z)
    this.vel.set(0, 0, 0)
    this.heading = start.heading
    this.steer = 0
    this.steerVisual = 0
    this.nitro = this.params.nitroCapacity
    this.boost = 0
  }

  update(dt: number, input: VehicleInput, roadFactor: number): void {
    const setForward = () =>
      this.forward.set(Math.sin(this.heading), 0, Math.cos(this.heading))

    setForward()
    const right = () => new THREE.Vector3(this.forward.z, 0, -this.forward.x)

    const vF = this.vel.dot(this.forward)

    const maxV = this.maxSpeed
    const nitroActive = input.nitro && this.nitro > 0

    if (nitroActive) {
      this.nitro = Math.max(
        0,
        this.nitro - (22 + this.params.nitroCapacity / 12) * dt,
      )
      this.boost = Math.min(1, this.boost + dt * 6)
    } else {
      this.boost = Math.max(0, this.boost - dt * 8)
    }
    const speedCap = maxV * (1 + 0.38 * this.boost) * (0.35 + 0.65 * roadFactor)
    const powerMul = 1 + 0.9 * this.boost

    const a = this.maxAccel() * powerMul * roadFactor

    // longitudinal forces (world-space, along current heading)
    if (input.throttle > 0.02) {
      this.vel.addScaledVector(this.forward, a * input.throttle * dt)
    } else if (input.throttle < -0.02) {
      if (vF > 1) {
        this.vel.addScaledVector(this.forward, -Math.min(vF, 16 * dt))
      } else {
        this.vel.addScaledVector(this.forward, -0.4 * a * dt)
      }
    }
    // quadratic aero drag: terminal speed converges on speedCap
    const drag = a * (vF / speedCap) ** 2
    this.vel.addScaledVector(this.forward, -drag * dt)

    // steering rotates heading; velocity keeps world-space inertia
    const targetSteer = input.steer * MAX_STEER
    this.steer += (targetSteer - this.steer) * Math.min(1, dt * 10)
    this.steerVisual = this.steer
    const speedFactor = Math.min(1, Math.abs(vF) / 9)
    const highSpeedFactor = Math.max(0.15, 1 - Math.abs(vF) / (speedCap * 1.5))
    const turn =
      this.steer *
      TURN_SCALE *
      (this.params.handling / 58) *
      speedFactor *
      highSpeedFactor
    this.heading += turn * dt * Math.sign(vF)

    if (input.handbrake && Math.abs(vF) > 4) {
      this.heading += this.steer * 2.2 * dt * Math.sign(vF)
    }

    setForward()

    // grip: pull lateral velocity toward the heading
    let gripFactor = 1
    if (input.handbrake) gripFactor = 0.22
    if (roadFactor < 0.5) gripFactor = Math.min(gripFactor, 0.5)
    if (this.drifting) gripFactor = Math.min(gripFactor, 0.38)
    const vSN = this.vel.dot(right())
    this.vel.addScaledVector(
      right(),
      -vSN * Math.min(1, GRIP_STIFF * gripFactor * dt),
    )
    // steering-induced slip: car pushes outward mid-corner
    const vFN = this.vel.dot(this.forward)
    this.vel.addScaledVector(right(), this.steer * vFN * SLIP * dt)

    // speed cap
    const sp = this.vel.length()
    if (sp > speedCap) this.vel.multiplyScalar(speedCap / sp)

    // drift state
    this.speedKmh = sp * 3.6
    if (sp > 5) {
      const velAngle = Math.atan2(this.vel.x, this.vel.z)
      this.driftAngle = normalizeAngle(this.heading - velAngle)
    } else {
      this.driftAngle = 0
    }
    this.drifting =
      this.speedKmh > 25 && Math.abs(this.driftAngle) > DRIFT_DEG && vFN > 3

    // integrate
    this.pos.addScaledVector(this.vel, dt)
    this.pos.y = 0

    this.wheelSpin += (vFN / 0.34) * dt
    const rollTarget =
      this.steer * Math.sign(vFN) * Math.min(0.14, Math.abs(vFN) / 60)
    this.bodyRoll += (rollTarget - this.bodyRoll) * Math.min(1, dt * 8)
  }
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}
