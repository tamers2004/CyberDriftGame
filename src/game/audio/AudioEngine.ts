class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private engineOsc: OscillatorNode | null = null
  private engineSub: OscillatorNode | null = null
  private engineFilter: BiquadFilterNode | null = null
  private engineGain: GainNode | null = null
  private nitroOsc: OscillatorNode | null = null
  private nitroGain: GainNode | null = null
  private skidGain: GainNode | null = null
  private volume = 0.7

  init(): void {
    if (this.ctx) {
      void this.ctx.resume()
      return
    }
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new Ctx()
    this.ctx = ctx
    const master = ctx.createGain()
    master.gain.value = this.volume
    master.connect(ctx.destination)
    this.master = master

    // engine: triangle + sub sine (smooth sporty hum, not buzzy)
    const engine = ctx.createOscillator()
    engine.type = 'triangle'
    engine.frequency.value = 60
    const sub = ctx.createOscillator()
    sub.type = 'sine'
    sub.frequency.value = 30
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 220
    const eg = ctx.createGain()
    eg.gain.value = 0
    engine.connect(filter)
    sub.connect(filter)
    filter.connect(eg)
    eg.connect(master)
    engine.start()
    sub.start()
    this.engineOsc = engine
    this.engineSub = sub
    this.engineFilter = filter
    this.engineGain = eg

    // nitro layer
    const no = ctx.createOscillator()
    no.type = 'triangle'
    no.frequency.value = 90
    const ng = ctx.createGain()
    ng.gain.value = 0
    no.connect(ng)
    ng.connect(master)
    no.start()
    this.nitroOsc = no
    this.nitroGain = ng

    // skid noise
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const sf = ctx.createBiquadFilter()
    sf.type = 'bandpass'
    sf.frequency.value = 700
    const sg = ctx.createGain()
    sg.gain.value = 0
    src.connect(sf)
    sf.connect(sg)
    sg.connect(master)
    src.start()
    this.skidGain = sg
  }

  setEngine(speedRatio: number, throttle: number, boost: number): void {
    if (
      !this.ctx ||
      !this.engineOsc ||
      !this.engineSub ||
      !this.engineGain ||
      !this.engineFilter
    )
      return
    const rpm = 55 + throttle * 45 + speedRatio * 70 + boost * 40
    const t = this.ctx.currentTime
    this.engineOsc.frequency.setTargetAtTime(rpm, t, 0.1)
    this.engineSub.frequency.setTargetAtTime(rpm / 2, t, 0.1)
    this.engineFilter.frequency.setTargetAtTime(
      220 + rpm * 3 + speedRatio * 180,
      t,
      0.1,
    )
    const g =
      0.006 + Math.abs(throttle) * 0.022 + speedRatio * 0.012 + boost * 0.015
    this.engineGain.gain.setTargetAtTime(g, t, 0.1)
  }

  setSkid(level: number): void {
    if (!this.ctx || !this.skidGain) return
    this.skidGain.gain.setTargetAtTime(
      Math.min(0.11, level * 0.1),
      this.ctx.currentTime,
      0.05,
    )
  }

  setNitro(on: boolean): void {
    if (!this.ctx || !this.nitroGain || !this.nitroOsc) return
    this.nitroGain.gain.setTargetAtTime(
      on ? 0.035 : 0,
      this.ctx.currentTime,
      0.08,
    )
    this.nitroOsc.frequency.setTargetAtTime(
      on ? 160 : 90,
      this.ctx.currentTime,
      0.05,
    )
  }

  click(): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'triangle'
    o.frequency.setValueAtTime(520, ctx.currentTime)
    o.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.08)
    g.gain.setValueAtTime(0.06, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09)
    o.connect(g)
    g.connect(master)
    o.start()
    o.stop(ctx.currentTime + 0.1)
  }

  setVolume(v: number): void {
    this.volume = v
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
    }
  }

  getContext(): AudioContext | null {
    return this.ctx
  }

  getMaster(): GainNode | null {
    return this.master
  }
}

export const audio = new AudioEngine()
