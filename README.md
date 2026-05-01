# 🏜️ Buggy3D

> *"Vai forte, raccogli bandierine, evita le rocce, calcia i palloni. Semplice, no?"*

Un gioco arcade 3D scritto in JavaScript puro con **Babylon.js** — niente framework, niente build tool, niente npm, niente esistenzialismo. Apri `index.html` e si parte.

---

## 🎮 Come si gioca

Sei un buggy arancione. La strada finisce. Il timer scende. **Sopravvivi.**

| Tasto | Azione |
|-------|--------|
| ↑ / W | Accelera |
| ↓ / S | Frena (da codardo) |
| ← → / A D | Sterza |
| **P** | Pausa (per andare a prendere il caffè) |
| **M** | Silenzia la musica (per non disturbare i colleghi) |

---

## 🚧 Ostacoli

- 🪨 **Roccia** — ti distrugge. Evitala.
- 🪵 **Tronco** — ti distrugge. Evitalo.
- 🛢️ **Barile** — ti distrugge. Evitalo.
- 💧 **Pozzanghera** — ti fa slittare come uno sciocco.
- 🛢️ **Chiazza d'olio** — idem, ma peggio.
- 🟡 **Bumper** — ti lancia in aria. Utile per saltare i checkpoint senza frenare.

---

## 🏁 Oggetti da raccogliere

- 🚩 **Bandierine bonus** (5 tipi) — punti + secondi. Raccogline 5 dello stesso tipo per un mega bonus!
- ⏰ **Sveglia** — da 2 a 10 secondi di tempo in più. Casuale. La vita è casuale.
- ⚽ **Pallone da calcio** — calcialo via per puro divertimento. Ogni 5 palloni: +5 secondi.
- 🏁 **Checkpoint** — +500 punti e tempo bonus. Passaci attraverso, non intorno.

---

## 💥 Il crash

Vai contro qualcosa di solido? Perdi **10 secondi**. Il buggy lampeggia rosso e fa cose imbarazzanti con la carrozzeria. Se il timer arriva a zero durante il crash: **GAME OVER**.

---

## 🏆 Difficoltà

| Livello | Timer iniziale | Bonus checkpoint | Per masochisti |
|---------|---------------|-----------------|----------------|
| 1 - Facile | 60s | +50s | No |
| 2 - Normale | 45s | +40s | Forse |
| 3 - Difficile | 30s | +30s | Sì |
| 4 - Esperto | 20s | +20s | Decisamente sì |

---

## 🛠️ Tecnologie usate

- **Babylon.js** — motore 3D (il lavoro vero lo fa lui)
- **ZzFX** — effetti sonori procedurali da 1KB
- **ZzFXM** — musica procedurale
- **Vanilla JS** — nessuna dipendenza, nessun `node_modules` da 400MB
- **Canvas 2D** — per le texture procedurali (rocce, barili, tronchi, sveglie, palloni)

---

## 🚀 Avvio

```bash
# Opzione 1: apri direttamente
index.html  ← doppio clic

# Opzione 2: server locale (per i puristi)
npx serve .
python -m http.server
# qualsiasi cosa che serva file statici
```

> ⚠️ Non funziona aprendo il file direttamente su alcuni browser per via dei fetch degli MP3. Un server locale risolve tutto.

---

## 📁 Struttura

```
Buggy3DJS/
├── index.html          # entry point
├── css/style.css       # tutto il CSS in un file solo, come Dio comanda
├── js/
│   ├── constants.js    # numeri magici resi meno magici
│   ├── main.js         # game loop e input
│   ├── engine.js       # logica di gioco
│   ├── player.js       # il buggy arancione
│   ├── road.js         # strada procedurale infinita
│   ├── obstacles.js    # rocce, tronchi, barili
│   ├── entities.js     # tutto il resto (bandierine, bumper, sveglie, palloni)
│   ├── audio.js        # suoni e musica
│   ├── hud.js          # interfaccia
│   ├── screens.js      # schermate highscore/nome
│   ├── highscore.js    # localStorage, perché vincere va ricordato
│   └── utils.js        # funzioni utili e LCG per numeri casuali
├── sfx/                # MP3 (crash, acqua, olio, musica)
└── svg/                # sprite rimasti (pozzanghera, olio, particelle)
```

---

## 🎨 Il buggy

Costruito interamente con primitive Babylon.js (nessun modello 3D esterno):
carrozzeria arancione racing, roll cage teal, alettone posteriore, barra luci LED, passaruota allargati, due scarichi in acciaio, splitter anteriore, pilota con casco arancione. 

Molto orgoglioso di quel pilota.

---

*Fatto con ☕ e Babylon.js. Nessun buggy è stato maltrattato durante lo sviluppo.*
