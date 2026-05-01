(function () {
'use strict';

const V3 = (x, y, z) => new BABYLON.Vector3(x, y, z);
const { ROAD_W, GRAVEL, SEG_LEN, SEG_COUNT, BEHIND_SEGS, H } = BB;

BB.Road = class {
  constructor(rng, scene) {
    this._rng   = rng;
    this._scene = scene;
    this.dist   = 0;

    // Parametri curva (identici all'originale)
    this.a1 = 55 + rng() * 45;
    this.a2 = 15 + rng() * 25;
    this.p1 = 2800 + rng() * 2200;
    this.p2 = 900  + rng() * 700;
    this.f1 = rng() * Math.PI * 2;
    this.f2 = rng() * Math.PI * 2;

    // Pre-alloca path per i ribbon (riutilizzati ogni frame)
    this._leftPath    = Array.from({length: SEG_COUNT}, () => V3(0, 0, 0));
    this._rightPath   = Array.from({length: SEG_COUNT}, () => V3(0, 0, 0));
    this._gLeftPath   = Array.from({length: SEG_COUNT}, () => V3(0, 0, 0));
    this._gRightPath  = Array.from({length: SEG_COUNT}, () => V3(0, 0, 0));

    this._buildScene(scene);
    this._update(0);
  }

  // ─── Curva offset X della strada in coordinate mondo ────────────────────────
  _curve(absZ) {
    const max = (BB.W - ROAD_W) / 2 - 20;
    const off = this.a1 * Math.sin(absZ / this.p1 + this.f1)
              + this.a2 * Math.sin(absZ / this.p2 + this.f2);
    return Math.max(-max, Math.min(max, off));
  }

  // ─── Compatibilità con engine (usa y schermo → converte in Z assoluto) ───────
  edgesAt(sy) {
    const absZ = this.dist + (H - 100 - sy);
    return this.edgesAtAbs(absZ);
  }

  edgesAtAbs(absZ) {
    const cx = this._curve(absZ);
    return { l: cx - ROAD_W / 2, r: cx + ROAD_W / 2 };
  }

  edges() { return this.edgesAtAbs(this.dist); }

  // ─── Controlla se il buggy è in strada (x3d = mondo, absZ = dist) ───────────
  onRoad(x3d, absZ) {
    const { l, r } = this.edgesAtAbs(absZ);
    return (x3d - BB.PL_W / 2) >= l + 10 && (x3d + BB.PL_W / 2) <= r - 10;
  }

  // ─── Aggiorna geometria ribbon e distanza ────────────────────────────────────
  update(dist) {
    this.dist = dist;
    this._update(dist);
  }

  _update(dist) {
    for (let i = 0; i < SEG_COUNT; i++) {
      const relZ = (i - BEHIND_SEGS) * SEG_LEN;
      const absZ = dist + relZ;
      const cx   = this._curve(absZ);
      const rHalf = ROAD_W / 2;
      const gHalf = rHalf + GRAVEL;

      this._leftPath[i].set(cx - rHalf, 0.08, relZ);
      this._rightPath[i].set(cx + rHalf, 0.08, relZ);
      this._gLeftPath[i].set(cx - gHalf, 0.02, relZ);
      this._gRightPath[i].set(cx + gHalf, 0.02, relZ);
    }

    BABYLON.MeshBuilder.CreateRibbon('road', {
      pathArray: [this._leftPath, this._rightPath],
      instance:  this._roadRibbon,
    });
    BABYLON.MeshBuilder.CreateRibbon('gravel', {
      pathArray: [this._gLeftPath, this._gRightPath],
      instance:  this._gravelRibbon,
    });

    this._updateMarkings(dist);
  }

  _buildScene(scene) {
    // Terreno verde (statico, molto grande)
    const ground = BABYLON.MeshBuilder.CreateGround('ground',
      { width: 5000, height: 5000 }, scene);
    ground.material = BB.emissiveMat('groundMat', 0.13, 0.38, 0.13, scene);
    ground.position.y = -0.1;

    // Ribbon ghiaia/spalle (grigio chiaro)
    this._gravelRibbon = BABYLON.MeshBuilder.CreateRibbon('gravel', {
      pathArray: [this._gLeftPath, this._gRightPath],
      updatable: true,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    }, scene);
    this._gravelRibbon.material = BB.emissiveMat('gravelMat', 0.58, 0.50, 0.39, scene);

    // Ribbon manto stradale (grigio scuro)
    this._roadRibbon = BABYLON.MeshBuilder.CreateRibbon('road', {
      pathArray: [this._leftPath, this._rightPath],
      updatable: true,
      sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    }, scene);
    this._roadRibbon.material = BB.emissiveMat('roadMat', 0.34, 0.34, 0.34, scene);

    // Pre-alloca punti per linee bordo bianche e linea tratteggiata gialla
    this._edgePtsL = Array.from({length: SEG_COUNT}, () => V3(0, 0.18, 0));
    this._edgePtsR = Array.from({length: SEG_COUNT}, () => V3(0, 0.18, 0));
    this._dashSegs = [];  // array di coppie [start, end]
    for (let i = 0; i < SEG_COUNT; i++) this._dashSegs.push([V3(0,0,0), V3(0,0,0)]);

    const edgeMatL = new BABYLON.StandardMaterial('eml', scene);
    edgeMatL.emissiveColor = BABYLON.Color3.White();
    edgeMatL.disableLighting = true;

    this._lineL = BABYLON.MeshBuilder.CreateLines('lineL', {
      points: this._edgePtsL, updatable: true,
    }, scene);
    this._lineL.color = new BABYLON.Color3(1, 1, 1);

    this._lineR = BABYLON.MeshBuilder.CreateLines('lineR', {
      points: this._edgePtsR, updatable: true,
    }, scene);
    this._lineR.color = new BABYLON.Color3(1, 1, 1);

    this._centerDashes = BABYLON.MeshBuilder.CreateLineSystem('dashes', {
      lines: this._dashSegs, updatable: true,
    }, scene);
    this._centerDashes.color = new BABYLON.Color3(1, 0.87, 0);
  }

  _updateMarkings(dist) {
    for (let i = 0; i < SEG_COUNT; i++) {
      const relZ = (i - BEHIND_SEGS) * SEG_LEN;
      const absZ = dist + relZ;
      const cx   = this._curve(absZ);

      this._edgePtsL[i].set(cx - ROAD_W / 2 + GRAVEL, 0.18, relZ);
      this._edgePtsR[i].set(cx + ROAD_W / 2 - GRAVEL, 0.18, relZ);
    }
    BABYLON.MeshBuilder.CreateLines('lineL', {
      points: this._edgePtsL, instance: this._lineL,
    });
    BABYLON.MeshBuilder.CreateLines('lineR', {
      points: this._edgePtsR, instance: this._lineR,
    });

    // Trattini centrali gialli (60 unità on, 60 off)
    const scrollOffset = dist % 120;
    for (let i = 0; i < SEG_COUNT; i++) {
      const relZ = (i - BEHIND_SEGS) * SEG_LEN;
      const absZ = dist + relZ;
      const cx   = this._curve(absZ);
      const phase = ((relZ + scrollOffset) % 120 + 120) % 120;
      const show  = phase < 60;
      const seg   = this._dashSegs[i];
      if (show) {
        seg[0].set(cx, 0.18, relZ);
        seg[1].set(cx, 0.18, relZ + SEG_LEN);
      } else {
        seg[0].copyFrom(seg[1]); // segmento lunghezza 0 → invisibile
      }
    }
    BABYLON.MeshBuilder.CreateLineSystem('dashes', {
      lines: this._dashSegs, instance: this._centerDashes,
    });
  }
};

})();
