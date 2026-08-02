import { audio } from './AudioEngine'

const BPM = 132
const SIXTEENTH = 60 / BPM / 4

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

interface Bar {
  bass: number
  arp: [number, number, number]
}

const PROGRESSION: Bar[] = [
  { bass: 33, arp: [57, 60, 64] }, // Am
  { bass: 29, arp: [53, 57, 60] }, // F
  { bass: 36, arp: [60, 64, 67] }, // C
  { bass: 31, arp: [55, 59, 62] }, // G
]

class MusicEngine {
  private ctx: AudioContext | null = null
  private musicGain: GainNode | null = null
  private delaySend: GainNode | null = null
  private noiseBuf: AudioBuffer | null = null
  private timer: number | null = null
  private nextTime = 0
  private step = 0
  private running = false
  private volume = 0.5

  start(): void {
    const ctx = audio.getContext()
    const master = audio.getMaster()
    if (!ctx || !master || this.running) return
    this.ctx = ctx

    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    this.noiseBuf = buf

    const musicGain = ctx.createGain()
    musicGain.gain.value = this.volume
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 6
    musicGain.connect(comp)
    comp.connect(master)
    this.musicGain = musicGain

    const delay = ctx.createDelay(1)
    delay.delayTime.value = SIXTEENTH * 3
    const fb = ctx.createGain()
    fb.gain.value = 0.35
    const wet = ctx.createGain()
    wet.gain.value = 0.18
    delay.connect(fb)
    fb.connect(delay)
    delay.connect(wet)
    wet.connect(musicGain)
    const send = ctx.createGain()
    send.gain.value = 1
    send.connect(delay)
    this.delaySend = send

    this.running = true
    this.nextTime = ctx.currentTime + 0.1
    this.step = 0
    this.timer = window.setInterval(() => this.tick(), 25)
  }

  stop(): void {
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.running = false
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05)
    }
  }

  setVolume(v: number): void {
    this.volume = v
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
    }
  }

  private tick(): void {
    const ctx = this.ctx
    if (!ctx) return
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.scheduleStep(this.step, this.nextTime)
      this.step = (this.step + 1) % 64
      this.nextTime += SIXTEENTH
    }
  }

  private scheduleStep(step: number, t: number): void {
    const chord = PROGRESSION[Math.floor(step / 16) % 4]
    const inBar = step % 16

    if (step % 4 === 0) this.kick(t)
    if (inBar === 4 || inBar === 12) this.clap(t)
    if (step % 2 === 0) this.hat(t, 0.028, 0.04)
    if (inBar === 6 || inBar === 14) this.hat(t, 0.12, 0.07)
    if (step % 2 === 0) {
      this.bass(chord.bass + (inBar >= 8 ? 12 : 0), t)
      this.arp(chord.arp, step, t)
    }
  }

  private kick(t: number): void {
    const ctx = this.ctx
    if (!ctx) return
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.setValueAtTime(150, t)
    o.frequency.exponentialRampToValueAtTime(45, t + 0.1)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.9, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.13)
    o.connect(g)
    g.connect(this.musicGain!)
    o.start(t)
    o.stop(t + 0.15)
  }

  private clap(t: number): void {
    const ctx = this.ctx
    if (!ctx) return
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf!
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 1.2
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.32, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
    src.connect(bp)
    bp.connect(g)
    g.connect(this.musicGain!)
    src.start(t)
    src.stop(t + 0.2)
  }

  private hat(t: number, dur: number, vol: number): void {
    const ctx = this.ctx
    if (!ctx) return
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuf!
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 8000
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.001, t + dur)
    src.connect(hp)
    hp.connect(g)
    g.connect(this.musicGain!)
    src.start(t)
    src.stop(t + dur + 0.02)
  }

  private bass(note: number, t: number): void {
    const ctx = this.ctx
    if (!ctx) return
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = midi(note)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 420
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.001, t)
    g.gain.linearRampToValueAtTime(0.5, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.001, t + SIXTEENTH * 1.6)
    o.connect(f)
    f.connect(g)
    g.connect(this.musicGain!)
    o.start(t)
    o.stop(t + SIXTEENTH * 2)
  }

  private arp(notes: [number, number, number], step: number, t: number): void {
    const ctx = this.ctx
    if (!ctx) return
    const idx = [0, 1, 2, 1][Math.floor(step / 2) % 4]
    const n = midi(notes[idx] + 12)
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = n
    const d = ctx.createOscillator()
    d.type = 'sawtooth'
    d.frequency.value = n * 1.004
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 2200
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.001, t)
    g.gain.linearRampToValueAtTime(0.12, t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.001, t + SIXTEENTH * 0.9)
    o.connect(f)
    d.connect(f)
    f.connect(g)
    g.connect(this.musicGain!)
    g.connect(this.delaySend!)
    o.start(t)
    o.stop(t + SIXTEENTH)
    d.start(t)
    d.stop(t + SIXTEENTH)
  }
}

export const music = new MusicEngine()
