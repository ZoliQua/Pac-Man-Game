# 🟡 Pac-Man

[English](README.md) · [Deutsch](README.de.md) · **Magyar**

Letisztult, típusbiztos Pac-Man **React 18**, **Vite** és **TypeScript** alapon — billentyűzettel vagy telefonon is játszható, rácsalapú DOM, nincs canvas, nincs játékmotor.
Önállóan is fut, **és** a **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)** tizenöt játékának egyikeként is.

[![CI](https://github.com/ZoliQua/Pac-Man-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/Pac-Man-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Tartalom

- [A Zoltan's Arcade család](#%EF%B8%8F-a-zoltans-arcade-csal%C3%A1d)
- [Funkciók](#-funkci%C3%B3k)
- [Gyors kezdés](#-gyors-kezd%C3%A9s)
- [Irányítás](#%EF%B8%8F-ir%C3%A1ny%C3%ADt%C3%A1s)
- [Pontozás és statisztika](#-pontoz%C3%A1s-%C3%A9s-statisztika)
- [Automatikus mentés és folytatás](#-automatikus-ment%C3%A9s-%C3%A9s-folytat%C3%A1s)
- [Beágyazás az Arcade-Game-Centerbe](#-be%C3%A1gyaz%C3%A1s-az-arcade-game-centerbe)
- [Hogyan működik](#-hogyan-m%C5%B1k%C3%B6dik)
- [Szkriptek](#-szkriptek)
- [Felépítés](#%EF%B8%8F-fel%C3%A9p%C3%ADt%C3%A9s)
- [Közreműködés](#-k%C3%B6zrem%C5%B1k%C3%B6d%C3%A9s)
- [Licenc](#%EF%B8%8F-licenc)

## 🕹️ A Zoltan's Arcade család

Minden játék önálló repó, amely a portálba is beépül. Közös a dizájnrendszerük, a pontozási modelljük és a mentési formátumuk — ezt a beemelt [`src/arcade/`](./src/arcade) készlet adja.

| Játék | Repó | Műfaj |
| --- | --- | --- |
| 🏠 **Arcade-portál** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Minden játék egy helyen, élő demók, statisztika, ranglista |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 2048 | [2048-Game](https://github.com/ZoliQua/2048-Game) | Fejtörő |
| 🟡 **Pac-Man** (ez a repó) | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labirintus |
| ⚫ Amőba | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Stratégia |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Párbaj |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Ütős |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Lövöldözős |
| 🔴 Négy a sorban | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Párbaj |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Rendezős |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Kártya |
| 💣 Aknakereső | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logika |
| ♠️ Pasziánsz | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Kártya |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Kártya |
| 🌰 Snapszer | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Kártya |

## ✨ Funkciók

- 🟡 **Klasszikus Pac-Man** egy 28×31-es labirintusban: pöttyök, négy erőpirula, szellemház és egy alagút, amely a túloldalra visz
- 👻 **Négy szellem valódi MI-vel** — Blinky, Pinky, Inky és Clyde, mindegyiknek saját célpontja van, és a klasszikus szétszóródás/üldözés ütemezés szerint váltanak
- 😱 **Megijedt és megevett szellemek** — az erőpirulától kékre váltanak (megenni őket 200 → 400 → 800 → 1600 pont); a megevett szellemből csak a szeme marad, ami hazasiet, majd újra játékba áll
- ❤️ **Életek és szintek** — 3 élet; ha kiürül a labirintus, jön a következő szint (a pontok és az életek megmaradnak, az ijedt időszak rövidül)
- 🎨 **Ikonstílusok** — **normál** (klasszikus arcade), **köd** (tompa, kísérteties külső) vagy **fogas** (lásd lent), bármikor válthatók, akár játék közben is; csak a kinézet változik
- 💾 **Automatikus mentés és folytatás** — zárd be a lapot játék közben, és később ott folytathatod, ahol abbahagytad, a szellemekkel együtt
- 🏆 **Közös arcade-statisztika** — rekord, játszmák, összes játékidő, a portállal közösen
- ⏱️ **Szünetnél megálló játékidő-óra**
- 🌗 **Sötét / világos téma**, közös minden arcade-játékkal (**T** billentyű)
- 🌍 **Három nyelv** — angol, magyar és német; a felső sávban vagy a beállításokban váltható (linkben `?lang=en|hu|de` is); a számok a nyelv ezres tagolását követik
- 🦷 **Fogas mód** — „Fogas mód” / "Dental mode" / „Zahnmodus” kapcsoló a beállításokban, alapból kikapcsolva (vagy `?dental=1`), az egész arcade-ra érvényes: egy harmadik ikonstílus — Pac-Man mosolygó fog, a pöttyök fogkrémcseppek, az erőpirula fogkefe, a szellemek baktériumok; csak a megjelenés változik
- 📖 **Szabályok** — a Szabályok gomb a játékon belül nyitja meg a szabályokat (cél, így játssz, szabályok, pontozás, fogas mód, mobilon), egy ábrával arról, mit tesz az erőpirula a szellemmel; megnyitáskor a játék szünetel
- 🏁 **Idő előtti befejezés** — bármikor befejezheted a kört; egy megerősítés után a Pont mezőben látható pontszám kerül a ranglistára
- 📱 **Érintéses irányítás** — húzd az ujjad a labirintuson, vagy használd a képernyőn lévő nyílpadot; a fordulást a játék megjegyzi, amíg lehetővé nem válik
- ⛶ **Teljes képernyő** — a labirintus kitölti a képernyőt; iPhone-on a játék a lap fölé terül (a Safari ott nem ismeri a teljes képernyős módot)
- 🤖 **Bemutató mód** (`<PacmanDemo />`) — a valódi motor, amelyet egy szellemekre figyelő szélességi kereséses robotpilóta vezet, a portál nyitóoldalán
- ⌨️ **Billentyűzet vagy érintés**; a gyorsbillentyűk nem reagálnak, amíg egy űrlapmezőbe gépelsz
- 🧪 **Tesztelve** — a tiszta logika egységtesztjei és komponenstesztek Vitesttel + Testing Libraryvel

## 🚀 Gyors kezdés

Kell hozzá **Node ≥ 20** és npm.

```bash
git clone https://github.com/ZoliQua/Pac-Man-Game.git
cd Pac-Man-Game
npm install
npm run dev          # http://localhost:5173
```

Éles build: `npm run build && npm run preview`. A build relatív útvonalakat használ, így a `dist/` bármelyik almappából kiszolgálható.

## ⌨️ Irányítás

| Billentyű | Művelet |
| --- | --- |
| ⬆️ ⬇️ ⬅️ ➡️ / **W A S D** | Irányítás (egy iránybillentyű új játékot is indít) |
| **Szóköz** / **Enter** | Indítás · szünet · folytatás |
| **P** / **Esc** | Szünet / folytatás |
| **R** | Újrakezdés |
| **T** | Sötét / világos téma váltása (önálló oldalon) |

A bevitel csak a *kívánt* irányt jegyzi meg; a logika az első olyan mezőn fordul be, ahol ez szabályos, a falnál pedig Pac-Man egyszerűen megáll.

A labirintus fölött három gomb van: **Szabályok** (megnyitja a szabályokat és szünetelteti a játékot; az R marad az
újrakezdés billentyűje, ezért ennek a gombnak nincs gyorsbillentyűje), **Befejezés** (megerősítés után idő előtt
lezárja a kört — a látható pontszám kerül a ranglistára) és **Teljes képernyő**.

### 📱 Telefonon

Húzd az ujjad a labirintuson, vagy használd az alatta lévő nyílpadot; az előre kért fordulás kivárja a következő
elágazást, ugyanúgy, mint a nyilaknál. A pad középső gombja indít, szüneteltet és folytat. A labirintuson az ujjad
alatt sosem görög vagy nagyít az oldal. A **Teljes képernyő** az egész kijelzőt a játéknak adja; iPhone-on a
böngészősávok akkor is eltűnnek, ha az oldalt a főképernyőhöz adod (Megosztás → Főképernyőhöz adás).

## 🎯 Pontozás és statisztika

| Esemény | Pont |
| --- | --- |
| Pötty | 10 |
| Erőpirula | 50 |
| Szellem (megijedt) | 200 → 400 → 800 → 1600 |

A szellemsor minden erőpirulánál újraindul, nem szintenként. Az ijedt időszak az 1. szinten 6 mp, és szintenként
nagyjából 0,5 mp-cel rövidül (legalább 1 mp). A szintek a végtelenségig ismétlődnek, így minden kör az utolsó élet
elvesztésével ér véget (eredmény: `over`) — vagy amikor a **Befejezés** gombot nyomod: ilyenkor az abban a pillanatban
látható pontszám kerül a ranglistára (eredmény: `finished`, 0 pontnál is), a játék végén pedig az *Idő előtt
befejezve* felirat jelenik meg.

Egy kör végén a készlet egyszer rögzíti a kört a `localStorage`-ban, az `arcade.stats.pacman` kulcs alatt
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
A régi `pacman.highScore` kulcsot átveszi és szinkronban tartja, így a régebbi verziók is megtartják a rekordjukat.

### 🎨 Ikonstílusok

Két ikonkészlet rajzolja át Pac-Mant, a szellemeket, a pöttyöket és a falakat. A váltás **soha** nem állítja vissza a
pályát, és nem változtat szabályon, találati felületen, sebességen vagy láthatóságon — ez ikonkészlet, nem
„köd-a-háborúban” mód.

- **normál** — sárga Pac-Man mozgó szájjal; Blinky piros / Pinky rózsaszín / Inky türkiz / Clyde narancs; krémszínű pöttyök; lüktető erőpirulák; kék falak; megijedt = kék (lejárat előtt fehéren villog); megevett = csak a szem.
- **köd** — sápadt, kísérteties Pac-Man; fakó, lebegő szellemek (mégis megkülönböztethetők); halványan derengő gömbök pöttyként; ködös erőpirulák; sötét palaszürke falak lágy derengéssel.

A választás a `pacman.iconTheme` kulcs alatt tárolódik (alapból `normal`).

## 💾 Automatikus mentés és folytatás

Amíg egy kör tart, a játék nagyjából másodpercenként ment, és akkor is, ha az oldal a háttérbe kerül vagy a játék
lekerül az oldalról (kulcs: `arcade.session.pacman`, sémaverzióval). A mentés a teljes játékot tartalmazza: a maradék
pöttyöket, Pac-Mant, mind a négy szellemet módjukkal és helyükkel, a szétszóródás/üldözés és az ijedtség időzítőit,
az életeket, a szintet és a pontszámot. Betöltéskor szigorú ellenőrzésen megy át (`src/logic/persist.ts`), és ha
bármi nem stimmel, a játék eldobja. Újratöltés után az **Üdv újra!** ablak jelenik meg, a visszatöltött kör szünetel.
Az *Elmentve* jelzés melletti **Elvetés** törli a mentést. A befejezett körök maguktól törlik a mentésüket.

## 🧩 Beágyazás az Arcade-Game-Centerbe

```tsx
import { PacmanGame, PacmanDemo } from '@arcade/pacman';

<PacmanGame
  embedded                                   // az oldalcím elrejtése; a portál mutatja
  onGameOver={(score) => submitScore('pacman', score)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<PacmanDemo active={cardIsVisible} />         // bemutató mód a nyitóoldalon
```

Mindkét komponens a `src/arcade/types.ts` közös `ArcadeGameProps` / `ArcadeDemoProps` szerződését követi.

## 🧠 Hogyan működik

A játék saját állapotgépe, és ahogy a közös arcade-életciklusra képeződik:

```
idle → running ↔ paused
running → dying → running          (elveszett egy élet, lives > 0 → újraéledés)
running → dying → gameOver         (elveszett az utolsó élet)
running → levelClear → running     (minden pötty elfogyott → következő szint)
gameOver → (újrakezdés) → running
```

| Játékállapot | Arcade-állapot |
| --- | --- |
| `idle` | `idle` |
| `running`, `dying`, `levelClear` | `running` (az óra a rövid szünetekben is megy) |
| `paused` | `paused` |
| `gameOver` | `gameOver` — az egyetlen állapot, amely lezár egy kört |

Egyetlen tiszta függvény, az `advanceGame(state): GameState` felel egy 150 ms-os ütemért:

1. Pac-Man megjegyzett fordulása (`nextDir`) végrehajtódik, ha szabályos; különben halad tovább a `dir` irányba, és a falnál megáll. A szellemház ajtaja csak Pac-Mant zárja ki.
2. Pac-Man egy mezőt lép (az alagúton átfordulva), és megeszi az alatta lévő pöttyöt vagy erőpirulát. Az erőpirula a házon kívüli összes szellemet megijeszti, megfordítja őket, és nullázza az evési sort.
3. Fut a szétszóródás/üldözés ütemezés (7 mp / 20 mp / 7 mp / 20 mp / 5 mp / 20 mp / 5 mp / utána végig üldözés); minden fázisváltás egy fordulást kényszerít ki.
4. Minden szellem a módja szerint lép. Minden mezőn a célpontjához legközelebbi, nem visszafelé vezető szomszédot választja (döntetlennél: fel > balra > le > jobbra):
   - **Blinky** Pac-Manre céloz; **Pinky** 4 mezővel elé; **Inky** megduplázza a Blinkytől a Pac-Man előtti 2. mezőig mutató vektort; **Clyde** 8 mezőnél messzebbről üldöz, közelebbről a sarkába húzódik.
   - A **megijedt** szellemek fél sebességgel mennek, és determinisztikus álvéletlen módon fordulnak (nincs `Math.random` — az állapotból számolódik).
   - A **megevett** szellemek (szemek) visszatalálnak a házba, és az ütemezett módban térnek vissza a játékba.
   - Pinky azonnal elhagyja a házat, Inky 30 pötty után, Clyde 60 után.
5. Ütközések feloldása (azonos mező vagy egymáson átlépés): megijedt szellem megevése, a szemek figyelmen kívül hagyása, vagy a `dying` indul.
6. Az utolsó pötty megevése elindítja a `levelClear`-t (ez erősebb egy egyidejű szellemtalálatnál).

A bemutató robotpilótája (`src/logic/autopilot.ts`) minden mezőn szélességi keresést futtat Pac-Mantől — egy közeli
megijedt szellem felé, amíg elég ijedt idő maradt, különben a legközelebbi pötty felé —, sosem lép két mezőnél közelebb
egy élő szellemhez, és végső esetben a legnagyobb távolságot tartó lépést választja. Többnyire több szintet is
teljesít, mielőtt veszít.

A `useGameLoop` csak játék közben futtat időzítőt, és a legfrissebb callbacket egy refből olvassa (nincsenek elavult
closure-ök). A `useKeyboardDirection` a komponens teljes élettartamára egyetlen ablakszintű figyelőt köt be.

## 🧪 Szkriptek

| Szkript | Mire való |
| --- | --- |
| `npm run dev` | Vite fejlesztői szerver |
| `npm run build` | Típusellenőrzés (`tsc -b`) és éles build |
| `npm run preview` | Az éles build kiszolgálása |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logikai és komponenstesztek) |
| `npm run check` | lint → típusellenőrzés → tesztek → build (ezt futtatja a CI) |

## 🏗️ Felépítés

```
src/
  arcade/              beemelt Zoltan's Arcade készlet — itt ne szerkeszd (lásd a saját README-jét)
  logic/               tiszta játékszabályok (React nélkül)
    types.ts constants.ts grid.ts movement.ts scoring.ts
    maze.ts            MAZE: string[] + parseMaze() / validateMaze() → PARSED_MAZE
    pacman.ts          nextPacman — megjegyzett fordulások, megállás a falnál, zárt ajtó
    ghosts.ts          targetTile, chooseDir, frightenedDir, advanceGhost
    game.ts            advanceGame + createInitialState + settleTransition + arcadeStatus
    autopilot.ts       szellemekre figyelő szélességi keresés + demoStep a bemutatóhoz
    persist.ts         JSON-barát mentési forma + szigorú futásidejű ellenőrzés
  hooks/               useGameLoop, useKeyboardDirection, useIconTheme
  components/          GameBoard (teljes + mini) = Maze + Entities, IconThemeToggle
  demo/PacmanDemo.tsx  a nyitóoldal bemutató módja
  rules.tsx            a Szabályok ablak szakaszai + az erőpirula-ábra
  PacmanGame.tsx       a beágyazható játék (ArcadeGameProps)
  App.tsx              önálló oldal: <ArcadeShell><PacmanGame/></ArcadeShell>
  main.tsx             belépési pont; egyszer tölti be a közös arcade.css-t
  index.ts             csomag-belépési pont az Arcade-Game-Center számára
```

## 🤝 Közreműködés

Lásd a [CONTRIBUTING.md](./CONTRIBUTING.md)-t, a [magatartási kódexet](./CODE_OF_CONDUCT.md) és a [SECURITY.md](./SECURITY.md)-t.
A közreműködők a [CONTRIBUTORS.md](./CONTRIBUTORS.md)-ben, a változások a [CHANGELOG.md](./CHANGELOG.md)-ben találhatók.

## ⚖️ Licenc

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">❤️-vel készítette Dul Zoltán · a <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a> része</p>
