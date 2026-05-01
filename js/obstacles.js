(function () {
'use strict';
const { OBS_SIZES } = BB;

const _texCache = new WeakMap();
function _cache(scene) {
  if (!_texCache.has(scene)) _texCache.set(scene, {});
  return _texCache.get(scene);
}

// ─── Texture procedurale: roccia ─────────────────────────────────────────────
function _rockTex(scene) {
  const c = _cache(scene);
  if (c.rock) return c.rock;
  const tex = new BABYLON.DynamicTexture('rockDynTex', { width: 128, height: 128 }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = '#8A8478'; ctx.fillRect(0, 0, 128, 128);
  // Macchie scure (ombre, incavi)
  ctx.fillStyle = '#5E5A52';
  [[8,10,28,22],[46,4,22,32],[82,14,24,20],[4,50,20,28],
   [44,46,32,22],[84,48,26,24],[12,84,22,22],[54,78,30,26],[88,86,22,20]]
    .forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));
  // Riflessi chiari
  ctx.fillStyle = '#B0AC9E';
  [[26,22,12,10],[72,32,14,9],[34,68,12,14],[66,62,16,10],[50,22,8,8]]
    .forEach(([x,y,w,h]) => ctx.fillRect(x,y,w,h));
  // Crepe sottili
  ctx.strokeStyle = '#44403A'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(18,28); ctx.lineTo(52,44); ctx.lineTo(38,72); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(72,18); ctx.lineTo(94,52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(58,72); ctx.lineTo(80,102); ctx.stroke();
  tex.update();
  return (c.rock = tex);
}

// ─── Texture procedurale: tronco ─────────────────────────────────────────────
function _logTex(scene) {
  const c = _cache(scene);
  if (c.log) return c.log;
  const tex = new BABYLON.DynamicTexture('logDynTex', { width: 128, height: 256 }, scene, false);
  const ctx = tex.getContext();
  ctx.fillStyle = '#6B3A0E'; ctx.fillRect(0, 0, 128, 256);
  ctx.strokeStyle = '#3E1E06'; ctx.lineWidth = 2;
  for (let x = 6; x < 128; x += 13) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 2, 256); ctx.stroke();
  }
  ctx.strokeStyle = '#4A2206'; ctx.lineWidth = 1;
  for (let y = 10; y < 256; y += 18) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y + 4); ctx.stroke();
  }
  tex.update();
  return (c.log = tex);
}

// ─── Texture procedurale: barile ─────────────────────────────────────────────
function _barrelTex(scene) {
  const c = _cache(scene);
  if (c.barrel) return c.barrel;
  const tex = new BABYLON.DynamicTexture('barrelDynTex', { width: 256, height: 256 }, scene, false);
  const ctx = tex.getContext();
  // Corpo giallo-arancio brillante
  ctx.fillStyle = '#F08010'; ctx.fillRect(0, 0, 256, 256);
  // Doghe verticali (legno)
  ctx.strokeStyle = '#B05A08'; ctx.lineWidth = 3;
  for (let x = 0; x < 256; x += 28) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
  }
  // Cerchi metallici scuri ad alto contrasto
  ctx.fillStyle = '#1A0A00';
  ctx.fillRect(0, 12, 256, 18);
  ctx.fillRect(0, 116, 256, 22);
  ctx.fillRect(0, 224, 256, 18);
  // Riflesso metallico sui cerchi
  ctx.fillStyle = '#4A2808';
  ctx.fillRect(0, 17, 256, 5);
  ctx.fillRect(0, 122, 256, 5);
  ctx.fillRect(0, 229, 256, 5);
  tex.update();
  return (c.barrel = tex);
}

function _matFor(name, tex, scene) {
  const m = new BABYLON.StandardMaterial(name, scene);
  m.diffuseColor    = BABYLON.Color3.Black();
  m.emissiveTexture = tex;
  m.specularColor   = BABYLON.Color3.Black();
  m.backFaceCulling = false;
  return m;
}

// ─── OBSTACLE ─────────────────────────────────────────────────────────────────
BB.Obstacle = class {
  constructor(x3d, absZ, type, textures, scene, wScale = 1) {
    this.x3d   = x3d;
    this.absZ  = absZ;
    this.type  = type;

    const base = OBS_SIZES[type];
    this._w    = base.w * wScale;
    this._h    = base.h;

    if (type === 3 || type === 4) {
      // Pozzanghera / olio — piano a terra
      const key = type === 3 ? 'puddle' : 'oil';
      this._mesh = BABYLON.MeshBuilder.CreatePlane('obs',
        { width: this._w, height: this._h, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
      this._mesh.rotation.x = Math.PI / 2;
      this._mesh.position.set(x3d, 0.12, absZ);
      this._mesh.material = BB.spriteMat('obsMat_' + type, textures[key], scene);

    } else if (type === 0) {
      // Roccia: icosfera angolosa con texture pietrosa
      this._mesh = BABYLON.MeshBuilder.CreateIcoSphere('rock',
        { radius: 22, subdivisions: 2, flat: true }, scene);
      this._mesh.scaling.set(1.0, 0.56, 0.90);
      this._mesh.position.set(x3d, 12, absZ);
      this._mesh.material = _matFor('rockMat', _rockTex(scene), scene);

    } else if (type === 1) {
      // Tronco: cilindro orizzontale con texture corteccia
      this._mesh = BABYLON.MeshBuilder.CreateCylinder('log',
        { diameter: 20, height: this._w, tessellation: 10 }, scene);
      this._mesh.rotation.z = Math.PI / 2;
      this._mesh.position.set(x3d, 10, absZ);
      this._mesh.material = _matFor('logMat', _logTex(scene), scene);

    } else if (type === 2) {
      // Barile: cilindro verticale alto con texture brillante
      this._mesh = BABYLON.MeshBuilder.CreateCylinder('barrel',
        { diameter: 26, height: 48, tessellation: 12 }, scene);
      this._mesh.position.set(x3d, 24, absZ);
      this._mesh.material = _matFor('barrelMat', _barrelTex(scene), scene);
    }
  }

  get solid() { return this.type <= 2; }

  get bounds3D() {
    return { x: this.x3d, z: this.absZ, w: this._w, d: this._h };
  }

  update(dist) {
    this._mesh.position.x = this.x3d;
    this._mesh.position.z = this.absZ - dist;
  }

  dispose() {
    if (this._mesh.material) this._mesh.material.dispose();
    this._mesh.dispose();
  }
};

})();
