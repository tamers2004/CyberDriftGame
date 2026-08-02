import { useEffect, useRef } from 'react'
import type { VehicleInput } from '../physics/vehicle'

export interface InputState {
  vehicle: VehicleInput
  pressed: Set<string>
  consume: (code: string) => boolean
}

export function useKeyboard(): InputState {
  const input = useRef<InputState>({
    vehicle: { throttle: 0, steer: 0, handbrake: false, nitro: false },
    pressed: new Set<string>(),
    consume: () => false,
  })

  useEffect(() => {
    const state = input.current
    const keys = state.pressed

    const update = () => {
      const v = state.vehicle
      let throttle = 0
      let steer = 0
      if (keys.has('KeyW') || keys.has('ArrowUp')) throttle += 1
      if (keys.has('KeyS') || keys.has('ArrowDown')) throttle -= 1
      if (keys.has('KeyA') || keys.has('ArrowLeft')) steer += 1
      if (keys.has('KeyD') || keys.has('ArrowRight')) steer -= 1
      v.throttle = throttle
      v.steer = steer
      v.handbrake = keys.has('Space')
      v.nitro = keys.has('ShiftLeft') || keys.has('ShiftRight')
    }

    const down = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' ||
        e.code.startsWith('Arrow') ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight'
      ) {
        e.preventDefault()
      }
      keys.add(e.code)
      update()
    }
    const up = (e: KeyboardEvent) => {
      keys.delete(e.code)
      update()
    }
    const blur = () => {
      keys.clear()
      update()
    }

    state.consume = (code) => {
      const had = keys.has(code)
      keys.delete(code)
      update()
      return had
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  return input.current
}
