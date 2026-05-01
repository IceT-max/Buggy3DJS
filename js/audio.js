'use strict';

BB.Audio = class {
  constructor() {
    this._ctx      = null;
    this._engGain  = null;
    this._engOsc   = null;
    this._musicSrc = null;
    this._musicActive = false;

    this._bufMusic = null;
    this._bufAcqua = null;
    this._bufOlio  = null;
    this._bufCrash = null;

    // Fetch MP3 in background (non serve AudioContext)
    this._pMusic = fetch('sfx/dune_buggy.mp3').then(r => r.arrayBuffer()).catch(() => null);
    this._pAcqua = fetch('sfx/acqua.mp3').then(r => r.arrayBuffer()).catch(() => null);
    this._pOlio  = fetch('sfx/olio.mp3').then(r => r.arrayBuffer()).catch(() => null);
    this._pCrash = fetch('sfx/crash.mp3').then(r => r.arrayBuffer()).catch(() => null);
  }

  _init() {
    if (this._ctx) return;
    this._ctx = zzfxX;
    const dec = p => p.then(ab => ab ? this._ctx.decodeAudioData(ab) : null).catch(() => null);
    this._pMusic = dec(this._pMusic); this._pMusic.then(b => { this._bufMusic = b; });
    this._pAcqua = dec(this._pAcqua); this._pAcqua.then(b => { this._bufAcqua = b; });
    this._pOlio  = dec(this._pOlio);  this._pOlio.then(b  => { this._bufOlio  = b;  });
    this._pCrash = dec(this._pCrash); this._pCrash.then(b => { this._bufCrash = b; });
  }

  _playBuf(buf, vol = 0.7) {
    if (!buf || !this._ctx) return;
    const src = this._ctx.createBufferSource();
    src.buffer = buf;
    const g = this._ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(this._ctx.destination);
    src.start();
  }

  // ─── ENGINE ────────────────────────────────────────────────────────────────
  startEngine() {
    this._init();
    this.stopEngine();
    this._engGain = this._ctx.createGain();
    this._engGain.gain.value = 0.12;

    const dist = this._ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) curve[i] = ((i / 128) - 1) ** 3;
    dist.curve = curve;

    this._engOsc = this._ctx.createOscillator();
    this._engOsc.type = 'sawtooth';
    this._engOsc.frequency.value = 50;
    this._engOsc.connect(dist);
    dist.connect(this._engGain);
    this._engGain.connect(this._ctx.destination);
    this._engOsc.start();
  }

  updateSpeed(spd) {
    if (!this._engOsc) return;
    this._engOsc.frequency.setTargetAtTime(
      40 + (spd / BB.MAX_SPD) * 130,
      this._ctx.currentTime, 0.08
    );
  }

  stopEngine() {
    if (this._engOsc) {
      try { this._engOsc.stop(); } catch (e) {}
      this._engOsc = null;
    }
    if (this._engGain) { this._engGain.disconnect(); this._engGain = null; }
  }

  // ─── MUSICA (MP3) ──────────────────────────────────────────────────────────
  startMusic() {
    this._init();
    this.stopMusic();
    this._musicActive = true;
    this._pMusic.then(buf => {
      if (!buf || !this._musicActive) return;
      this._musicSrc = this._ctx.createBufferSource();
      this._musicSrc.buffer = buf;
      this._musicSrc.loop = true;
      const gain = this._ctx.createGain();
      gain.gain.value = 0.25;
      this._musicSrc.connect(gain);
      gain.connect(this._ctx.destination);
      this._musicSrc.start();
    });
  }

  stopMusic() {
    this._musicActive = false;
    if (this._musicSrc) {
      try { this._musicSrc.stop(); } catch (e) {}
      this._musicSrc = null;
    }
  }

  toggleMusic() {
    if (this._musicActive) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
  }

  pause() {
    if (this._ctx && this._ctx.state === 'running') this._ctx.suspend();
  }

  resume() {
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
  }

  // ─── EFFETTI ───────────────────────────────────────────────────────────────
  playCrash() {
    if (this._bufCrash) { this._playBuf(this._bufCrash, 1.0); return; }
    zzfx(1.5, .1, 60,  0, .05, .4, 4, 1, 0, 0, 0, 0, 0, 9, 0, .3, 0, .8, .2);
    zzfx(.8,  .1, 80,  0, .02, .5, 3, 1, -.1);
  }

  playSlide() {
    if (this._bufOlio) { this._playBuf(this._bufOlio, 0.7); return; }
    zzfx(.7, .1, 180, 0, .05, .5, 0, 1, -.18, 0, 0, 0, 0, 0, 0, 0, 0, .6, .1);
  }

  playSplash() {
    if (this._bufAcqua) { this._playBuf(this._bufAcqua, 0.7); return; }
    zzfx(.6, .1, 350, 0, .03, .25, 0, 1, 0, 0, 0, 0, 0, 5, 0, 0, 0, .5, .05);
  }

  playTick() {
    zzfx(.5, 0, 900, 0, 0, .08, 1, 1);
  }

  playCheckpoint() {
    zzfx(.6, 0, 660, 0, .05, .12, 0, 1);
    setTimeout(() => zzfx(.6, 0, 880, 0, .05, .2, 0, 1), 130);
  }

  playCollect() {
    zzfx(.5, 0, 660, 0, .02, .1, 0, 1, .2);
  }

  playJump() {
    zzfx(.5, 0, 330, 0, .05, .2, 0, 1, .2);
  }

  playBonus() {
    [880, 1100, 1320].forEach((f, i) =>
      setTimeout(() => zzfx(.8, 0, f, 0, .05, .15, 0, 1), i * 100)
    );
  }
};
