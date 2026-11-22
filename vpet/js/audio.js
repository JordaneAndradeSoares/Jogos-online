const DigiAudio = {
  ctx: null,

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  beep(freq = 520, duration = 0.12, type = "square") {
    this.ensure();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  },
  
  evolveFanfare() {
    this.beep(440, 0.1, "sawtooth");
    setTimeout(() => this.beep(554, 0.1, "sawtooth"), 110);
    setTimeout(() => this.beep(659, 0.1, "sawtooth"), 220);
    setTimeout(() => this.beep(880, 0.25, "triangle"), 330);
  }
};
