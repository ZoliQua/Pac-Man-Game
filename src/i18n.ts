import type { Messages } from './arcade';

/** Pac-Man-specific UI strings. Shared chrome (Score, Start, Paused, …) comes from the kit's KIT_MESSAGES. */
const en = {
  subtitle: 'Gobble the dots — and the ghosts, when they turn blue.',
  idleMessage:
    'Eat every dot and dodge the ghosts. Power pellets turn the tables — ghosts eaten in a row score 200, 400, 800, 1600.',
  welcomeMessage: 'Your saved run was restored — score {score}, level {level}, {time} played.',
  continue: 'Continue',
  pausedMessage: 'Your run is autosaved — you can close the tab and continue later.',
  levelCleared: 'Level {level} cleared!',
  levelClearedMessage: 'Score {score}',
  playAgain: 'Play again',
  gameOverMessage: 'Score {score} · Level {level} · Best {best}',
  newBestSuffix: ' — new best!',
  statusCaught: 'Caught!',
  statusLevelClear: 'Level clear!',
  lives: 'Lives',
  panelGame: 'Game',
  panelSettings: 'Settings',
  panelKeys: 'Keys',
  iconTheme: 'Icon theme',
  themeNormal: 'Normal',
  themeFog: 'Fog',
  themeDental: 'Dental',
  maze: 'Pac-Man maze',
  keySpace: 'Space',
  keySteer: 'Steer (or WASD)',
  keyStartPause: 'Start / pause',
  keyPauseResume: 'Pause / resume',
  keyRestart: 'Restart',
  rulesGoalText:
    'Eat every dot in the maze to clear the level, without getting caught by the four ghosts. Levels repeat forever — how far can you get?',
  rulesPlayKeys:
    'Steer with the arrow keys or WASD; a direction key also starts a new game. Space or Enter starts and pauses, P or Esc pauses, R restarts.',
  rulesPlayTouch:
    'Swipe on the maze or use the arrow pad below it to steer. The middle pad button starts and pauses the game.',
  rulesTurnQueue:
    'A turn you ask for early is remembered: Pac-Man takes it at the next opening and keeps going straight until then.',
  rulesLives: 'You start with {lives} lives. A ghost that catches you costs one; the game ends when none are left.',
  rulesGhosts:
    'Each ghost hunts in its own way, and from time to time they all scatter to their corners. The side tunnel takes you across the maze.',
  rulesPower:
    'A power pellet frightens the ghosts for a short while: the ghosts lose their eyes, slow down and run from you — now you can eat them. They flash shortly before it ends.',
  rulesLevelClear: 'When the last dot is gone the level is cleared; your score and lives carry over.',
  rulesScorePellet: 'Dot: {points} points',
  rulesScorePower: 'Power pellet: {points} points',
  rulesScoreChain: 'Ghosts eaten on one power pellet: {chain} points — the chain starts again with the next pellet.',
  rulesDentalText:
    'In dental mode Pac-Man is a smiling tooth, the dots are toothpaste, the power pellets are toothbrushes and the ghosts are germs. Frightened germs turn hollow and dashed. Only the look changes; the Normal and Fog styles work the same way.',
  rulesDiagramAria: 'A power pellet turns a ghost into a frightened ghost that you can eat',
  rulesDiagramPellet: 'Power pellet',
  rulesDiagramGhost: 'Ghost',
  rulesDiagramFrightened: 'Frightened: eat it!',
  touchSwipe: 'Swipe on the maze',
  touchSwipeAction: 'Steer (the turn waits for the next opening)',
  touchPad: 'Arrow pad',
  touchPadAction: 'Steer one step at a time',
  touchCenter: 'Middle button',
  touchCenterAction: 'Start / pause',
  touchFullscreenAction: 'The whole screen for the maze',
  padUp: 'Up',
  padDown: 'Down',
  padLeft: 'Left',
  padRight: 'Right',
};

export type PacmanMessageKey = keyof typeof en;

