# 🟡 Pac-Man

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

Ein schlankes, typsicheres Pac-Man mit **React 18**, **Vite** und **TypeScript** — spielbar mit der Tastatur oder auf dem Handy, rasterbasiertes DOM, kein Canvas, keine Game-Engine.
Läuft für sich allein **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**.

[![CI](https://github.com/ZoliQua/Pac-Man-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Pac-Man-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Inhalt

- [Die Zoltan's-Arcade-Familie](#%EF%B8%8F-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Steuerung](#%EF%B8%8F-steuerung)
- [Punkte & Statistik](#-punkte--statistik)
- [Automatisches Speichern & Fortsetzen](#-automatisches-speichern--fortsetzen)
- [Einbinden in Arcade-Game-Center](#-einbinden-in-arcade-game-center)
- [So funktioniert es](#-so-funktioniert-es)
- [Skripte](#-skripte)
- [Architektur](#%EF%B8%8F-architektur)
- [Mitmachen](#-mitmachen)
- [Lizenz](#%EF%B8%8F-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenständiges Repo, das sich auch ins Portal einklinkt. Alle teilen sich ein Designsystem, ein Punktemodell und ein Speicherformat über das eingebundene Kit [`src/arcade/`](./src/arcade).

| Spiel | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistik, Bestenliste |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reaktion |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 **Pac-Man** (dieses Repo) | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Vier gewinnt | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitär | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🌰 Schnapsen | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 🟡 **Klassisches Pac-Man** auf einem 28×31-Labyrinth mit Punkten, vier Kraftpillen, einem Geisterhaus und einem Tunnel, der auf die andere Seite führt
- 👻 **Vier Geister mit echter KI** — Blinky, Pinky, Inky und Clyde, jeder mit eigenem Jagdziel und dem klassischen Wechsel zwischen Zerstreuen und Jagen
- 😱 **Erschreckt & gefressen** — Kraftpillen färben die Geister blau (fressen bringt 200 → 400 → 800 → 1600); gefressene Geister werden zu Augen, die nach Hause eilen und wieder erscheinen
- ❤️ **Leben & Level** — 3 Leben; ist das Labyrinth leer, beginnt das nächste Level (Punkte und Leben bleiben, das Schreckfenster wird kürzer)
- 🎨 **Symbolstile** — **normal** (klassische Arcade), **Nebel** (ein gedämpfter, gruseliger Look) oder **Zahn** (siehe unten), jederzeit umschaltbar, auch mitten im Spiel; rein optisch
- 💾 **Automatisches Speichern & Fortsetzen** — schließ den Tab mitten im Spiel und mach später genau dort weiter, samt Geistern
- 🏆 **Gemeinsame Arcade-Statistik** — Bestwert, Spiele, Gesamtzeit, geteilt mit dem Portal
- ⏱️ **Spielzeit, die bei Pause anhält**
- 🌗 **Dunkles / helles Design**, gemeinsam mit allen Arcade-Spielen (Taste **T**)
- 🌍 **Drei Sprachen** — Englisch, Ungarisch und Deutsch; umschaltbar in der oberen Leiste oder in den Einstellungen (auch `?lang=en|hu|de` für Links); Zahlen folgen der Tausendertrennung der Sprache
- 🦷 **Zahnmodus** — ein Schalter „Fogas mód” / "Dental mode" / „Zahnmodus” in den Einstellungen, standardmäßig aus (oder `?dental=1`), gilt für die ganze Arcade: ein dritter Symbolstil — Pac-Man ist ein lächelnder Zahn, die Punkte sind Zahnpasta, die Kraftpille eine Zahnbürste und die Geister Bakterien; nur die Darstellung
- 📖 **Regeln** — ein Regeln-Knopf öffnet die Regeln direkt im Spiel (Ziel, so spielst du, Regeln, Punktewertung, Zahnmodus, auf dem Handy) mit einem Bild davon, was eine Kraftpille mit einem Geist macht; beim Öffnen pausiert das Spiel
- 🏁 **Vorzeitig beenden** — beende eine Runde, wann du willst; nach einer Rückfrage kommt der Punktestand aus der Punkteanzeige in die Bestenliste
- 📱 **Touch-Steuerung** — wisch über das Labyrinth oder nimm das Pfeilfeld auf dem Bildschirm; Abbiegungen werden gemerkt, bis sie möglich sind
- ⛶ **Vollbild** — das Labyrinth füllt den Bildschirm; auf dem iPhone legt sich das Spiel stattdessen über die Seite (Safari hat dort keine Vollbild-Schnittstelle)
- 🤖 **Demo im Attract-Modus** (`<PacmanDemo />`) — die echte Engine, gesteuert von einem Autopiloten mit geisterbewusster Breitensuche, auf der Startseite des Portals
- ⌨️ **Tastatur oder Touch**; Tastenkürzel werden ignoriert, solange du in einem Formularfeld tippst
- 🧪 **Getestet** — Unit-Tests der reinen Logik plus Komponententests mit Vitest + Testing Library

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/Pac-Man-Game.git
cd Pac-Man-Game
npm install
npm run dev          # http://localhost:5173
```

Produktions-Build: `npm run build && npm run preview`. Der Build nutzt relative Pfade, daher lässt sich `dist/` aus jedem Unterordner ausliefern.

## ⌨️ Steuerung

| Taste | Aktion |
| --- | --- |
| ⬆️ ⬇️ ⬅️ ➡️ / **W A S D** | Steuern (eine Richtungstaste startet auch ein neues Spiel) |
| **Leertaste** / **Enter** | Start · Pause · weiter |
| **P** / **Esc** | Pause / weiter |
| **R** | Neustart |
| **T** | Dunkles / helles Design umschalten (eigenständige Seite) |

Eine Eingabe merkt sich nur die *gewünschte* Richtung; die Logik biegt am ersten Feld ab, an dem das erlaubt ist, und Pac-Man bleibt an Wänden einfach stehen.

Über dem Labyrinth sitzen drei Knöpfe: **Regeln** (öffnet die Regeln und pausiert das Spiel; R bleibt die
Neustart-Taste, daher hat der Knopf kein Tastenkürzel), **Beenden** (beendet die Runde nach einer Rückfrage vorzeitig —
der angezeigte Punktestand kommt in die Wertung) und **Vollbild**.

### 📱 Auf dem Handy

Wisch über das Labyrinth zum Steuern oder nimm das Pfeilfeld darunter; eine zu früh gewählte Abbiegung wartet auf die
nächste Öffnung, genau wie bei den Pfeiltasten. Die mittlere Taste startet, pausiert und setzt fort. Das Labyrinth
scrollt oder zoomt die Seite nie unter deinem Finger. **Vollbild** gibt dem Spiel den ganzen Bildschirm; auf dem
iPhone blendet auch das Hinzufügen der Seite zum Home-Bildschirm (Teilen → Zum Home-Bildschirm) die Browserleisten aus.

## 🎯 Punkte & Statistik

| Ereignis | Punkte |
| --- | --- |
| Punkt | 10 |
| Kraftpille | 50 |
| Geist (erschreckt) | 200 → 400 → 800 → 1600 |

Die Geisterreihe beginnt mit jeder Kraftpille von vorn, nicht mit jedem Level. Das Schreckfenster dauert in Level 1
6 s und wird pro Level um etwa 0,5 s kürzer (mindestens 1 s). Die Level wiederholen sich endlos, daher endet jede
Runde mit dem letzten verlorenen Leben (Ergebnis `over`) — oder wenn du auf **Beenden** drückst: Dann wird der in
diesem Moment angezeigte Punktestand gewertet (Ergebnis `finished`, auch bei 0 Punkten), und die Spielende-Karte
zeigt *Vorzeitig beendet*.

Am Ende einer Runde speichert das Kit sie genau einmal in `localStorage` unter `arcade.stats.pacman`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
Der alte Schlüssel `pacman.highScore` wird übernommen und synchron gehalten, damit ältere Versionen ihren Rekord behalten.

### 🎨 Symbolstile

Zwei Symbolsätze gestalten Pac-Man, die Geister, die Punkte und die Wände um. Ein Wechsel setzt das Spielfeld **nie**
zurück und ändert keine Regel, Trefferfläche, Geschwindigkeit oder Sichtbarkeit — es ist ein Symbolsatz, kein
Nebel-des-Krieges-Modus.

- **normal** — gelber Pac-Man mit animiertem Mund; Blinky rot / Pinky rosa / Inky türkis / Clyde orange; cremefarbene Punkte; pulsierende Kraftpillen; blaue Wände; erschreckt = blau (blinkt kurz vor Ablauf weiß); gefressen = Augen.
- **Nebel** — blasser, geisterhafter Pac-Man; entsättigte Schemen als Geister (trotzdem unterscheidbar); schwach leuchtende Kugeln als Punkte; neblige Kraftpillen; dunkle schiefergraue Wände mit sanftem Schimmer.

Die Wahl wird unter `pacman.iconTheme` gespeichert (Standard `normal`).

## 💾 Automatisches Speichern & Fortsetzen

Solange eine Runde läuft, wird sie etwa einmal pro Sekunde gespeichert und zusätzlich, wenn die Seite verborgen oder
das Spiel entfernt wird (Schlüssel `arcade.session.pacman`, mit Schema-Version). Der Spielstand enthält alles: die
übrigen Punkte, Pac-Man, alle vier Geister mit Modus und Position, die Zeitgeber für Zerstreuen/Jagen und Schrecken,
Leben, Level und Punkte. Beim Laden wird er streng geprüft (`src/logic/persist.ts`) und verworfen, wenn etwas nicht
stimmt. Nach dem Neuladen erscheint **Willkommen zurück** mit der wiederhergestellten Runde in Pause. **Verwerfen**
neben dem Hinweis *Automatisch gespeichert* löscht den Spielstand. Beendete Runden löschen ihren Spielstand von selbst.

## 🧩 Einbinden in Arcade-Game-Center

```tsx
import { PacmanGame, PacmanDemo } from '@arcade/pacman';

<PacmanGame
  embedded                                   // Seitentitel ausblenden; das Portal zeigt ihn
  onGameOver={(score) => submitScore('pacman', score)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<PacmanDemo active={cardIsVisible} />         // Attract-Modus auf der Startseite
```

Beide Komponenten folgen dem gemeinsamen Vertrag `ArcadeGameProps` / `ArcadeDemoProps` aus `src/arcade/types.ts`.

## 🧠 So funktioniert es

Die eigene Zustandsmaschine des Spiels und wie sie auf den gemeinsamen Arcade-Ablauf abgebildet wird:

```
idle → running ↔ paused
running → dying → running          (Leben verloren, lives > 0 → neu erscheinen)
running → dying → gameOver         (Leben verloren, letztes Leben)
running → levelClear → running     (alle Punkte gefressen → nächstes Level)
gameOver → (Neustart) → running
```

| Spielstatus | Arcade-Status |
| --- | --- |
| `idle` | `idle` |
| `running`, `dying`, `levelClear` | `running` (die Uhr läuft in den kurzen Pausen weiter) |
| `paused` | `paused` |
| `gameOver` | `gameOver` — der einzige Zustand, der eine Runde beendet |

Eine einzige reine Funktion, `advanceGame(state): GameState`, besitzt einen Takt von 150 ms:

1. Pac-Mans gemerkte Abbiegung (`nextDir`) wird ausgeführt, sobald sie erlaubt ist; sonst läuft er in `dir` weiter und bleibt an einer Wand stehen. Die Tür des Geisterhauses sperrt nur Pac-Man.
2. Pac-Man rückt ein Feld vor (mit Tunnel-Übergang) und frisst den Punkt bzw. die Kraftpille unter sich. Eine Kraftpille erschreckt jeden Geist außerhalb des Hauses, erzwingt eine Umkehr und setzt die Fressreihe zurück.
3. Der Zeitplan für Zerstreuen/Jagen läuft (7 s / 20 s / 7 s / 20 s / 5 s / 20 s / 5 s / danach nur noch Jagen); jeder Phasenwechsel erzwingt eine Umkehr.
4. Jeder Geist bewegt sich gemäß seinem Modus. Auf jedem Feld wählt er das nicht umkehrende Nachbarfeld, das seinem Ziel am nächsten liegt (Gleichstand: oben > links > unten > rechts):
   - **Blinky** zielt auf Pac-Man; **Pinky** 4 Felder vor ihn; **Inky** verdoppelt den Vektor von Blinky zu dem Feld 2 vor Pac-Man; **Clyde** jagt ab 8 Feldern Abstand, sonst zieht er sich in seine Ecke zurück.
   - **Erschreckte** Geister laufen mit halber Geschwindigkeit und biegen deterministisch pseudozufällig ab (kein `Math.random` — aus dem Zustand abgeleitet).
   - **Gefressene** Geister (Augen) finden den Weg zurück ins Haus und steigen im geplanten Modus wieder ein.
   - Pinky verlässt das Haus sofort, Inky nach 30 Punkten, Clyde nach 60.
5. Zusammenstöße werden aufgelöst (gleiches Feld oder aneinander vorbei getauscht): einen erschreckten Geist fressen, Augen ignorieren oder `dying` beginnen.
6. Der letzte Punkt startet `levelClear` (das gewinnt gegen einen gleichzeitigen Geistertreffer).

Der Demo-Autopilot (`src/logic/autopilot.ts`) startet auf jedem Feld eine Breitensuche ab Pac-Man — hin zu einem nahen
erschreckten Geist, solange genug Schreckzeit bleibt, sonst zum nächsten Punkt — kommt einem lebenden Geist nie näher
als zwei Felder und weicht sonst auf den Zug mit dem größten Abstand aus. Meist schafft er mehrere Level, bevor er verliert.

`useGameLoop` lässt nur während des Spiels ein Intervall laufen und liest den aktuellen Callback aus einem Ref (keine
veralteten Closures). `useKeyboardDirection` hängt für die Lebensdauer der Komponente einen einzigen Fenster-Listener an.

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Logik- und Komponententests) |
| `npm run check` | Lint → Typprüfung → Tests → Build (was die CI ausführt) |

## 🏗️ Architektur

```
src/
  arcade/              eingebundenes Zoltan's-Arcade-Kit — hier nicht bearbeiten (siehe dessen README)
  logic/               reine Spielregeln (ohne React)
    types.ts constants.ts grid.ts movement.ts scoring.ts
    maze.ts            MAZE: string[] + parseMaze() / validateMaze() → PARSED_MAZE
    pacman.ts          nextPacman — gemerkte Abbiegungen, Stopp an Wänden, gesperrte Tür
    ghosts.ts          targetTile, chooseDir, frightenedDir, advanceGhost
    game.ts            advanceGame + createInitialState + settleTransition + arcadeStatus
    autopilot.ts       Breitensuche mit Blick auf die Geister + demoStep für die Demo
    persist.ts         JSON-taugliche Speicherform + strenge Prüfung zur Laufzeit
  hooks/               useGameLoop, useKeyboardDirection, useIconTheme
  components/          GameBoard (voll + mini) = Maze + Entities, IconThemeToggle
  demo/PacmanDemo.tsx  Attract-Modus der Startseite
  rules.tsx            Abschnitte des Regeln-Dialogs + das Kraftpillen-Bild
  PacmanGame.tsx       das einbettbare Spiel (ArcadeGameProps)
  App.tsx              eigenständige Seite: <ArcadeShell><PacmanGame/></ArcadeShell>
  main.tsx             Einstieg; lädt das gemeinsame arcade.css einmal
  index.ts             Paket-Einstieg für Arcade-Game-Center
```

## 🤝 Mitmachen

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Die Mitwirkenden stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md), die Änderungen in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
