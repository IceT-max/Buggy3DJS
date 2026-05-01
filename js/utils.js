'use strict';

// ─── LCG random ──────────────────────────────────────────────────────────────
BB.lcg = function(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

// ─── HSV → RGB (0-255) ───────────────────────────────────────────────────────
BB.hsvToRgb = function(h, s, v) {
  const hi = Math.floor(h / 60) % 6;
  const f  = h / 60 - Math.floor(h / 60);
  const p  = v * (1 - s);
  const q  = v * (1 - f * s);
  const t  = v * (1 - (1 - f) * s);
  return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][hi].map(x => Math.round(x * 255));
};

// ─── AABB 2D (compatibilità) ──────────────────────────────────────────────────
BB.rectsHit = function(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
};

// ─── AABB 3D (X-Z plane) ─────────────────────────────────────────────────────
// a, b: { x, z, w, d }  — w=larghezza(X)  d=profondità(Z)
BB.rectsHit3D = function(a, b) {
  return Math.abs(a.x - b.x) < (a.w + b.w) * 0.5 &&
         Math.abs(a.z - b.z) < (a.d + b.d) * 0.5;
};

// ─── RGB → esadecimale ────────────────────────────────────────────────────────
BB.rgbToHex = function(r, g, b) {
  return (r << 16) | (g << 8) | b;
};

BB.hexToCss = function(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
};

// ─── Crea materiale emissivo flat (nessuna illuminazione) ─────────────────────
BB.emissiveMat = function(name, r, g, b, scene) {
  const m = new BABYLON.StandardMaterial(name, scene);
  m.diffuseColor  = BABYLON.Color3.Black();
  m.emissiveColor = new BABYLON.Color3(r, g, b);
  m.specularColor = BABYLON.Color3.Black();
  m.backFaceCulling = false;
  return m;
};

// ─── Crea materiale per sprite SVG (trasparente, emissivo) ───────────────────
BB.spriteMat = function(name, texture, scene) {
  const m = new BABYLON.StandardMaterial(name, scene);
  m.diffuseTexture = texture;
  m.diffuseTexture.hasAlpha = true;
  m.useAlphaFromDiffuseTexture = true;
  m.emissiveColor = BABYLON.Color3.White();
  m.specularColor = BABYLON.Color3.Black();
  m.backFaceCulling = false;
  return m;
};
