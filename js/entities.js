(function () {
'use strict';
const { BF } = BB;

// ─── Converti colore hex (0xRRGGBB) in BABYLON.Color3 ────────────────────────
function hexToC3(hex) {
  return new BABYLON.Color3(
    ((hex >> 16) & 0xff) / 255,
    ((hex >>  8) & 0xff) / 255,
    ( hex        & 0xff) / 255,
  );
}

// ─── CHECKPOINT FLAG ──────────────────────────────────────────────────────────
BB.Flag = class {
  constructor(road, absZ, scene) {
    const { l, r } = road.edgesAtAbs(absZ);
    this.rl   = l;
    this.rr   = r;
    this.absZ = absZ;

    const [rv, gv, bv] = BB.hsvToRgb(Math.random() * 360, 0.9, 1.0);
    const col = new BABYLON.Color3(rv / 255, gv / 255, bv / 255);

    // Pali
    const poleMat = BB.emissiveMat('poleMat', 0.9, 0.9, 0.9, scene);
    this._poleL = BABYLON.MeshBuilder.CreateBox('pL', { width: 3, height: 54, depth: 3 }, scene);
    this._poleR = BABYLON.MeshBuilder.CreateBox('pR', { width: 3, height: 54, depth: 3 }, scene);
    this._poleL.material = poleMat;
    this._poleR.material = poleMat;

    // Banner
    const bannerMat = new BABYLON.StandardMaterial('bannerMat', scene);
    bannerMat.diffuseColor  = BABYLON.Color3.Black();
    bannerMat.emissiveColor = col;
    bannerMat.specularColor = BABYLON.Color3.Black();
    this._banner = BABYLON.MeshBuilder.CreateBox('banner', {
      width: r - l - 8, height: 14, depth: 2,
    }, scene);
    this._banner.material = bannerMat;

    this._meshes = [this._poleL, this._poleR, this._banner];
    this._setPos(l, r, absZ);
  }

  _setPos(l, r, absZ) {
    this._poleL.position.set(l + 4,        27, absZ);
    this._poleR.position.set(r - 4,        27, absZ);
    this._banner.position.set((l + r) / 2, 47, absZ);
  }

  // Area del cancello (bounds 3D)
  get gate() {
    return { x: (this.rl + this.rr) / 2, z: this.absZ,
             w: this.rr - this.rl - 24,  d: 40 };
  }

  update(dist) {
    const relZ = this.absZ - dist;
    this._poleL.position.z  = relZ;
    this._poleR.position.z  = relZ;
    this._banner.position.z = relZ;
  }

  dispose() { this._meshes.forEach(m => m.dispose()); }
};

// ─── BONUS FLAG ───────────────────────────────────────────────────────────────
BB.BonusFlag = class {
  constructor(x3d, absZ, type, textures, scene) {
    this.x3d   = x3d;
    this.absZ  = absZ;
    this.type  = type;

    const col = hexToC3(BF.COL[type]);

    // Palino (height=26, centro y=13, cima y=26)
    const paleMat = new BABYLON.StandardMaterial('bfPaleMat', scene);
    paleMat.emissiveColor = col;
    paleMat.diffuseColor  = BABYLON.Color3.Black();
    paleMat.specularColor = BABYLON.Color3.Black();
    this._pole = BABYLON.MeshBuilder.CreateBox('bfPole',
      { width: 2, height: 26, depth: 2 }, scene);
    this._pole.material = paleMat;

    // Bandierina 3D: prisma triangolare che parte dalla cima del palo
    // costruita con VertexData — base sinistra (altezza 10) → punta destra
    this._flag = _createPennant('bfFlag', 14, 10, 2.5, scene);
    this._flag.material = paleMat; // stesso colore del palo

    this._sync(0);
  }

  get bounds3D() {
    return { x: this.x3d, z: this.absZ, w: 14, d: 14 };
  }

  update(dist) { this._sync(dist); }

  _sync(dist) {
    const relZ = this.absZ - dist;
    this._pole.position.set(this.x3d, 13, relZ);  // centro palo (height=26)
    // origine pennant = angolo basso-sx → va esattamente alla cima del palo (y=26)
    this._flag.position.set(this.x3d, 26, relZ);
  }

  dispose() {
    this._pole.dispose();
    this._flag.dispose();
  }
};

// ─── Helper: pennant triangolare per bonus flag ───────────────────────────────
// base sinistra alta h, punta destra al centro, spessore d
// origine = angolo in basso a sinistra (attaccatura al palo)
function _createPennant(name, w, h, d, scene) {
  const mesh = new BABYLON.Mesh(name, scene);
  const hd = d / 2;
  const vd = new BABYLON.VertexData();

  // Vertici: base sx (x=0), punta dx (x=w, y=h/2), con spessore z=±hd
  vd.positions = [
    // Faccia frontale (z=+hd)
    0, 0, hd,    // 0 base-bottom-front
    0, h, hd,    // 1 base-top-front
    w, h/2, hd,  // 2 punta-front
    // Faccia posteriore (z=-hd)
    0, 0, -hd,   // 3 base-bottom-back
    0, h, -hd,   // 4 base-top-back
    w, h/2, -hd, // 5 punta-back
  ];

  vd.normals = [
    0,0,1,  0,0,1,  0,0,1,   // front
    0,0,-1, 0,0,-1, 0,0,-1,  // back
  ];

  vd.indices = [
    0,1,2,          // front
    3,5,4,          // back
    0,3,4, 0,4,1,   // lato sinistro (base verticale)
    1,4,5, 1,5,2,   // lato superiore
    0,2,5, 0,5,3,   // lato inferiore
  ];

  vd.uvs = [
    0,0, 0,1, 1,0.5,
    0,0, 0,1, 1,0.5,
  ];

  vd.applyToMesh(mesh);
  return mesh;
}

// ─── Helper: prisma triangolare (rampa) con VertexData ───────────────────────
// Pendenza: piatto sul retro (z=-hd, y=0) → picco sul fronte (z=+hd, y=h)
function _createRamp(name, w, h, d, scene) {
  const mesh = new BABYLON.Mesh(name, scene);
  const hw = w / 2, hd = d / 2;
  const sl = Math.sqrt(h * h + d * d);
  const ny =  d / sl;  // componente Y della normale della pendenza
  const nz = -h / sl;  // componente Z della normale della pendenza

  const vd = new BABYLON.VertexData();

  // Ogni faccia usa vertici propri per normali piatte corrette
  vd.positions = [
    // Fondo (y=0)
    -hw,0,-hd,  hw,0,-hd,  hw,0,hd,  -hw,0,hd,
    // Parete frontale verticale (z=+hd)
    -hw,0,hd,   hw,0,hd,   hw,h,hd,  -hw,h,hd,
    // Superficie inclinata (front-top → back-bottom, normale verso l'alto-retro)
    -hw,h,hd,   hw,h,hd,   hw,0,-hd,  -hw,0,-hd,
    // Lato sinistro (triangolo, x=-hw)
    -hw,0,-hd,  -hw,0,hd,  -hw,h,hd,
    // Lato destro (triangolo, x=+hw)
     hw,0,-hd,   hw,h,hd,   hw,0,hd,
  ];

  vd.normals = [
     0,-1,0,   0,-1,0,   0,-1,0,   0,-1,0,
     0, 0,1,   0, 0,1,   0, 0,1,   0, 0,1,
     0,ny,nz,  0,ny,nz,  0,ny,nz,  0,ny,nz,
    -1, 0,0,  -1, 0,0,  -1, 0,0,
     1, 0,0,   1, 0,0,   1, 0,0,
  ];

  vd.indices = [
    0,1,2,  0,2,3,
    4,5,6,  4,6,7,
    8,9,10, 8,10,11,
    12,13,14,
    15,16,17,
  ];

  vd.uvs = [
    0,0, 1,0, 1,1, 0,1,   // fondo
    0,0, 1,0, 1,1, 0,1,   // parete front
    0,1, 1,1, 1,0, 0,0,   // pendenza (V invertito: DynamicTexture flips Y)
    0,0, 1,0, 0.5,1,      // lato sx
    0,0, 0.5,1, 1,0,      // lato dx
  ];

  vd.applyToMesh(mesh);
  return mesh;
}

// ─── BUMPER (rampa di salto 3D) ───────────────────────────────────────────────
BB.Bumper = class {
  constructor(x3d, absZ, scene) {
    this.x3d  = x3d;
    this.absZ = absZ;

    this._root = new BABYLON.TransformNode('bumpRoot', scene);

    this._ramp = _createRamp('bumperRamp', 52, 9, 18, scene);
    this._ramp.parent = this._root;

    // Texture dinamica con scritta BUMPER!
    const tex = new BABYLON.DynamicTexture('bumperTex', { width: 256, height: 96 }, scene, false);
    const ctx = tex.getContext();
    ctx.fillStyle = '#FFD100';
    ctx.fillRect(0, 0, 256, 96);
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BUMPER!', 128, 48);
    tex.update();

    const mat = new BABYLON.StandardMaterial('bumperMat', scene);
    mat.diffuseColor    = BABYLON.Color3.Black();
    mat.specularColor   = BABYLON.Color3.Black();
    mat.emissiveTexture = tex;
    mat.backFaceCulling = false;
    this._ramp.material = mat;

    this._sync(0);
  }

  get bounds3D() { return { x: this.x3d, z: this.absZ, w: 52, d: 18 }; }

  update(dist) { this._sync(dist); }

  _sync(dist) {
    this._root.position.set(this.x3d, 0, this.absZ - dist);
  }

  dispose() {
    this._ramp.dispose();
    this._root.dispose();
  }
};


// ─── SOCCER BALL ─────────────────────────────────────────────────────────────
const _soccerTexCache = new WeakMap();
function _soccerTex(scene) {
  if (_soccerTexCache.has(scene)) return _soccerTexCache.get(scene);
  const tex = new BABYLON.DynamicTexture('soccerTex', { width: 256, height: 256 }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#111111';
  const penta = (cx, cy, r) => {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
              : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  };
  penta(128, 128, 30);
  penta(128,  52, 24);
  penta(128, 204, 24);
  penta( 50,  90, 24);
  penta(206,  90, 24);
  penta( 50, 166, 24);
  penta(206, 166, 24);
  tex.update();
  _soccerTexCache.set(scene, tex);
  return tex;
}

BB.Ball = class {
  constructor(x3d, absZ, scene) {
    this.x3d    = x3d;
    this.absZ   = absZ;
    this._kicked = false;
    this._ax = x3d;
    this._ay = 9;
    this._az = absZ;
    this._vx = 0;
    this._vy = 0;
    this._vz = 0;
    this._life = 0;

    this._mesh = BABYLON.MeshBuilder.CreateSphere('ball', { diameter: 18, segments: 8 }, scene);
    const mat = new BABYLON.StandardMaterial('ballMat', scene);
    mat.diffuseColor    = BABYLON.Color3.Black();
    mat.emissiveTexture = _soccerTex(scene);
    mat.specularColor   = BABYLON.Color3.Black();
    this._mesh.material = mat;
  }

  get bounds3D() { return { x: this.x3d, z: this.absZ, w: 18, d: 18 }; }
  get kicked()   { return this._kicked; }
  get isDone()   { return this._kicked && (this._ay < -15 || this._life > 3.5); }

  kick(playerSpd) {
    if (this._kicked) return;
    this._kicked = true;
    this._ax = this.x3d;
    this._ay = 9;
    this._az = this.absZ;
    this._vx = (Math.random() - 0.5) * 200;
    this._vy = 320 + Math.random() * 200;
    this._vz = playerSpd * 0.6 + 180;
  }

  update(dist, dt) {
    if (this._kicked && dt > 0) {
      this._life += dt;
      this._vy   -= 700 * dt;
      this._ax   += this._vx * dt;
      this._ay   += this._vy * dt;
      this._az   += this._vz * dt;
      this._mesh.rotation.x += 5 * dt;
      this._mesh.rotation.z += 3 * dt;
    }
    this._mesh.position.set(
      this._kicked ? this._ax : this.x3d,
      this._kicked ? this._ay : 9,
      (this._kicked ? this._az : this.absZ) - dist
    );
  }

  dispose() {
    if (this._mesh.material) this._mesh.material.dispose();
    this._mesh.dispose();
  }
};

// ─── CLOCK (sveglia da raccogliere) ───────────────────────────────────────────
const _clockTexCache = new WeakMap();
function _clockTex(scene) {
  if (_clockTexCache.has(scene)) return _clockTexCache.get(scene);
  const tex = new BABYLON.DynamicTexture('clockDynTex', { width: 128, height: 128 }, scene, false);
  const ctx = tex.getContext();
  // Sfondo giallo brillante
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, 0, 128, 128);
  // Quadrante bianco
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(64, 64, 46, 0, Math.PI * 2);
  ctx.fill();
  // Bordo nero del quadrante
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(64, 64, 46, 0, Math.PI * 2);
  ctx.stroke();
  // Tacche dei minuti
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r0 = i % 3 === 0 ? 34 : 38;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * r0, 64 + Math.sin(a) * r0);
    ctx.lineTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44);
    ctx.stroke();
  }
  // Lancetta ore (punta verso le 10)
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(64 + Math.cos(-Math.PI * 0.833) * 24, 64 + Math.sin(-Math.PI * 0.833) * 24);
  ctx.stroke();
  // Lancetta minuti (punta verso le 2)
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.lineTo(64 + Math.cos(-Math.PI * 0.333) * 36, 64 + Math.sin(-Math.PI * 0.333) * 36);
  ctx.stroke();
  // Centro
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(64, 64, 4, 0, Math.PI * 2);
  ctx.fill();
  tex.update();
  _clockTexCache.set(scene, tex);
  return tex;
}

