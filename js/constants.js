'use strict';

const BB = window.BB || {};
window.BB = BB;

// ─── LOGICA DI GIOCO (compatibile con originale) ──────────────────────────────
BB.W       = 640;
BB.H       = 640;
BB.ROAD_W  = 380;
BB.GRAVEL  = 12;

// ─── PLAYER ───────────────────────────────────────────────────────────────────
BB.PL_W    = 36;
BB.PL_H    = 52;
BB.MAX_SPD = 620;

// ─── STATI APP ────────────────────────────────────────────────────────────────
BB.ST = { HS: 0, PLAY: 1, NAME: 2 };

// ─── FASI DI GIOCO ────────────────────────────────────────────────────────────
BB.PH = { PLAY: 0, CRASH: 1, OVER: 2 };

// ─── STORAGE KEY ──────────────────────────────────────────────────────────────
BB.HS_KEY = 'buggy3d_v1';

// ─── BONUS FLAGS ──────────────────────────────────────────────────────────────
BB.BF = {
  PTS:   [100, 200, 300, 400, 500],
  BONUS: [1000, 2000, 3000, 4000, 5000],
  TIME:  [1, 2, 3, 4, 5],   // secondi aggiunti al timer per ogni singola bandierina
  CTIME: [10, 20, 30, 40, 50], // secondi bonus al completamento del gruppo
  W:     [40, 25, 18, 12, 5],
  PH:    24,
  COL:   [0xe03232, 0xf0f0f0, 0x9b37c8, 0x2d69dc, 0x23af3c],
  CSS:   ['#e03232', '#f0f0f0', '#9b37c8', '#2d69dc', '#23af3c'],
  NAME:  ['ROSSO', 'BIANCO', 'VIOLA', 'BLU', 'VERDE'],
};

// ─── OSTACOLI ─────────────────────────────────────────────────────────────────
BB.OBS_SIZES = [
  { w: 42, h: 30 },   // 0 rock
  { w: 62, h: 20 },   // 1 log
  { w: 24, h: 34 },   // 2 barrel
  { w: 52, h: 28 },   // 3 puddle
  { w: 58, h: 32 },   // 4 oil
];

// ─── 3D WORLD ─────────────────────────────────────────────────────────────────
BB.SEG_LEN      = 8;          // lunghezza un segmento road
BB.ROAD_AHEAD   = 800;        // unità di strada generate avanti
BB.ROAD_BEHIND  = 160;        // unità di strada tenute dietro
BB.BEHIND_SEGS  = BB.ROAD_BEHIND / BB.SEG_LEN;              // 20
BB.AHEAD_SEGS   = BB.ROAD_AHEAD  / BB.SEG_LEN;              // 100
BB.SEG_COUNT    = BB.BEHIND_SEGS + BB.AHEAD_SEGS + 1;       // 121

// ─── CAMERA ───────────────────────────────────────────────────────────────────
BB.CAM_HEIGHT    = 100;   // Y camera sopra strada
BB.CAM_BEHIND    = 200;   // Z camera dietro il buggy
BB.CAM_LOOK_FWD  = 380;   // Z davanti dove guarda la camera
