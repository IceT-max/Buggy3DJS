'use strict';

// ─── HIGHSCORE SCREEN ─────────────────────────────────────────────────────────
BB.HSScreen = class {
  constructor() {
    this._el    = document.getElementById('hs-screen');
    this._sub   = document.getElementById('hs-sub');
    this._list  = document.getElementById('hs-list');
    this._dots  = document.getElementById('hs-dots');

    // Crea 10 righe classifica
    this._rows = [];
    for (let i = 0; i < 10; i++) {
      const row   = document.createElement('div');
      row.className = 'hs-row';

      const rank  = document.createElement('span'); rank.className  = 'hs-rank';
      const name  = document.createElement('span'); name.className  = 'hs-name';
      const score = document.createElement('span'); score.className = 'hs-score';
      const date  = document.createElement('span'); date.className  = 'hs-date';

      rank.textContent = (i + 1) + '.';
      row.append(rank, name, score, date);
      this._list.appendChild(row);
      this._rows.push({ rank, name, score, date, row });
    }

    // Pallini difficoltà
    this._dotEls = [];
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('span');
      d.className  = 'hs-dot';
      d.textContent = '●';
      this._dots.appendChild(d);
      this._dotEls.push(d);
    }
  }

  show(hs, diff) {
    this._el.style.display = 'flex';
    const dnames = ['', 'FACILE', 'NORMALE', 'DIFFICILE', 'ESPERTO'];
    this._sub.textContent = '── CLASSIFICA  ' + dnames[diff] + ' ──';

    const list       = hs[diff] || [];
    const medalCols  = ['#ffd200', '#c0c0c0', '#b46428', '#bebee0'];
    for (let i = 0; i < 10; i++) {
      const e   = list[i];
      const col = i < 3 ? medalCols[i] : medalCols[3];
      const r   = this._rows[i];
      r.rank.style.color  = col;
      r.name.style.color  = col;
      r.score.style.color = col;
      r.name.textContent  = e ? e.name.trim() : '---';
      r.score.textContent = e ? String(e.score).padStart(6, '0') : '------';
      r.date.textContent  = e ? e.date : '';
    }

    for (let i = 0; i < 4; i++) {
      this._dotEls[i].classList.toggle('active', (i + 1) === diff);
    }
  }

  hide() { this._el.style.display = 'none'; }
};

// ─── NAME ENTRY SCREEN ────────────────────────────────────────────────────────
BB.NameScreen = class {
  constructor() {
    this._el    = document.getElementById('name-screen');
    this._score = document.getElementById('name-score');
    this._input = document.getElementById('name-input-text');
  }

  show(score) {
    this._el.classList.remove('hidden');
    this._score.textContent = 'Punteggio: ' + String(score).padStart(6, '0');
  }

  update(name) {
    this._input.textContent = (name + '___').slice(0, 3);
  }

  hide() { this._el.classList.add('hidden'); }
};