BB.Clock = class {
  constructor(x3d, absZ, bonus, scene) {
    this.x3d   = x3d;
    this.absZ  = absZ;
    this.bonus = bonus;  // secondi (2-10)

    // Corpo: cilindro "sveglia" (piatto, come un orologio)
    this._body = BABYLON.MeshBuilder.CreateCylinder('clkBody',
      { diameter: 22, height: 10, tessellation: 18 }, scene);
    const bodyMat = new BABYLON.StandardMaterial('clkBodyMat', scene);
    bodyMat.diffuseColor    = BABYLON.Color3.Black();
    bodyMat.specularColor   = BABYLON.Color3.Black();
    bodyMat.emissiveTexture = _clockTex(scene);
    bodyMat.backFaceCulling = false;
    this._body.material = bodyMat;

    // Due campanelle in cima (sfere argentate)
    const bellMat = new BABYLON.StandardMaterial('clkBellMat', scene);
    bellMat.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.85);
    bellMat.diffuseColor  = BABYLON.Color3.Black();
    bellMat.specularColor = BABYLON.Color3.Black();
    this._bellL = BABYLON.MeshBuilder.CreateSphere('clkBellL', { diameter: 7, segments: 6 }, scene);
    this._bellR = BABYLON.MeshBuilder.CreateSphere('clkBellR', { diameter: 7, segments: 6 }, scene);
    this._bellL.material = bellMat;
    this._bellR.material = bellMat;

    // Piedini
    const feetMat = new BABYLON.StandardMaterial('clkFeetMat', scene);
    feetMat.emissiveColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    feetMat.diffuseColor  = BABYLON.Color3.Black();
    feetMat.specularColor = BABYLON.Color3.Black();
    this._footL = BABYLON.MeshBuilder.CreateCylinder('clkFL', { diameter: 4, height: 5 }, scene);
    this._footR = BABYLON.MeshBuilder.CreateCylinder('clkFR', { diameter: 4, height: 5 }, scene);
    this._footL.material = feetMat;
    this._footR.material = feetMat;

    this._sync(0);
  }

  get bounds3D() {
    return { x: this.x3d, z: this.absZ, w: 22, d: 22 };
  }

  update(dist) { this._sync(dist); }

  _sync(dist) {
    const relZ = this.absZ - dist;
    this._body.position.set(this.x3d,  5, relZ);
    this._bellL.position.set(this.x3d - 7,  16, relZ);
    this._bellR.position.set(this.x3d + 7,  16, relZ);
    this._footL.position.set(this.x3d - 7,  2.5, relZ);
    this._footR.position.set(this.x3d + 7,  2.5, relZ);
  }

  dispose() {
    if (this._body.material) this._body.material.dispose();
    if (this._bellL.material) this._bellL.material.dispose();
    this._body.dispose();
    this._bellL.dispose();
    this._bellR.dispose();
    this._footL.dispose();
    this._footR.dispose();
  }
};

})();
