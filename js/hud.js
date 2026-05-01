'use strict';

const { MAX_SPD, BF, PH } = BB;

BB.HUD = class {
  constructor() {
    this._score    = document.getElementById('hud-score');
    this._timer    = document.getElementById('hud-timer');
    this._speed    = document.getElementById('hud-speed');
    this._diff     = document.getElementById('hud-diff');
    this._flags    = document.getElementById('hud-flags');
    this._bonus    = document.getElementById('hud-bonus');
    this._gameover = document.getElementById('hud-gameover');
    this._goScore  = this._gameover.querySelector('.go-score');
    this._hud      = document.getElementById('hud');

    // Crea righe bandierine
    this._flagRows = [];
    const cols = BF.CSS;
    for (let i = 0; i < 5; i++) {
      const div = document.createElement('div');
      div.className = 'hud-flag-row';
      div.style.color = cols[i];
      div.textContent = '☆☆☆☆☆';
      this._flags.appendChild(div);
      this._flagRows.push(div);
    }
  }

  show()  { this._hud.classList.remove('hidden'); }
  hide()  { this._hud.classList.add('hidden'); }

  update(eng) {
    const dnames  = ['', 'FACILE', 'NORMALE', 'DIFFICILE', 'ESPERTO'];
    const isOver  = eng.phase === PH.OVER;
    const isCrash = eng.phase === PH.CRASH;

    // Score
    this._score.textContent = 'SCORE  ' + String(eng.score).padStart(6, '0');

    // Timer (tutti i livelli)
    if (!isOver) {
      const t = Math.max(0, eng.cpTimer);
      this._timer.textContent = 'TEMPO ' + Math.ceil(t);
      this._timer.style.color =
        t <= 5  ? '#ff5050' :
        t <= 15 ? '#ffc800' : '#ffffff';
      this._timer.style.display = '';
    } else {
      this._timer.style.display = 'none';
    }

    // Velocità
    const kmh = Math.round(eng.player.spd / MAX_SPD * 200);
    this._speed.textContent = kmh + ' km/h';

    // Difficoltà
    this._diff.textContent = dnames[eng.diff];

    // Bandierine bonus
    for (let i = 0; i < 5; i++) {
      const c = eng.fcnt[i];
      this._flagRows[i].textContent = '★'.repeat(c) + '☆'.repeat(5 - c);
    }

    // Testo bonus
    if (eng.bonusTxt) {
      this._bonus.textContent  = eng.bonusTxt;
      this._bonus.style.color  = BB.hexToCss(eng.bonusCol);
      this._bonus.classList.remove('hidden');
    } else {
      this._bonus.classList.add('hidden');
    }

    // Game Over overlay
    if (isOver) {
      this._goScore.textContent = 'Punteggio: ' + String(eng.score).padStart(6, '0');
      this._gameover.classList.remove('hidden');
    } else {
      this._gameover.classList.add('hidden');
    }
  }
};
