'use strict';

(async () => {
  const { ST, PH, CAM_HEIGHT, CAM_BEHIND, CAM_LOOK_FWD } = BB;

  // ─── BABYLON.JS ENGINE + SCENE ───────────────────────────────────────────────
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: false, stencil: true,
  });

  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.13, 0.38, 0.13, 1); // verde erba = sky
  scene.fogMode    = BABYLON.Scene.FOGMODE_LINEAR;
  scene.fogStart   = 550;
  scene.fogEnd     = 900;
  scene.fogColor   = new BABYLON.Color3(0.13, 0.38, 0.13);

  // Luce emisferica (illuminazione soft)
  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity   = 0.85;
  hemi.diffuse     = new BABYLON.Color3(1, 1, 0.9);
  hemi.groundColor = new BABYLON.Color3(0.2, 0.3, 0.2);

  // ─── CAMERA CHASE ────────────────────────────────────────────────────────────
  const camera = new BABYLON.TargetCamera('cam',
    new BABYLON.Vector3(0, CAM_HEIGHT, -CAM_BEHIND), scene);
  camera.setTarget(new BABYLON.Vector3(0, 0, CAM_LOOK_FWD));
  camera.fov      = 1.15;
  camera.minZ     = 2;
  camera.maxZ     = 1200;

  // ─── CARICA TEXTURE SVG ──────────────────────────────────────────────────────
  const SVG = 'svg/';
  const textures = {};
  const texKeys  = ['puddle', 'oil', 'particle'];
  for (const k of texKeys) {
    textures[k] = new BABYLON.Texture(SVG + k + '.svg', scene);
    textures[k].hasAlpha = true;
  }

  // ─── STATO APPLICAZIONE ──────────────────────────────────────────────────────
  let appSt     = ST.HS;
  let hs        = BB.loadHS();
  let cycleDiff = 1, cycleT = 0;
  let eng       = null;
  let hud       = null;
  let pendScore = 0, pendDiff = 1, entName = '';
  let paused    = false;
  const pauseEl = document.getElementById('hud-pause');

  const aud       = new BB.Audio();
  const hsScreen  = new BB.HSScreen();
  const nameScreen= new BB.NameScreen();

  // ─── INPUT ───────────────────────────────────────────────────────────────────
  const keys = new Set();
  document.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
      e.preventDefault();
    keys.add(e.code);
    _onKey(e);
  });
  document.addEventListener('keyup', e => keys.delete(e.code));

  function _onKey(e) {
    if (appSt === ST.HS) {
      if (e.key >= '1' && e.key <= '4') _initGame(parseInt(e.key));
      if (e.key === 'r' || e.key === 'R') {
        hs = { 1: [], 2: [], 3: [], 4: [] };
        BB.saveHS(hs);
        hsScreen.show(hs, cycleDiff);
      }
    } else if (appSt === ST.PLAY) {
      if (e.code === 'KeyP' && eng && eng.phase !== PH.OVER) {
        paused = !paused;
        if (paused) {
          aud.pause();
          pauseEl.classList.remove('hidden');
        } else {
          aud.resume();
          pauseEl.classList.add('hidden');
        }
        return;
      }
      if (e.code === 'KeyM' && eng) {
        aud.toggleMusic();
        return;
      }
      if (eng && eng.phase === PH.OVER && e.code === 'Enter') {
        aud.stopEngine();
        aud.stopMusic();
        if (BB.isTop(hs, eng.diff, eng.score)) {
          pendScore = eng.score; pendDiff = eng.diff; entName = '';
          appSt = ST.NAME;
          _showName();
        } else {
          appSt = ST.HS;
          _showHS();
        }
      }
    } else if (appSt === ST.NAME) {
      if (e.code === 'Enter' && entName.length > 0) {
        const name = (entName + '   ').slice(0, 3).toUpperCase();
        BB.addScore(hs, pendDiff, name, pendScore);
        cycleDiff = pendDiff;
        appSt = ST.HS;
        _showHS();
      } else if (e.code === 'Backspace') {
        entName = entName.slice(0, -1);
        nameScreen.update(entName);
      } else if (entName.length < 3 && /^[a-zA-Z0-9]$/.test(e.key)) {
        entName += e.key.toUpperCase();
        nameScreen.update(entName);
      }
    }
  }

  // ─── NAVIGAZIONE ─────────────────────────────────────────────────────────────
  function _showHS() {
    nameScreen.hide();
    if (hud) hud.hide();
    hsScreen.show(hs, cycleDiff);
  }

  function _showName() {
    hsScreen.hide();
    if (hud) hud.hide();
    nameScreen.show(pendScore);
    nameScreen.update(entName);
  }

  function _initGame(diff) {
    hsScreen.hide();
    nameScreen.hide();

    // Pulizia completa della scena (meshes, transform nodes, materiali, particle systems)
    aud.stopEngine();
    aud.stopMusic();
    scene.particleSystems.slice().forEach(ps => ps.dispose());
    scene.meshes.slice().forEach(m => m.dispose());
    scene.transformNodes.slice().forEach(n => n.dispose());
    scene.materials.slice().forEach(m => m.dispose(false)); // non dispone le texture condivise

    paused = false;
    pauseEl.classList.add('hidden');
    aud.resume();
    camTargetX = 0;

    eng = new BB.Engine(aud, scene, textures);
    eng.reset(diff);

    if (!hud) hud = new BB.HUD();
    hud.show();
    appSt = ST.PLAY;
  }

  // ─── AGGIORNAMENTO CAMERA ────────────────────────────────────────────────────
  let camTargetX = 0;

  function _updateCamera() {
    if (!eng || !eng.player) return;
    const px = eng.player.x3d;
    camTargetX += (px - camTargetX) * 0.06; // smooth follow X

    camera.position.x = camTargetX;
    camera.position.y = CAM_HEIGHT;
    camera.position.z = -CAM_BEHIND;

    // Guarda leggermente avanti e verso il centro della strada
    camera.setTarget(new BABYLON.Vector3(camTargetX * 0.25, 0, CAM_LOOK_FWD));
  }

  // ─── GAME LOOP ───────────────────────────────────────────────────────────────
  engine.runRenderLoop(() => {
    const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);

    if (appSt === ST.HS) {
      cycleT += dt;
      if (cycleT >= 4) { cycleT = 0; cycleDiff = cycleDiff % 4 + 1; hsScreen.show(hs, cycleDiff); }
    } else if (appSt === ST.PLAY && eng) {
      if (!paused) {
        eng.update(dt, keys);
        eng.draw(eng.phase === PH.CRASH);
        hud.update(eng);
        _updateCamera();
      }
    }

    scene.render();
  });

  window.addEventListener('resize', () => engine.resize());

  // ─── AVVIO ───────────────────────────────────────────────────────────────────
  _showHS();

})();