export const MESSAGES: Messages<PacmanMessageKey> = {
  en,
  hu: {
    subtitle: 'Fald fel a pöttyöket – és a szellemeket is, amikor elkékülnek.',
    idleMessage:
      'Edd meg az összes pöttyöt, és kerüld el a szellemeket. Az erőpirula megfordítja a helyzetet – az egymás után elkapott szellemek 200, 400, 800 és 1600 pontot érnek.',
    welcomeMessage: 'Visszatöltöttük a mentett játékodat: {score} pont, {level}. szint, {time} játékidő.',
    continue: 'Folytatás',
    pausedMessage: 'A játékod automatikusan mentődik – nyugodtan bezárhatod a lapot, és később folytathatod.',
    levelCleared: '{level}. szint teljesítve!',
    levelClearedMessage: '{score} pont',
    playAgain: 'Még egy kör',
    gameOverMessage: '{score} pont · {level}. szint · Rekord: {best}',
    newBestSuffix: ' – új rekord!',
    statusCaught: 'Elkaptak!',
    statusLevelClear: 'Szint teljesítve!',
    lives: 'Életek',
    panelGame: 'Játék',
    panelSettings: 'Beállítások',
    panelKeys: 'Billentyűk',
    iconTheme: 'Ikonstílus',
    themeNormal: 'Normál',
    themeFog: 'Köd',
    themeDental: 'Fogas',
    maze: 'Pac-Man-labirintus',
    keySpace: 'Szóköz',
    keySteer: 'Irányítás (vagy WASD)',
    keyStartPause: 'Indítás / szünet',
    keyPauseResume: 'Szünet / folytatás',
    keyRestart: 'Újrakezdés',
    rulesGoalText:
      'Edd meg a labirintus összes pöttyét, hogy teljesítsd a szintet, és közben ne kapjon el a négy szellem. A szintek a végtelenségig ismétlődnek – meddig jutsz?',
    rulesPlayKeys:
      'A nyilakkal vagy WASD-vel irányítasz; egy iránybillentyű új játékot is indít. Szóköz vagy Enter: indítás és szünet, P vagy Esc: szünet, R: újrakezdés.',
    rulesPlayTouch:
      'Húzd az ujjad a labirintuson, vagy használd az alatta lévő nyílpadot. A pad középső gombja indítja és megállítja a játékot.',
    rulesTurnQueue:
      'Ha előre kérsz egy fordulást, a játék megjegyzi: Pac-Man a következő elágazásnál fordul be, addig egyenesen halad.',
    rulesLives: '{lives} élettel kezdesz. Ha elkap egy szellem, elveszítesz egyet; ha elfogytak, vége a játéknak.',
    rulesGhosts:
      'Minden szellem a maga módján vadászik rád, és időnként mind a sarkukba húzódnak. Az oldalsó alagúton átjutsz a labirintus másik oldalára.',
    rulesPower:
      'Az erőpirula egy rövid időre megijeszti a szellemeket: a szellemek elveszítik a szemüket, lelassulnak és menekülnek előled – ilyenkor megeheted őket. Mielőtt lejár, villognak.',
    rulesLevelClear: 'Ha az utolsó pötty is elfogyott, a szint teljesítve; a pontjaid és az életeid megmaradnak.',
    rulesScorePellet: 'Pötty: {points} pont',
    rulesScorePower: 'Erőpirula: {points} pont',
    rulesScoreChain: 'Egy erőpirulával elkapott szellemek: {chain} pont – a sor a következő pirulánál újraindul.',
    rulesDentalText:
      'Fogas módban Pac-Man egy mosolygó fog, a pöttyök fogkrémcseppek, az erőpirulák fogkefék, a szellemek pedig baktériumok. A megijedt baktérium üres, szaggatott körvonalú lesz. Csak a kinézet változik; a Normál és a Köd stílus ugyanígy működik.',
    rulesDiagramAria: 'Az erőpirulától a szellem megijed, és megeheted',
    rulesDiagramPellet: 'Erőpirula',
    rulesDiagramGhost: 'Szellem',
    rulesDiagramFrightened: 'Megijedt: edd meg!',
    touchSwipe: 'Húzás a labirintuson',
    touchSwipeAction: 'Irányítás (a fordulás kivárja a következő elágazást)',
    touchPad: 'Nyílpad',
    touchPadAction: 'Irányítás gombokkal',
    touchCenter: 'Középső gomb',
    touchCenterAction: 'Indítás / szünet',
    touchFullscreenAction: 'Az egész képernyő a labirintusé',
    padUp: 'Fel',
    padDown: 'Le',
    padLeft: 'Balra',
    padRight: 'Jobbra',
  },
  de: {
    subtitle: 'Friss die Punkte – und die Geister, sobald sie blau werden.',
    idleMessage:
      'Friss alle Punkte und weiche den Geistern aus. Kraftpillen drehen den Spieß um – nacheinander gefressene Geister bringen 200, 400, 800 und 1600 Punkte.',
    welcomeMessage: 'Dein gespeichertes Spiel wurde wiederhergestellt – {score} Punkte, Level {level}, {time} gespielt.',
    continue: 'Weiter',
    pausedMessage: 'Dein Spiel wird automatisch gespeichert – du kannst den Tab schließen und später weitermachen.',
    levelCleared: 'Level {level} geschafft!',
    levelClearedMessage: '{score} Punkte',
    playAgain: 'Nochmal spielen',
    gameOverMessage: '{score} Punkte · Level {level} · Bestwert {best}',
    newBestSuffix: ' – neuer Bestwert!',
    statusCaught: 'Erwischt!',
    statusLevelClear: 'Level geschafft!',
    lives: 'Leben',
    panelGame: 'Spiel',
    panelSettings: 'Einstellungen',
    panelKeys: 'Tasten',
    iconTheme: 'Symbolstil',
    themeNormal: 'Normal',
    themeFog: 'Nebel',
    themeDental: 'Zahn',
    maze: 'Pac-Man-Labyrinth',
    keySpace: 'Leertaste',
    keySteer: 'Steuern (oder WASD)',
    keyStartPause: 'Start / Pause',
    keyPauseResume: 'Pause / weiter',
    keyRestart: 'Neustart',
    rulesGoalText:
      'Friss alle Punkte im Labyrinth, um das Level zu schaffen, ohne dass dich einer der vier Geister erwischt. Die Level wiederholen sich endlos – wie weit kommst du?',
    rulesPlayKeys:
      'Du steuerst mit den Pfeiltasten oder WASD; eine Richtungstaste startet auch ein neues Spiel. Leertaste oder Enter startet und pausiert, P oder Esc pausiert, R startet neu.',
    rulesPlayTouch:
      'Wisch über das Labyrinth oder nimm das Pfeilfeld darunter zum Steuern. Die mittlere Taste startet und pausiert das Spiel.',
    rulesTurnQueue:
      'Eine Abbiegung, die du zu früh wählst, wird gemerkt: Pac-Man nimmt sie an der nächsten Öffnung und läuft bis dahin geradeaus.',
    rulesLives: 'Du startest mit {lives} Leben. Erwischt dich ein Geist, verlierst du eins; sind alle weg, ist das Spiel vorbei.',
    rulesGhosts:
      'Jeder Geist jagt dich auf seine eigene Art, und ab und zu ziehen sich alle in ihre Ecken zurück. Durch den Seitentunnel kommst du auf die andere Seite.',
    rulesPower:
      'Eine Kraftpille erschreckt die Geister für kurze Zeit: Die Geister verlieren ihre Augen, werden langsamer und fliehen vor dir – jetzt kannst du sie fressen. Kurz vor dem Ende blinken sie.',
    rulesLevelClear: 'Ist der letzte Punkt gefressen, ist das Level geschafft; Punkte und Leben bleiben dir erhalten.',
    rulesScorePellet: 'Punkt: {points} Punkte',
    rulesScorePower: 'Kraftpille: {points} Punkte',
    rulesScoreChain: 'Geister mit einer Kraftpille: {chain} Punkte – mit der nächsten Pille beginnt die Reihe von vorn.',
    rulesDentalText:
      'Im Zahnmodus ist Pac-Man ein lächelnder Zahn, die Punkte sind Zahnpasta, die Kraftpillen Zahnbürsten und die Geister Bakterien. Erschreckte Bakterien werden hohl und gestrichelt. Nur das Aussehen ändert sich; die Stile Normal und Nebel funktionieren genauso.',
    rulesDiagramAria: 'Eine Kraftpille macht aus einem Geist einen erschreckten Geist, den du fressen kannst',
    rulesDiagramPellet: 'Kraftpille',
    rulesDiagramGhost: 'Geist',
    rulesDiagramFrightened: 'Erschreckt: friss ihn!',
    touchSwipe: 'Wischen im Labyrinth',
    touchSwipeAction: 'Steuern (die Abbiegung wartet auf die nächste Öffnung)',
    touchPad: 'Pfeilfeld',
    touchPadAction: 'Steuern mit Tasten',
    touchCenter: 'Mittlere Taste',
    touchCenterAction: 'Start / Pause',
    touchFullscreenAction: 'Der ganze Bildschirm fürs Labyrinth',
    padUp: 'Hoch',
    padDown: 'Runter',
    padLeft: 'Links',
    padRight: 'Rechts',
  },
};

/** Touch-help rows (gesture, action), shared by the Controls panel and the Rules → On mobile section. */
export const TOUCH_ROWS: [PacmanMessageKey, PacmanMessageKey][] = [
  ['touchSwipe', 'touchSwipeAction'],
  ['touchPad', 'touchPadAction'],
  ['touchCenter', 'touchCenterAction'],
];

