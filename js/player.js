(function () {
'use strict';
const { PL_W, PL_H, MAX_SPD } = BB;

const MB = BABYLON.MeshBuilder;

let _matId = 0;
function eMat(r, g, b, scene) {
  return BB.emissiveMat('pm' + (_matId++), r, g, b, scene);
}

BB.Player = class {
  constructor(textures, scene) {
    this._scene    = scene;
    this.x3d       = 0;
    this.spd       = 80;
    this.sliding   = false;
    this.slideT    = 0;
    this.slideVX   = 0;
    this.jumping   = false;
    this.jumpT     = 0;
    this.jumpDur   = 0;
    this.jumpPeak  = 0;
    this.crashAnim = false;
    this.crashT    = 0;
    this._tiltZ    = 0;
    this._steerAngle = 0;

    this._root = new BABYLON.TransformNode('buggyRoot', scene);

    // ─── Materiali ────────────────────────────────────────────────────────────
    this._bodyMat  = eMat(0.95, 0.60, 0.05, scene); // arancione racing
    this._cabinMat = eMat(0.95, 0.60, 0.05, scene); // arancione racing
    const plateMat  = eMat(0.12, 0.52, 0.18, scene); // verde telaio inferiore
    const rollMat   = eMat(0.15, 0.72, 0.62, scene); // teal roll cage
    const seatMat   = eMat(0.55, 0.08, 0.08, scene); // rosso sedile
    const driverMat = eMat(0.42, 0.10, 0.58, scene); // viola pilota
    const helmetMat = eMat(0.88, 0.34, 0.04, scene); // arancione casco
    const bumperFMat= eMat(0.48, 0.50, 0.52, scene); // grigio paraurti ant
    const rearBMat  = eMat(0.88, 0.10, 0.10, scene); // ROSSO paraurti post
    const wheelMat  = eMat(0.10, 0.10, 0.10, scene); // nero gomma
    const hubMat    = eMat(0.52, 0.54, 0.56, scene); // argento cerchio
    const lightMat  = eMat(1.00, 0.95, 0.30, scene); // giallo faro
    const brakeMat  = eMat(0.85, 0.08, 0.08, scene); // rosso stop

    const p = (m) => { m.parent = this._root; return m; };

    // ─── Pianale / bash plate (verde) ─────────────────────────────────────────
    const plate = p(MB.CreateBox('bPlate', { width: 34, height: 3, depth: 44 }, scene));
    plate.position.y = 1.5;
    plate.material = plateMat;

    // ─── Pannelli laterali bianchi ────────────────────────────────────────────
    const panL = p(MB.CreateBox('bPanL', { width: 10, height: 7, depth: 42 }, scene));
    panL.position.set(-18, 5.5, 0);
    panL.material = this._bodyMat;

    const panR = p(MB.CreateBox('bPanR', { width: 10, height: 7, depth: 42 }, scene));
    panR.position.set( 18, 5.5, 0);
    panR.material = this._bodyMat;

    // ─── Muso / cofano anteriore ──────────────────────────────────────────────
    const hood = p(MB.CreateBox('bHood', { width: 34, height: 6, depth: 8 }, scene));
    hood.position.set(0, 5, 22);
    hood.material = this._cabinMat;

    // ─── Paraurti anteriore (grigio) ──────────────────────────────────────────
    const fBump = p(MB.CreateBox('bFB', { width: 48, height: 5, depth: 4 }, scene));
    fBump.position.set(0, 4, 26);
    fBump.material = bumperFMat;

    const fbL = p(MB.CreateBox('bFBL', { width: 4, height: 10, depth: 4 }, scene));
    fbL.position.set(-16, 8, 25.5);
    fbL.material = bumperFMat;
    const fbR = p(MB.CreateBox('bFBR', { width: 4, height: 10, depth: 4 }, scene));
    fbR.position.set( 16, 8, 25.5);
    fbR.material = bumperFMat;

    // ─── Paraurti posteriore ROSSO ────────────────────────────────────────────
    const rBump = p(MB.CreateBox('bRBump', { width: 48, height: 7, depth: 5 }, scene));
    rBump.position.set(0, 5, -24.5);
    rBump.material = rearBMat;

    // ─── Fari anteriori ───────────────────────────────────────────────────────
    [-12, 12].forEach(x => {
      const h = p(MB.CreateBox('bHL', { width: 7, height: 5, depth: 3 }, scene));
      h.position.set(x, 9, 28);
      h.material = lightMat;
    });

    // ─── Luci stop posteriori ─────────────────────────────────────────────────
    [-13, 13].forEach(x => {
      const h = p(MB.CreateBox('bBL', { width: 6, height: 4, depth: 2 }, scene));
      h.position.set(x, 8, -27);
      h.material = brakeMat;
    });

    // ─── Roll cage (teal) ─────────────────────────────────────────────────────
    // 4 montanti verticali agli angoli
    [[-13, 17], [13, 17], [-13, -16], [13, -16]].forEach(([px, pz]) => {
      const post = p(MB.CreateBox('bPost', { width: 2.5, height: 22, depth: 2.5 }, scene));
      post.position.set(px, 14, pz);
      post.material = rollMat;
    });

    // Traversa superiore posteriore
    const rbTop = p(MB.CreateBox('bRBT', { width: 28, height: 2.5, depth: 2.5 }, scene));
    rbTop.position.set(0, 26, -16);
    rbTop.material = rollMat;

    // Traversa superiore anteriore
    const rfTop = p(MB.CreateBox('bRFT', { width: 28, height: 2.5, depth: 2.5 }, scene));
    rfTop.position.set(0, 26, 17);
    rfTop.material = rollMat;

    // Barre longitudinali laterali
    [-13, 13].forEach(x => {
      const sb = p(MB.CreateBox('bSBar', { width: 2.5, height: 2.5, depth: 32 }, scene));
      sb.position.set(x, 26, 0.5);
      sb.material = rollMat;
    });

    // ─── Sedile (rosso) ───────────────────────────────────────────────────────
    const seat = p(MB.CreateBox('bSeat', { width: 16, height: 7, depth: 12 }, scene));
    seat.position.set(0, 8.5, -3);
    seat.material = seatMat;

    const seatBack = p(MB.CreateBox('bSB', { width: 16, height: 13, depth: 3 }, scene));
    seatBack.position.set(0, 14, -9);
    seatBack.material = seatMat;

    // ─── Pilota (viola) ───────────────────────────────────────────────────────
    const driver = p(MB.CreateBox('bDriver', { width: 11, height: 11, depth: 8 }, scene));
    driver.position.set(0, 18, -2);
    driver.material = driverMat;

    // Casco (arancione)
    const helmet = p(MB.CreateBox('bHelmet', { width: 9, height: 8, depth: 9 }, scene));
    helmet.position.set(0, 25, -2);
    helmet.material = helmetMat;

    // ─── Ruote fat (4) ────────────────────────────────────────────────────────
    const wDef = [[-26, 19], [26, 19], [-26, -19], [26, -19]];
    this._frontWheelNodes = [];

    wDef.forEach(([wx, wz], idx) => {
      const pivot = new BABYLON.TransformNode('wp' + idx, scene);
      pivot.parent = this._root;
      pivot.position.set(wx, 7.5, wz);
      if (idx < 2) this._frontWheelNodes.push(pivot);

      // Pneumatico fat
      const tyre = MB.CreateCylinder('bTyre',
        { diameter: 15, height: 8, tessellation: 14 }, scene);
      tyre.rotation.z = Math.PI / 2;
      tyre.parent = pivot;
      tyre.material = wheelMat;

      // Cerchio
      const rim = MB.CreateCylinder('bRim',
        { diameter: 8, height: 8.5, tessellation: 10 }, scene);
      rim.rotation.z = Math.PI / 2;
      rim.parent = pivot;
      rim.material = hubMat;

      // 5 bulloni
      for (let b = 0; b < 5; b++) {
        const angle = b * Math.PI * 2 / 5;
        const bolt = MB.CreateBox('bBolt', { width: 0.8, height: 1.8, depth: 1.8 }, scene);
        bolt.position.set(wx < 0 ? -4.5 : 4.5, Math.sin(angle) * 2.8, Math.cos(angle) * 2.8);
        bolt.parent = pivot;
        bolt.material = hubMat;
      }
    });

    // ─── Splitter anteriore (nero) ────────────────────────────────────────────
    const splitMat = eMat(0.10, 0.10, 0.12, scene);
    const splitter = p(MB.CreateBox('bSplit', { width: 54, height: 2.5, depth: 7 }, scene));
    splitter.position.set(0, 2, 27.5);
    splitter.material = splitMat;

    // ─── Passaruota allargati ─────────────────────────────────────────────────
    const flareMat = eMat(0.10, 0.10, 0.12, scene);
    [[-22, 19], [22, 19], [-22, -19], [22, -19]].forEach(([fx, fz]) => {
      const fl = p(MB.CreateBox('bFlare', { width: 7, height: 10, depth: 22 }, scene));
      fl.position.set(fx, 8, fz);
      fl.material = flareMat;
    });

    // ─── Scarichi in acciaio (2 tubi verticali al posteriore) ─────────────────
    const exhMat = eMat(0.62, 0.64, 0.68, scene);
    [-7, 7].forEach(x => {
      const pipe = p(MB.CreateCylinder('bExh', { diameter: 3.5, height: 15, tessellation: 8 }, scene));
      pipe.position.set(x, 14, -25);
      pipe.material = exhMat;
      const cap = p(MB.CreateCylinder('bExhC', { diameter: 5.5, height: 2, tessellation: 8 }, scene));
      cap.position.set(x, 22, -25);
      cap.material = exhMat;
    });

    // ─── Alettone posteriore ──────────────────────────────────────────────────
    const wingColor = eMat(0.95, 0.60, 0.05, scene);
    const wingDark  = eMat(0.12, 0.12, 0.14, scene);
    // Montanti
    [-13, 13].forEach(x => {
      const wp = p(MB.CreateBox('bWP', { width: 3, height: 14, depth: 3 }, scene));
      wp.position.set(x, 33, -20);
      wp.material = rollMat;
    });
    // Piana alettone (leggermente inclinata)
    const blade = p(MB.CreateBox('bBlade', { width: 36, height: 3, depth: 14 }, scene));
    blade.position.set(0, 40, -20);
    blade.rotation.x = 0.20;
    blade.material = wingColor;
    // Endplate
    [-19, 19].forEach(x => {
      const ep = p(MB.CreateBox('bEP', { width: 2.5, height: 9, depth: 16 }, scene));
      ep.position.set(x, 38, -20);
      ep.material = wingDark;
    });

    // ─── Barra luci sul tetto ─────────────────────────────────────────────────
    const lbarMat  = eMat(0.12, 0.12, 0.14, scene);
    const lledMat  = eMat(0.98, 0.92, 0.22, scene);
    const lbar = p(MB.CreateBox('bLBar', { width: 28, height: 5, depth: 5 }, scene));
    lbar.position.set(0, 30, 8);
    lbar.material = lbarMat;
    [-10, -5, 0, 5, 10].forEach(x => {
      const ll = p(MB.CreateBox('bLED', { width: 4, height: 3, depth: 3.5 }, scene));
      ll.position.set(x, 33.5, 8);
      ll.material = lledMat;
    });

    // ─── Raccolta parti per visibilità/effetti ────────────────────────────────
    this._bodyParts = this._root.getChildMeshes();

    // ─── Ombra durante il salto ───────────────────────────────────────────────
    this._shadow = MB.CreateDisc('shadow', { radius: 27, tessellation: 16 }, scene);
    this._shadow.rotation.x = Math.PI / 2;
    this._shadow.position.y = 0.05;
    this._shadow.isVisible  = false;
    const smat = new BABYLON.StandardMaterial('shadowMat', scene);
    smat.diffuseColor  = BABYLON.Color3.Black();
    smat.emissiveColor = BABYLON.Color3.Black();
    smat.alpha = 0.38;
    this._shadow.material = smat;

    // ─── Particelle crash ─────────────────────────────────────────────────────
    this._ps = this._buildParticles(textures.particle, scene);
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  get jumpH() {
    return this.jumping
      ? Math.sin(this.jumpT / this.jumpDur * Math.PI) * this.jumpPeak : 0;
  }

  bounds3D(dist) { return { x: this.x3d, z: dist, w: PL_W, d: PL_H }; }

  startJump(spd) {
    this.jumping  = true; this.jumpT = 0;
    const t = spd / MAX_SPD;
    this.jumpDur  = 0.4 + t * 1.0;
    this.jumpPeak = 40  + t * 30;
  }

  startSlide() {
    this.spd    *= 0.55;
    this.sliding = true;
    this.slideT  = 1.6;
    this.slideVX = (Math.random() * 2 - 1) * 110;
  }

  startCrash() {
    this.crashAnim = true;
    this.crashT    = 0;
    this._ps.emitter = new BABYLON.Vector3(this.x3d, 10, 0);
    this._ps.start();
    setTimeout(() => this._ps.stop(), 200);
    this._bodyMat.emissiveColor.set(0.88, 0.14, 0.05);
    this._cabinMat.emissiveColor.set(0.88, 0.14, 0.05);
  }

  reset() {
    this.spd       = 80;    this.sliding = false;
    this.slideT    = 0;     this.slideVX = 0;
    this.jumping   = false; this.jumpT   = 0;
    this.crashAnim = false; this.x3d     = 0;
    this._tiltZ    = 0;     this._steerAngle = 0;
    this._root.rotation.set(0, 0, 0);
    this._root.scaling.set(1, 1, 1);
    this._root.position.set(0, 0, 0);
    this._bodyParts.forEach(m => { m.isVisible = true; });
    this._bodyMat.emissiveColor.set(0.95, 0.60, 0.05);
    this._cabinMat.emissiveColor.set(0.95, 0.60, 0.05);
    this._frontWheelNodes.forEach(n => { n.rotation.y = 0; });
  }

  update(dt, keys, road, dist) {
    if (this.jumping) {
      this.jumpT += dt;
      if (this.jumpT >= this.jumpDur) { this.jumping = false; this.jumpT = 0; }
      this.spd = Math.max(this.spd - 40 * dt, 0);
    } else {
      const up = keys.has('ArrowUp')   || keys.has('KeyW');
      const dn = keys.has('ArrowDown') || keys.has('KeyS');
      if      (up) this.spd = Math.min(this.spd + 180 * dt, MAX_SPD);
      else if (dn) this.spd = Math.max(this.spd - 280 * dt, 0);
      else         this.spd = Math.max(this.spd -  40 * dt, 0);
    }

    let dxInput = 0;
    if (this.sliding) {
      this.slideT -= dt;
      if (this.slideT <= 0) { this.sliding = false; this.slideVX = 0; }
      if (keys.has('ArrowLeft')  || keys.has('KeyA')) { this.x3d -= 230 * 0.20 * dt; dxInput = -1; }
      if (keys.has('ArrowRight') || keys.has('KeyD')) { this.x3d += 230 * 0.20 * dt; dxInput =  1; }
      this.x3d += this.slideVX * dt;
      this.slideVX *= Math.pow(0.08, dt);
    } else if (!this.jumping) {
      const lf = this.spd / MAX_SPD;
      if (keys.has('ArrowLeft')  || keys.has('KeyA')) { this.x3d -= 230 * lf * dt; dxInput = -1; }
      if (keys.has('ArrowRight') || keys.has('KeyD')) { this.x3d += 230 * lf * dt; dxInput =  1; }
    }

    this.x3d = Math.max(-300, Math.min(300, this.x3d));
    this._syncMesh(dt, dxInput);
  }

  updateCrash(dt) {
    if (!this.crashAnim) return;
    this.crashT += dt;
    const prog = this.crashT / 1.4;
    this._root.rotation.set(
      -Math.sin(prog * Math.PI) * 0.30,
      0,
      Math.sin(prog * Math.PI * 5) * 0.40
    );
    const sc = 1 + Math.sin(prog * Math.PI) * 0.45;
    this._root.scaling.set(sc, sc * 1.2, sc);
    const vis = Math.floor(Date.now() / 80) % 2 === 0;
    this._bodyParts.forEach(m => { m.isVisible = vis; });
    if (this.crashT >= 1.4) {
      this.crashAnim = false;
      this._root.rotation.set(0, 0, 0);
      this._root.scaling.set(1, 1, 1);
      this._bodyParts.forEach(m => { m.isVisible = true; });
    }
  }

  draw(crashed) {
    if (crashed && !this.crashAnim) {
      const vis = Math.floor(Date.now() / 150) % 2 === 0;
      this._bodyParts.forEach(m => { m.isVisible = vis; });
    }
  }

  // ─── Privati ──────────────────────────────────────────────────────────────────

  _syncMesh(dt, dxInput) {
    const jh = this.jumpH;
    this._root.position.set(this.x3d, jh, 0);

    if (!this.crashAnim) {
      const targetTilt = -dxInput * 0.13;
      this._tiltZ += (targetTilt - this._tiltZ) * Math.min(7 * dt, 1.0);
      this._root.rotation.z = this._tiltZ;

      const targetSteer = dxInput * 0.28;
      this._steerAngle += (targetSteer - this._steerAngle) * Math.min(8 * dt, 1.0);
      this._frontWheelNodes.forEach(n => { n.rotation.y = this._steerAngle; });

      if (this.sliding) {
        this._root.rotation.x = Math.sin(Date.now() * 0.009) * 0.07;
        this._bodyMat.emissiveColor.set(1.00, 0.90, 0.10); // giallo su slide
        this._cabinMat.emissiveColor.set(1.00, 0.90, 0.10);
      } else {
        this._root.rotation.x = 0;
        this._bodyMat.emissiveColor.set(0.95, 0.60, 0.05);
        this._cabinMat.emissiveColor.set(0.95, 0.60, 0.05);
      }
    }

    if (this.jumping) {
      const h = jh / this.jumpPeak;
      this._shadow.isVisible  = true;
      this._shadow.position.x = this.x3d;
      this._shadow.scaling.set(1 + h * 0.6, 1, 1 + h * 0.6);
      this._shadow.material.alpha = 0.38 * (1 - h * 0.55);
    } else {
      this._shadow.isVisible = false;
    }
  }

  _buildParticles(partTex, scene) {
    const ps = new BABYLON.ParticleSystem('crash', 80, scene);
    ps.particleTexture = partTex;
    ps.emitter         = new BABYLON.Vector3(0, 10, 0);
    ps.minEmitBox      = new BABYLON.Vector3(-14, -6, -14);
    ps.maxEmitBox      = new BABYLON.Vector3( 14,  8,  14);
    ps.color1          = new BABYLON.Color4(0.86, 0.24, 0.08, 1);
    ps.color2          = new BABYLON.Color4(1.0,  0.78, 0.0,  1);
    ps.colorDead       = new BABYLON.Color4(0.25, 0.25, 0.25, 0);
    ps.minSize         = 3;    ps.maxSize         = 16;
    ps.minLifeTime     = 0.3;  ps.maxLifeTime     = 1.1;
    ps.emitRate        = 0;
    ps.manualEmitCount = 60;
    ps.blendMode       = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    ps.gravity         = new BABYLON.Vector3(0, -130, 0);
    ps.direction1      = new BABYLON.Vector3(-90, 80,  -90);
    ps.direction2      = new BABYLON.Vector3( 90, 220,  90);
    ps.minAngularSpeed = -4;  ps.maxAngularSpeed = 4;
    ps.minEmitPower    = 1;   ps.maxEmitPower    = 3;
    ps.updateSpeed     = 0.016;
    return ps;
  }
};

})();
