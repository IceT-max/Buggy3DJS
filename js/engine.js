(function () {
'use strict';
const { ST, PH, BF, H } = BB;

const SPAWN_AHEAD = H - 100 + 60; // ~600: distanza di spawn avanti (compatibile originale)
const CULL_BEHIND = 120;           // unità dietro il buggy prima di rimuovere

BB.Engine = class {
  constructor(aud, scene, textures) {
    this._aud      = aud;
    this._scene    = scene;
    this._textures = textures;

    this.road    = null;
    this.player  = null;
    this.obs     = [];
    this.flags   = [];
    this.bumpers = [];
    this.bflags  = [];
    this.clocks  = [];
    this.balls   = [];

    this.score     = 0;
    this.phase     = PH.PLAY;
    this.diff      = 1;
    this.cpTimer   = 0;
    this.cpExpired = false;
    this.dist      = 0;    // distanza totale percorsa (= Z virtuale del buggy)
    this.nextObs   = 200;
    this.nextFlag  = 3500;
    this.nextBump  = 1000;
    this.nextBF    = 180;
    this.nextClock = 600;
    this.crashT    = 0;
    this.bonusT    = 0;
    this.bonusTxt  = null;
    this.bonusCol  = 0xffffff;
    this.fcnt      = [0, 0, 0, 0, 0];
    this.fcomp     = [0, 0, 0, 0, 0];
    this.bcnt      = 0;
    this._rng      = null;
  }

  get cpLimit() {
    return this.diff === 1 ? 60 : this.diff === 2 ? 45 : this.diff === 3 ? 30 : 20;
  }

  get cpBonus() {
    return this.diff === 1 ? 50 : this.diff === 2 ? 40 : this.diff === 3 ? 30 : 20;
  }

  reset(diff = 1) {
    this.diff = Math.max(1, Math.min(4, diff));

    // Distruggi entità precedenti
    [...this.obs, ...this.flags, ...this.bumpers, ...this.bflags, ...this.clocks, ...this.balls].forEach(e => e.dispose());

    this.score = 0; this.phase = PH.PLAY;
    this.cpExpired = false; this.cpTimer = this.cpLimit; this.dist = 0;
    this.nextObs = 200; this.nextFlag = 3500; this.nextBump = 1000; this.nextBF = 180; this.nextClock = 600; this.nextBall = 900;
    this.bonusT = 0; this.bonusTxt = null; this.fcnt = [0, 0, 0, 0, 0]; this.fcomp = [0, 0, 0, 0, 0]; this.bcnt = 0;
    this.obs = []; this.flags = []; this.bumpers = []; this.bflags = []; this.clocks = []; this.balls = [];

    this._rng   = BB.lcg(Date.now());
    this.road   = new BB.Road(this._rng, this._scene);
    this.player = new BB.Player(this._textures, this._scene);

    this._aud.startEngine();
    this._aud.startMusic();
  }

  update(dt, keys) {
    this._lastDt = dt;
    if (this.phase === PH.OVER) return;

    if (this.phase === PH.CRASH) {
      this.player.updateCrash(dt);
      this.crashT -= dt;
      if (this.crashT <= 0) {
        this.phase = this.cpExpired ? PH.OVER : PH.PLAY;
        if (this.phase === PH.PLAY) {
          this.player.reset();
          this._aud.startEngine();
          this.cpExpired = false;
        } else {
          this._aud.stopMusic();
        }
      }
      // Aggiorna ugualmente la strada
      this.road.update(this.dist);
      this._updateEnts();
      return;
    }

    // Countdown timer (tutti i livelli)
    const prev = this.cpTimer;
    this.cpTimer -= dt;
    if (this.cpTimer <= 0) { this.cpTimer = 0; this.cpExpired = true; this._crash(); return; }
    if (this.cpTimer <= 5 && Math.floor(prev) !== Math.floor(this.cpTimer))
      this._aud.playTick();

    if (this.bonusT > 0) { this.bonusT -= dt; if (this.bonusT <= 0) this.bonusTxt = null; }

    const spd = this.player.spd;
    this.dist += spd * dt;
    this._aud.updateSpeed(spd);
    this.road.update(this.dist);
    this.player.update(dt, keys, this.road, this.dist);
    this.score += Math.floor(spd * dt * 0.06);

    // Fuori strada: rallenta invece di crashare
    if (!this.player.jumping && !this.road.onRoad(this.player.x3d, this.dist)) {
      this.player.spd = Math.max(this.player.spd - 480 * dt, 50);
    }

    this._spawn();
    this._updateEnts();
    this._collide();
  }

  // ─── Disegno (chiamato ogni frame anche durante CRASH) ───────────────────────
  draw(crashed) {
    this.player.draw(crashed);
  }

  _spawn() {
    const rng = this._rng;

    if (this.dist >= this.nextObs) {
      const { l, r } = this.road.edgesAt(-60);
      const rv = rng();
      const t  = rv < .22 ? 0 : rv < .44 ? 1 : rv < .55 ? 2 : rv < .78 ? 3 : 4;
      const wScale = t === 1 ? ([1,1,2,3][Math.floor(rng() * 4)]) : 1;
      const hw  = (BB.OBS_SIZES[t].w * wScale) / 2 + 5;
      const x3d = l + hw + rng() * Math.max(0, r - l - hw * 2);
      const absZ = this.dist + SPAWN_AHEAD;
      const ob  = new BB.Obstacle(x3d, absZ, t, this._textures, this._scene, wScale);
      this.obs.push(ob);
      const gap = Math.max(70, 240 - this.dist * 0.0015);
      this.nextObs = this.dist + gap * (0.7 + rng() * 0.6);
    }

    if (this.dist >= this.nextFlag) {
      const absZ = this.dist + SPAWN_AHEAD;
      const fl = new BB.Flag(this.road, absZ, this._scene);
      this.flags.push(fl);
      this.nextFlag = this.dist + 4500 + rng() * 4000;
    }

    if (this.dist >= this.nextBump) {
      const { l, r } = this.road.edgesAt(-60);
      const x3d  = l + 30 + rng() * (r - l - 60);
      const absZ = this.dist + SPAWN_AHEAD;
      const bmp  = new BB.Bumper(x3d, absZ, this._scene);
      this.bumpers.push(bmp);
      this.nextBump = this.dist + 1800 + rng() * 2200;
    }

    if (this.dist >= this.nextBF) {
      const rv = rng() * 100; let acc = 0, tp = 0;
      for (let i = 0; i < BF.W.length; i++) { acc += BF.W[i]; if (rv < acc) { tp = i; break; } }
      const { l, r } = this.road.edgesAt(-60);
      const x3d  = l + 20 + rng() * (r - l - 40);
      const absZ = this.dist + SPAWN_AHEAD;
      const bf   = new BB.BonusFlag(x3d, absZ, tp, this._textures, this._scene);
      this.bflags.push(bf);
      this.nextBF = this.dist + 250 + rng() * 350;
    }

    if (this.dist >= this.nextBall) {
      const { l, r } = this.road.edgesAt(-60);
      const x3d  = l + 20 + rng() * (r - l - 40);
      const absZ = this.dist + SPAWN_AHEAD;
      this.balls.push(new BB.Ball(x3d, absZ, this._scene));
      this.nextBall = this.dist + 1500 + rng() * 2000;
    }

    if (this.dist >= this.nextClock) {
      const { l, r } = this.road.edgesAt(-60);
      const x3d   = l + 20 + rng() * (r - l - 40);
      const absZ  = this.dist + SPAWN_AHEAD;
      const bonus = 2 + Math.floor(rng() * 9);  // 2–10 secondi
      const clk   = new BB.Clock(x3d, absZ, bonus, this._scene);
      this.clocks.push(clk);
      this.nextClock = this.dist + 1800 + rng() * 2000;
    }
  }

  _updateEnts() {
    const _cull = (arr) => arr.filter(e => {
      e.update(this.dist);
      if (this.dist - e.absZ > CULL_BEHIND) {
        e.dispose();
        return false;
      }
      return true;
    });
    this.obs     = _cull(this.obs);
    this.flags   = _cull(this.flags);
    this.bumpers = _cull(this.bumpers);
    this.bflags  = _cull(this.bflags);
    this.clocks  = _cull(this.clocks);

    const dt = this._lastDt || 0.016;
    this.balls = this.balls.filter(b => {
      b.update(this.dist, dt);
      if (b.isDone) { b.dispose(); return false; }
      if (!b.kicked && this.dist - b.absZ > CULL_BEHIND) { b.dispose(); return false; }
      return true;
    });
  }

  _collide() {
    const pb = this.player.bounds3D(this.dist);

    if (!this.player.jumping) {
      // Bumper → salto
      for (let i = this.bumpers.length - 1; i >= 0; i--) {
        const b3 = this.bumpers[i].bounds3D;
        if (!BB.rectsHit3D(b3, pb)) continue;
        this.player.startJump(this.player.spd);
        this._aud.playJump();
        this.bumpers[i].dispose();
        this.bumpers.splice(i, 1);
        return;
      }

      // Ostacoli
      for (let i = this.obs.length - 1; i >= 0; i--) {
        const o  = this.obs[i];
        if (!BB.rectsHit3D(o.bounds3D, pb)) continue;
        if (o.solid) { this._crash(); return; }
        if (!this.player.sliding) {
          this.player.startSlide();
          o.type === 3 ? this._aud.playSplash() : this._aud.playSlide();
          o.dispose();
          this.obs.splice(i, 1);
        }
      }
    }

    // Checkpoint flag (sempre, anche in volo)
    for (let i = this.flags.length - 1; i >= 0; i--) {
      const g = this.flags[i].gate;
      if (!BB.rectsHit3D(g, pb)) continue;
      this.score += 500;
      this._aud.playCheckpoint();
      this.cpTimer += this.cpBonus;
      this.flags[i].dispose();
      this.flags.splice(i, 1);
    }

    // Bonus flags (sempre)
    for (let i = this.bflags.length - 1; i >= 0; i--) {
      const b3 = this.bflags[i].bounds3D;
      if (!BB.rectsHit3D(b3, pb)) continue;
      this._collectBF(this.bflags[i].type);
      this.bflags[i].dispose();
      this.bflags.splice(i, 1);
    }

    // Palloni (calciabili sempre, anche in volo)
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      if (b.kicked) continue;
      if (!BB.rectsHit3D(b.bounds3D, pb)) continue;
      b.kick(this.player.spd);
      this.score += 50;
      this.bcnt++;
      if (this.bcnt >= 5) {
        this.bcnt     = 0;
        this.cpTimer += 5;
        this.bonusTxt = `BONUS PALLONE!  +5s`;
        this.bonusCol = 0xffffff;
        this.bonusT   = 2.5;
        this._aud.playBonus();
      } else {
        this._aud.playJump();
      }
    }

    // Sveglie (sempre)
    for (let i = this.clocks.length - 1; i >= 0; i--) {
      if (!BB.rectsHit3D(this.clocks[i].bounds3D, pb)) continue;
      this._collectClock(this.clocks[i]);
      this.clocks[i].dispose();
      this.clocks.splice(i, 1);
    }
  }

  _collectBF(t) {
    this.score += BF.PTS[t];
    this.cpTimer += BF.TIME[t];
    this.fcnt[t]++;
    if (this.fcnt[t] >= 5) {
      this.fcnt[t]  = 0;
      this.fcomp[t]++;
      this.score    += BF.BONUS[t];
      this.cpTimer  += BF.CTIME[t];
      this.bonusTxt = `+${BF.BONUS[t].toLocaleString()}  BONUS ${BF.NAME[t]}!  +${BF.CTIME[t]}s`;
      this.bonusCol = BF.COL[t];
      this.bonusT   = 2.5;
      this._aud.playBonus();
    } else {
      this._aud.playCollect();
    }
  }

  _collectClock(clk) {
    this.cpTimer  += clk.bonus;
    this.bonusTxt  = `BONUS! +${clk.bonus} secondi!`;
    this.bonusCol  = 0xFFD700;
    this.bonusT    = 2.5;
    this._aud.playBonus();
  }

  _crash() {
    // Ogni botta costa 10 secondi (non si applica se il timer era già scaduto)
    if (!this.cpExpired) {
      this.cpTimer = Math.max(0, this.cpTimer - 10);
      if (this.cpTimer <= 0) this.cpExpired = true;
    }
    this.phase  = PH.CRASH;
    this.crashT = 2.0;
    [...this.obs, ...this.bumpers].forEach(e => { e.dispose(); });
    this.obs     = [];
    this.bumpers = [];
    this.player.startCrash();
    this._aud.stopEngine();
    this._aud.playCrash();
  }
};

})();
