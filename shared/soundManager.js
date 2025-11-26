/**
 * SoundManager - lightweight audio utility using Web Audio API.
 * Supports play, mute, volume control, cache of generated sounds.
 * @module SoundManager
 */
export class SoundManager {
  constructor() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.6;
    this.muted = false;
    this.buffers = new Map();
  }
  /** Set master volume 0..1 */
  setVolume(v) { this.masterGain.gain.value = Math.min(1, Math.max(0, v)); }
  /** Toggle mute */
  toggleMute() { this.muted = !this.muted; this.masterGain.gain.value = this.muted ? 0 : 0.6; return this.muted; }
  /** Simple tone generator */
  tone(freq=440, type='sine', dur=0.15, vol=0.5) {
    if (this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain); gain.connect(this.masterGain);
    osc.start(); osc.stop(this.ctx.currentTime + dur);
  }
  /** Play a sequence quickly */
  chord(freqs=[], type='square', step=0.06) {
    freqs.forEach((f,i)=> setTimeout(()=> this.tone(f,type,0.18,0.4), i*step*1000));
  }
}

/** Global singleton accessor */
export const sound = new SoundManager();
