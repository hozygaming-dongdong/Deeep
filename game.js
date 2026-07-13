const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const balancePanel = document.getElementById("balancePanel");
const balanceText = document.getElementById("balanceText");
const depthText = document.getElementById("depthText");
const riskText = document.getElementById("riskText");
const costText = document.getElementById("costText");
const betText = document.getElementById("betText");
const bestFishText = document.getElementById("bestFishText");
const resultPanel = document.getElementById("resultPanel");
const resultKicker = document.getElementById("resultKicker");
const resultTitle = document.getElementById("resultTitle");
const resultBody = document.getElementById("resultBody");
const bossOmenOverlay = document.getElementById("bossOmenOverlay");
const bossOmenTitle = document.getElementById("bossOmenTitle");
const newRoundButton = document.getElementById("newRoundButton");
const deepButton = document.getElementById("deepButton");
const pullButton = document.getElementById("pullButton");
const betDownButton = document.getElementById("betDownButton");
const betUpButton = document.getElementById("betUpButton");
const devToggleButton = document.getElementById("devToggleButton");
const devControls = document.getElementById("devControls");
const sharkToggle = document.getElementById("sharkToggle");
const fakePlayersToggle = document.getElementById("fakePlayersToggle");
const crimsonChanceSlider = document.getElementById("crimsonChanceSlider");
const crimsonChanceText = document.getElementById("crimsonChanceText");
const octopusChanceSlider = document.getElementById("octopusChanceSlider");
const octopusChanceText = document.getElementById("octopusChanceText");
const mysteryChanceSlider = document.getElementById("mysteryChanceSlider");
const mysteryChanceText = document.getElementById("mysteryChanceText");

const W = canvas.width;
const H = canvas.height;
const maxDepth = 100;
const hookTop = 165;
const hookDiveY = 520;
const layerHeight = 145;
const betSteps = [10, 20, 50, 100, 200, 500, 1000];
const TAU = Math.PI * 2;
const doubleChance = 0.12;
const bossDoubleChance = 0.5;
const defaultCrimsonChance = 0.1;
const defaultOctopusChance = 0.08;
const defaultMysteryChance = 0.06;
const musicVolumeBoost = 1.8;
const sfxVolumeBoost = 2.4;
const pullShakeDuration = 0.32;
const hookCatchRadius = 38;
let audioCtx = null;
let music = null;

const state = {
  balance: 10000,
  betIndex: 3,
  depth: 0,
  spent: 0,
  status: "ready",
  isHolding: false,
  sharksEnabled: false,
  fakePlayersEnabled: false,
  lastTickDepth: 0,
  hookY: hookDiveY,
  messageTimer: 0,
  bubbles: [],
  effects: [],
  fish: [],
  rocks: [],
  goldenBubbles: [],
  shark: null,
  caughtFish: null,
  bestCandidate: null,
  roundBoss: null,
  bossOmen: null,
  bossOmenTriggered: false,
  bossOmenTimer: 0,
  pullProgress: 0,
  pullStartDepth: 0,
  pullWindupTimer: 0,
  pullShuffleTimer: 0,
  pullSurgeTimer: 0,
  hookShakeTimer: 0,
  roulette: null,
  bossWheel: null,
  struggleChecks: [],
  pendingMysteryFish: null,
  result: null,
  fakePlayers: [],
  fakeEvents: [],
  time: 0,
};

const fishCatalog = [
  { name: "Blue Sprat", zone: 1, mult: 4, catchRate: 0.78, holdRate: 0.82, color: "#65c9ff", accent: "#d6f5ff", size: 32, rarity: 1 },
  { name: "Puffer Pearl", zone: 1, mult: 6, catchRate: 0.68, holdRate: 0.76, color: "#dff3f4", accent: "#78d7ff", size: 37, rarity: 1 },
  { name: "Bronze Snapper", zone: 2, mult: 12, catchRate: 0.52, holdRate: 0.66, color: "#e35f42", accent: "#ffd36a", size: 44, rarity: 2 },
  { name: "Crimson Bite", zone: 2, mult: 19, catchRate: 0.42, holdRate: 0.57, color: "#d8372e", accent: "#f7f0a1", size: 46, rarity: 2 },
  { name: "Lion Crown", zone: 3, mult: 40, catchRate: 0.28, holdRate: 0.46, color: "#ff9b45", accent: "#fff07d", size: 54, rarity: 3 },
  { name: "Golden Shell", zone: 3, mult: 75, catchRate: 0.18, holdRate: 0.34, color: "#f2c14f", accent: "#ffffff", size: 58, rarity: 4 },
  { name: "Abyss King", zone: 3, mult: 150, catchRate: 0.1, holdRate: 0.25, color: "#77d6e8", accent: "#ff5bd8", size: 66, rarity: 5 },
];

const specialCatalog = [
  { name: "Crystal Jelly", mult: 120, minDepth: 15, weight: 40, shape: "jelly", catchRate: 0.28, holdRate: 0.46, color: "#8ff6ff", accent: "#d9ffff", size: 58, rarity: 4, tag: "RARE" },
  { name: "Treasure Crab", mult: 180, minDepth: 25, weight: 28, shape: "crab", catchRate: 0.24, holdRate: 0.4, color: "#e66b42", accent: "#ffd36a", size: 60, rarity: 4, tag: "RARE" },
  { name: "Ghost Ray", mult: 375, minDepth: 40, weight: 18, shape: "ray", catchRate: 0.18, holdRate: 0.34, color: "#9ce7ff", accent: "#ffffff", size: 76, rarity: 5, tag: "EPIC" },
  { name: "Crowned Tuna", mult: 600, minDepth: 50, weight: 10, shape: "tuna", catchRate: 0.14, holdRate: 0.28, color: "#f6b84e", accent: "#fff06e", size: 78, rarity: 5, tag: "EPIC" },
  { name: "Abyss Whale", mult: 1200, minDepth: 70, weight: 4, shape: "whale", catchRate: 0.08, holdRate: 0.2, color: "#192334", accent: "#6ff8ff", size: 118, rarity: 6, tag: "LEGENDARY" },
];

const bossCatalog = {
  crimson: {
    name: "Crimson Leviathan",
    mult: 110,
    minDepth: 80,
    catchRate: 0.82,
    holdRate: 1,
    color: "#b31328",
    accent: "#ffdf6d",
    size: 188,
    rarity: 7,
    tag: "BOSS",
    isBoss: true,
    bossType: "crimson",
  },
  octopus: {
    name: "Abyss Octopus",
    mult: 90,
    minDepth: 80,
    catchRate: 0.82,
    holdRate: 1,
    color: "#6f35d6",
    accent: "#e6b3ff",
    size: 168,
    rarity: 7,
    tag: "BOSS",
    isBoss: true,
    bossType: "octopus",
  },
  mystery: {
    name: "Golden Pearl Clam",
    mult: 100,
    minDepth: 80,
    catchRate: 0.82,
    holdRate: 1,
    color: "#d89b22",
    accent: "#fff1a8",
    size: 170,
    rarity: 7,
    tag: "BOSS",
    isBoss: true,
    bossType: "mystery",
  },
};

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function fishValue(fish) {
  if (fish?.bossType === "mystery" && !fish.mysteryMult) return "MYSTERY";
  if (fish?.bossType === "octopus") return money(bet() * (fish.mult + (fish.collectorBonusMult || 0)));
  return money(bet() * fish.mult * (fish.valueMultiplier || 1));
}

function bet() {
  return betSteps[state.betIndex];
}

function ensureAudio() {
  if (audioCtx) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioCtx = new AudioContextClass();
}

function ensureMusic() {
  ensureAudio();
  if (!audioCtx || music) return;

  const master = audioCtx.createGain();
  const pad = audioCtx.createGain();
  const pulse = audioCtx.createGain();
  const tension = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  const bassFilter = audioCtx.createBiquadFilter();
  const oscA = audioCtx.createOscillator();
  const oscB = audioCtx.createOscillator();
  const pulseOsc = audioCtx.createOscillator();
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  const tensionOsc = audioCtx.createOscillator();

  master.gain.value = 0.0001;
  pad.gain.value = 0.052;
  pulse.gain.value = 0.0001;
  tension.gain.value = 0.0001;

  filter.type = "lowpass";
  filter.frequency.value = 760;
  filter.Q.value = 0.55;
  bassFilter.type = "lowpass";
  bassFilter.frequency.value = 180;
  bassFilter.Q.value = 5;

  oscA.type = "sine";
  oscA.frequency.value = 48;
  oscB.type = "triangle";
  oscB.frequency.value = 72;
  pulseOsc.type = "triangle";
  pulseOsc.frequency.value = 58;
  lfo.type = "sine";
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.02;
  tensionOsc.type = "triangle";
  tensionOsc.frequency.value = 330;

  oscA.connect(pad);
  oscB.connect(pad);
  pad.connect(filter);
  filter.connect(master);

  pulseOsc.connect(bassFilter);
  bassFilter.connect(pulse);
  pulse.connect(master);

  tensionOsc.connect(tension);
  tension.connect(master);

  lfo.connect(lfoGain);
  lfoGain.connect(master.gain);
  master.connect(audioCtx.destination);

  oscA.start();
  oscB.start();
  pulseOsc.start();
  lfo.start();
  tensionOsc.start();

  music = {
    master,
    pad,
    pulse,
    tension,
    filter,
    bassFilter,
    oscA,
    oscB,
    pulseOsc,
    tensionOsc,
    nextBeat: 0,
    beatStep: 0,
  };
}

function playMusicBeat(depthRatio) {
  const bassGain = 0.08 + depthRatio * 0.04;
  const bassStart = 76 + depthRatio * 18;
  playTone(bassStart, 0.09, "triangle", bassGain, 46 + depthRatio * 12);

  if (music.beatStep % 2 === 1) {
    playTone(740 + depthRatio * 260, 0.045, "square", 0.035 + depthRatio * 0.018, 1180 + depthRatio * 420);
  }

  if (music.beatStep % 4 === 3) {
    playTone(1320 + depthRatio * 420, 0.035, "triangle", 0.026 + depthRatio * 0.015, 1880 + depthRatio * 520);
    setTimeout(() => playTone(1660 + depthRatio * 520, 0.03, "sine", 0.02 + depthRatio * 0.012), 55);
  }

  if (depthRatio > 0.55 && music.beatStep % 8 === 7) {
    playNoise(0.045, 0.018 + depthRatio * 0.018);
  }

  music.beatStep += 1;
}

function updateMusic() {
  if (!audioCtx || !music) return;

  const now = audioCtx.currentTime;
  const depthRatio = Math.min(1, state.depth / maxDepth);
  const active = state.status === "diving" || state.status === "shuffle" || state.status === "pulling" || state.status === "cut";
  const masterTarget = Math.min(0.78, (active ? 0.24 + depthRatio * 0.1 : 0.105) * musicVolumeBoost);
  const pulseTarget = active ? 0.022 + depthRatio * 0.045 : 0.004;
  const tensionTarget = depthRatio > 0.45 ? (depthRatio - 0.45) * 0.045 : 0.0001;

  music.master.gain.setTargetAtTime(masterTarget, now, 0.35);
  music.pulse.gain.setTargetAtTime(pulseTarget, now, 0.25);
  music.tension.gain.setTargetAtTime(tensionTarget, now, 0.35);
  music.filter.frequency.setTargetAtTime(680 + depthRatio * 980, now, 0.5);
  music.bassFilter.frequency.setTargetAtTime(90 + depthRatio * 130, now, 0.35);
  music.oscA.frequency.setTargetAtTime(42 + depthRatio * 12, now, 0.6);
  music.oscB.frequency.setTargetAtTime(63 + depthRatio * 28, now, 0.6);
  music.pulseOsc.frequency.setTargetAtTime(52 + depthRatio * 30, now, 0.35);
  music.tensionOsc.frequency.setTargetAtTime(260 + depthRatio * 230, now, 0.4);

  if (active && now >= music.nextBeat) {
    playMusicBeat(depthRatio);
    music.nextBeat = now + Math.max(0.28, 0.74 - depthRatio * 0.3);
  }
}

function playTone(freq, duration = 0.08, type = "sine", gain = 0.08, slideTo = null) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  const boostedGain = Math.min(0.5, gain * sfxVolumeBoost);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(boostedGain, now + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playNoise(duration = 0.18, gain = 0.08) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const boostedGain = Math.min(0.45, gain * sfxVolumeBoost);
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const source = audioCtx.createBufferSource();
  const amp = audioCtx.createGain();
  amp.gain.setValueAtTime(boostedGain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  source.buffer = buffer;
  source.connect(amp);
  amp.connect(audioCtx.destination);
  source.start(now);
}

const sound = {
  dive() {
    playTone(190, 0.08, "triangle", 0.045, 150);
  },
  tick() {
    playTone(420, 0.035, "square", 0.025, 360);
  },
  pull() {
    playTone(260, 0.12, "triangle", 0.06, 390);
  },
  hook() {
    playTone(740, 0.08, "square", 0.055, 980);
    setTimeout(() => playTone(520, 0.08, "triangle", 0.045), 70);
  },
  roulette() {
    playTone(620, 0.06, "sawtooth", 0.035);
  },
  safe() {
    playTone(560, 0.07, "triangle", 0.05);
    setTimeout(() => playTone(840, 0.1, "triangle", 0.06), 80);
  },
  escape() {
    playNoise(0.2, 0.09);
    playTone(180, 0.2, "sawtooth", 0.06, 90);
  },
  shark() {
    playNoise(0.28, 0.12);
    playTone(90, 0.25, "sawtooth", 0.08, 55);
  },
  win() {
    playTone(500, 0.09, "triangle", 0.06);
    setTimeout(() => playTone(720, 0.1, "triangle", 0.07), 90);
    setTimeout(() => playTone(980, 0.16, "triangle", 0.07), 190);
  },
  lose() {
    playTone(180, 0.12, "triangle", 0.05, 130);
  },
};

function riskForDepth(depth) {
  if (depth <= 20) return { rate: 0.004, label: "LOW", color: "#78e6a3" };
  if (depth <= 51) return { rate: 0.011, label: "MED", color: "#ffd36a" };
  return { rate: 0.022, label: "HIGH", color: "#ff5966" };
}

function yForDepth(depth) {
  return hookDiveY + (depth - state.depth) * layerHeight;
}

function normalizeAngle(angle) {
  return ((angle % TAU) + TAU) % TAU;
}

function rouletteZones(escapeChance, doubleRate = doubleChance) {
  const escapeArc = TAU * escapeChance;
  const doubleArc = TAU * doubleRate;
  const escapeCenter = Math.PI * 1.5;
  const doubleCenter = Math.PI * 0.5;
  return {
    escape: {
      start: escapeCenter - escapeArc / 2,
      end: escapeCenter + escapeArc / 2,
    },
    double: {
      start: doubleCenter - doubleArc / 2,
      end: doubleCenter + doubleArc / 2,
    },
  };
}

function isAngleInArc(angle, start, end) {
  const value = normalizeAngle(angle);
  const arcStart = normalizeAngle(start);
  const arcEnd = normalizeAngle(end);

  if (arcStart <= arcEnd) {
    return value >= arcStart && value <= arcEnd;
  }
  return value >= arcStart || value <= arcEnd;
}

function outcomeForRouletteAngle(angle, zones) {
  if (isAngleInArc(angle, zones.escape.start, zones.escape.end)) return "ESCAPE";
  if (isAngleInArc(angle, zones.double.start, zones.double.end)) return "DOUBLE";
  return "SAFE";
}

function isNearArcEdge(angle, start, end, margin) {
  const value = normalizeAngle(angle);
  const arcStart = normalizeAngle(start);
  const arcEnd = normalizeAngle(end);
  const startDistance = Math.min(Math.abs(value - arcStart), TAU - Math.abs(value - arcStart));
  const endDistance = Math.min(Math.abs(value - arcEnd), TAU - Math.abs(value - arcEnd));
  return startDistance < margin || endDistance < margin;
}

function pickRouletteLanding(zones) {
  const edgeMargin = 0.05;
  let angle = Math.random() * TAU;
  while (
    isNearArcEdge(angle, zones.escape.start, zones.escape.end, edgeMargin)
    || isNearArcEdge(angle, zones.double.start, zones.double.end, edgeMargin)
  ) {
    angle = Math.random() * TAU;
  }
  return angle;
}

function catalogForDepth(depth) {
  const zone = depth <= 20 ? 1 : depth <= 51 ? 2 : 3;
  const options = fishCatalog.filter((fish) => fish.zone === zone);
  return options[Math.floor(Math.random() * options.length)];
}

function specialChanceForDepth(depth) {
  if (depth < 15) return 0;
  if (depth <= 20) return 0.018;
  if (depth <= 50) return 0.0375;
  if (depth <= 75) return 0.06;
  return 0.09;
}

function specialForDepth(depth) {
  if (Math.random() > specialChanceForDepth(depth)) return null;

  const options = specialCatalog.filter((item) => depth >= item.minDepth);
  const totalWeight = options.reduce((total, item) => total + item.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const item of options) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return options[0] || null;
}

function randomizedMult(baseMult) {
  const variance = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.round(baseMult * variance));
}

function finalPrizeForDepth() {
  if (Math.random() < 0.8) {
    const options = [
      { ...specialCatalog[2], weight: 16 },
      { ...specialCatalog[3], weight: 36 },
      { ...specialCatalog[4], weight: 58 },
    ];
    const totalWeight = options.reduce((total, item) => total + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of options) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return options[0];
  }

  const options = fishCatalog.filter((fish) => fish.zone === 3 && fish.mult >= 40);
  return options[Math.floor(Math.random() * options.length)];
}

function chooseRoundBoss() {
  const weights = [
    { boss: bossCatalog.crimson, weight: chanceSliderValue(crimsonChanceSlider, defaultCrimsonChance) },
    { boss: bossCatalog.octopus, weight: chanceSliderValue(octopusChanceSlider, defaultOctopusChance) },
    { boss: bossCatalog.mystery, weight: chanceSliderValue(mysteryChanceSlider, defaultMysteryChance) },
  ];
  const totalWeight = weights.reduce((total, item) => total + item.weight, 0);
  const spawnChance = Math.min(1, totalWeight);
  if (totalWeight <= 0 || Math.random() > spawnChance) return null;

  let roll = Math.random() * totalWeight;
  for (const item of weights) {
    roll -= item.weight;
    if (roll <= 0) return item.boss;
  }
  return weights[0].boss;
}

function omenForBoss(boss) {
  if (!boss) return null;
  const color = boss.bossType === "octopus" ? "#b86cff" : boss.bossType === "mystery" ? "#ffd36a" : "#ff314f";
  return {
    type: boss.bossType,
    color,
    text: `${boss.name.toUpperCase()} BELOW`,
    activeFrom: 40 + Math.random() * 10,
  };
}

function chanceSliderValue(slider, fallback) {
  const value = slider ? Number(slider.value) / 100 : fallback;
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : fallback));
}

function makeFishInstance(item, index, depth, overrides = {}) {
  const lanes = [125, 245, 365, 485, 595];
  return {
    ...item,
    ...overrides,
    mult: overrides.fixedMult ?? randomizedMult(overrides.mult ?? item.mult),
    isSpecial: Boolean(item.shape),
    isBoss: Boolean(item.isBoss || overrides.isBoss),
    x: overrides.x ?? lanes[index % lanes.length] + Math.random() * 54 - 27,
    depth: overrides.depth ?? Math.min(maxDepth - 0.2, depth + Math.random() * 0.9),
    dir: overrides.dir ?? (index % 2 === 0 ? 1 : -1),
    speed: 0.25 + Math.random() * 0.55,
    phase: Math.random() * Math.PI * 2,
    valueMultiplier: 1,
    attempted: false,
    hooked: false,
    escaped: false,
  };
}

function resetRound() {
  state.depth = 0;
  state.spent = 0;
  state.status = "ready";
  state.isHolding = false;
  state.sharksEnabled = sharkToggle ? sharkToggle.checked : state.sharksEnabled;
  state.fakePlayersEnabled = fakePlayersToggle ? fakePlayersToggle.checked : state.fakePlayersEnabled;
  state.lastTickDepth = 0;
  state.hookY = hookDiveY;
  state.messageTimer = 0;
  state.shark = null;
  state.effects = [];
  state.rocks = [];
  state.goldenBubbles = [];
  state.caughtFish = [];
  state.bestCandidate = null;
  state.roundBoss = null;
  state.bossOmen = omenForBoss(state.roundBoss);
  state.bossOmenTriggered = false;
  state.bossOmenTimer = 0;
  state.pullProgress = 0;
  state.pullStartDepth = 0;
  state.pullWindupTimer = 0;
  state.pullShuffleTimer = 0;
  state.pullSurgeTimer = 0;
  state.hookShakeTimer = 0;
  state.roulette = null;
  state.bossWheel = null;
  state.struggleChecks = [];
  state.pendingMysteryFish = null;
  state.result = null;
  state.fakePlayers = makeFakePlayers();
  state.fakeEvents = [];
  state.fish = makeFish();
  state.goldenBubbles = makeGoldenBubbles();
  resultPanel.classList.add("hidden");
  newRoundButton.textContent = "NEW ROUND";
  if (bossOmenOverlay) bossOmenOverlay.classList.add("hidden");
  deepButton.disabled = state.balance < bet();
  pullButton.disabled = true;
  updateHud();
}

function makeFish() {
  const fish = [];

  for (let depth = 1.2; depth < maxDepth; depth += 1.05 + Math.random() * 0.9) {
    const item = specialForDepth(depth) || catalogForDepth(depth);
    const index = fish.length;
    fish.push(makeFishInstance(item, index, depth));
  }

  const boss = null;
  if (boss) {
    const bossDepth = 82 + Math.random() * 16;
    fish.push(makeFishInstance(boss, fish.length, bossDepth, {
      x: W / 2 + Math.random() * 140 - 70,
      depth: bossDepth,
      dir: Math.random() < 0.5 ? 1 : -1,
      fixedMult: boss.mult,
      isBoss: true,
    }));
  }

  fish.push(makeFishInstance(finalPrizeForDepth(), fish.length, maxDepth, {
    x: W / 2 + Math.random() * 58 - 29,
    depth: maxDepth - 0.15,
    dir: Math.random() < 0.5 ? 1 : -1,
    catchRate: 0.34,
  }));

  return fish;
}

function makeGoldenBubbles() {
  const bubbles = [];
  for (let depth = 12; depth < maxDepth - 4; depth += 18 + Math.random() * 10) {
    const x = 90 + Math.random() * (W - 180);
    bubbles.push({
      depth,
      baseX: x,
      x,
      r: 24 + Math.random() * 8,
      phase: Math.random() * Math.PI * 2,
      dir: Math.random() < 0.5 ? -1 : 1,
      speed: 32 + Math.random() * 58,
      driftRange: 70 + Math.random() * 120,
      triggered: false,
    });
  }
  return bubbles;
}

function makeFakePlayers() {
  const names = ["Seven", "Mad", "Hao", "CC", "Ivan", "Hank"];
  const colors = ["#ff9aa7", "#8ff6ff", "#ffd36a", "#b86cff", "#78e6a3", "#ffb36a"];
  return names.map((name, index) => ({
    name,
    color: colors[index],
    lane: 78 + index * ((W - 156) / Math.max(1, names.length - 1)) + Math.random() * 24 - 12,
    depth: Math.random() * 12,
    targetDepth: 22 + Math.random() * 58,
    phase: Math.random() * Math.PI * 2,
    status: index % 2 === 0 ? "diving" : "idle",
    timer: 0.6 + Math.random() * 3,
    opacity: 0.36 + Math.random() * 0.18,
  }));
}

function updateHud() {
  const risk = riskForDepth(Math.max(1, state.depth));
  balanceText.textContent = money(state.balance);
  betText.textContent = bet().toLocaleString("en-US");
  depthText.textContent = `${Math.floor(state.depth)}F`;
  riskText.textContent = risk.label;
  riskText.style.color = risk.color;
  costText.textContent = money(state.spent);
  bestFishText.textContent = state.caughtFish.length
    ? `${state.caughtFish.length} FISH ${money(caughtFishPayout())}`
    : state.bestCandidate
    ? `${state.bestCandidate.name} ${fishValue(state.bestCandidate)}`
    : "-";
}

function refillBalanceForDev() {
  state.balance = 10000;
  if (state.status === "ready") {
    deepButton.disabled = state.balance < bet();
  }
  updateHud();
}

function beginDive() {
  ensureAudio();
  ensureMusic();
  if (state.status === "ready") {
    if (state.balance < bet()) {
      showResult("NO BALANCE", "Need More Balance", "Lower the bet or start again with enough balance.", true);
      return;
    }
    state.status = "diving";
    resultPanel.classList.add("hidden");
    pullButton.disabled = false;
    betDownButton.disabled = true;
    betUpButton.disabled = true;
  }
  if (state.status === "diving") {
    if (state.balance < bet()) {
      pauseForNoBalance();
      return;
    }
    state.isHolding = true;
    deepButton.classList.add("is-held");
    sound.dive();
  }
}

function stopDive() {
  state.isHolding = false;
  deepButton.classList.remove("is-held");
}

function pauseForNoBalance() {
  state.isHolding = false;
  deepButton.classList.remove("is-held");
  deepButton.disabled = true;
  pullButton.disabled = state.depth <= 0;
}

function updateCrimsonChanceText() {
  if (!crimsonChanceSlider || !crimsonChanceText) return;
  crimsonChanceText.textContent = `${crimsonChanceSlider.value}%`;
}

function updateBossChanceText() {
  updateCrimsonChanceText();
  if (octopusChanceSlider && octopusChanceText) octopusChanceText.textContent = `${octopusChanceSlider.value}%`;
  if (mysteryChanceSlider && mysteryChanceText) mysteryChanceText.textContent = `${mysteryChanceSlider.value}%`;
}

function startPull() {
  ensureAudio();
  ensureMusic();
  state.status = "shuffle";
  state.isHolding = false;
  state.bossOmenTimer = 0;
  state.pullProgress = 0;
  state.pullStartDepth = state.depth;
  state.pullWindupTimer = pullShakeDuration;
  state.pullShuffleTimer = 0;
  state.pullSurgeTimer = 0;
  state.hookShakeTimer = pullShakeDuration;
  state.rocks = [];
  if (bossOmenOverlay) bossOmenOverlay.classList.add("hidden");
  deepButton.disabled = true;
  pullButton.disabled = true;
  sound.pull();
}

function triggerPullSurge() {
  let longestShuffle = 0;
  for (const fish of state.fish) {
    if (fish.hooked || fish.escaped || fish.depth > state.pullStartDepth) continue;
    fish.shuffleTimer = 0.5 + Math.random() * 1.0;
    fish.shuffleDuration = fish.shuffleTimer;
    fish.shuffleSpeed = 4.5 + Math.random() * 4.5;
    fish.shuffleTurnTimer = 0.08 + Math.random() * 0.22;
    fish.dir = Math.random() < 0.5 ? -1 : 1;
    fish.phase = Math.random() * Math.PI * 2;
    longestShuffle = Math.max(longestShuffle, fish.shuffleTimer);
  }
  longestShuffle = Math.max(0.5, longestShuffle);
  state.effects.push({
    type: "pull-surge",
    x: W / 2,
    y: hookDiveY,
    timer: 0,
    duration: longestShuffle,
  });
  return longestShuffle;
}

function finishPullShuffle() {
  state.status = "pulling";
  state.pullWindupTimer = 0;
  state.pullShuffleTimer = 0;
  state.pullSurgeTimer = 0;
  state.hookShakeTimer = 0;
  for (const fish of state.fish) {
    fish.shuffleTimer = 0;
    fish.shuffleDuration = null;
    fish.shuffleSpeed = null;
    fish.shuffleTurnTimer = null;
  }
  state.rocks = makePullRocks(state.depth);
}

function sinkStep(dt) {
  if (!state.isHolding || state.status !== "diving") return;

  if (state.balance < bet()) {
    pauseForNoBalance();
    return;
  }

  const depthGain = dt * 7.1;
  state.depth = Math.min(maxDepth, state.depth + depthGain);
  state.hookY = yForDepth(state.depth);

  while (Math.floor(state.depth) > state.lastTickDepth) {
    if (state.balance < bet()) {
      pauseForNoBalance();
      return;
    }

    state.lastTickDepth += 1;
    state.spent += bet();
    state.balance -= bet();
    sound.tick();

    const risk = riskForDepth(state.lastTickDepth);
    if (state.sharksEnabled && Math.random() < risk.rate) {
      triggerShark();
      return;
    }

    if (state.balance < bet()) {
      pauseForNoBalance();
      return;
    }

    if (state.lastTickDepth >= maxDepth) {
      pauseAtBottom();
      return;
    }
  }
}

function pauseAtBottom() {
  state.depth = maxDepth;
  state.hookY = yForDepth(state.depth);
  state.isHolding = false;
  deepButton.classList.remove("is-held");
  deepButton.disabled = true;
  pullButton.disabled = false;
}

function triggerShark() {
  state.status = "cut";
  state.isHolding = false;
  deepButton.classList.remove("is-held");
  deepButton.disabled = true;
  pullButton.disabled = true;
  state.shark = {
    x: W + 160,
    y: hookDiveY + Math.random() * 120 - 60,
    speed: 980,
    done: false,
  };
  sound.shark();
}

function updatePullShuffle(dt) {
  if (state.status !== "shuffle") return;
  state.hookY = yForDepth(state.depth);

  if (state.pullWindupTimer > 0) {
    state.pullWindupTimer = Math.max(0, state.pullWindupTimer - dt);
    if (state.pullWindupTimer <= 0) {
      state.pullShuffleTimer = triggerPullSurge();
      state.pullSurgeTimer = state.pullShuffleTimer;
    }
    return;
  }

  state.pullShuffleTimer = Math.max(0, state.pullShuffleTimer - dt);
  if (state.pullShuffleTimer <= 0) {
    finishPullShuffle();
  }
}

function updatePull(dt) {
  if (state.status !== "pulling") return;
  if (state.roulette) return;

  const pullSpeed = 6.2;
  const previousDepth = state.depth;
  state.depth = Math.max(0, state.depth - pullSpeed * dt);
  state.hookY = yForDepth(state.depth);

  updatePullRocks(dt);

  for (const fish of state.fish) {
    if (fish.hooked || fish.escaped || fish.isBoss || state.caughtFish.length >= 5) continue;
    if (fish.depth < state.depth || fish.depth > previousDepth) continue;

    const fishY = yForDepth(fish.depth);
    const distance = Math.hypot(fish.x - W / 2, fishY - hookDiveY);
    if (distance <= hookCatchRadius) {
      fish.hooked = true;
      fish.chainIndex = state.caughtFish.length;
      state.caughtFish.push(fish);
      state.bestCandidate = fish;
      sound.hook();
    }
  }

  maybeTriggerGoldenBubble(previousDepth);
  updateCaughtFishChain(dt);
  checkRockHits();

  if (state.depth <= 0) {
    finishPull();
  }
}

function maybeTriggerGoldenBubble(previousDepth) {
  if (state.roulette) return;
  for (const bubble of state.goldenBubbles) {
    if (bubble.triggered) continue;
    if (bubble.depth < state.depth || bubble.depth > previousDepth) continue;

    const bubbleY = yForDepth(bubble.depth);
    const distance = Math.hypot(bubble.x - W / 2, bubbleY - hookDiveY);
    if (distance <= hookCatchRadius + bubble.r) {
      bubble.triggered = true;
      startGoldenBubbleRoulette();
      return;
    }
  }
}

function updateGoldenBubbles(dt) {
  for (const bubble of state.goldenBubbles) {
    if (bubble.triggered) continue;
    bubble.x += bubble.dir * bubble.speed * dt;

    const left = Math.max(62, bubble.baseX - bubble.driftRange);
    const right = Math.min(W - 62, bubble.baseX + bubble.driftRange);
    if (bubble.x <= left) {
      bubble.x = left;
      bubble.dir = 1;
    } else if (bubble.x >= right) {
      bubble.x = right;
      bubble.dir = -1;
    }
  }
}

function startGoldenBubbleRoulette() {
  const outcome = Math.random() < 0.5 ? "DOUBLE" : "SAFE";
  state.roulette = {
    timer: 0,
    duration: 0.95,
    settleTimer: 0,
    settleDuration: 0.55,
    settled: false,
    outcome,
    mode: "golden",
    doubleChance: 0.5,
    finalPointerAngle: pickGoldenBubbleLanding(outcome),
    startAngle: Math.random() * Math.PI * 2,
    spins: 4 + Math.floor(Math.random() * 3),
    resolved: false,
  };
  sound.roulette();
}

function pickGoldenBubbleLanding(outcome) {
  const margin = 0.16;
  if (outcome === "DOUBLE") {
    return margin + Math.random() * (Math.PI - margin * 2);
  }
  return Math.PI + margin + Math.random() * (Math.PI - margin * 2);
}

function makePullRocks(startDepth) {
  const rocks = [];
  for (let depth = Math.max(8, startDepth - 8); depth > 4; depth -= 7 + Math.random() * 5) {
    rocks.push({
      depth,
      x: 110 + Math.random() * (W - 220),
      y: yForDepth(depth),
      w: 124 + Math.random() * 82,
      h: 38 + Math.random() * 22,
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: 135 + Math.random() * 120,
      cooldown: 0,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return rocks;
}

function updatePullRocks(dt) {
  for (const rock of state.rocks) {
    rock.x += rock.dir * rock.speed * dt;
    rock.y = yForDepth(rock.depth);
    rock.cooldown = Math.max(0, rock.cooldown - dt);
    if (rock.x < 70 || rock.x > W - 70) rock.dir *= -1;
  }
}

function updateCaughtFishChain(dt) {
  state.caughtFish.forEach((fish, index) => {
    fish.chainIndex = index;
    fish.x += (W / 2 + Math.sin(state.time * 7 + index) * 18 - fish.x) * Math.min(1, dt * 9);
    fish.y = hookDiveY + 64 + index * 34;
  });
}

function checkRockHits() {
  if (!state.caughtFish.length) return;
  for (const rock of state.rocks) {
    if (rock.cooldown > 0) continue;
    if (rock.y < hookDiveY - 35 || rock.y > hookDiveY + 88 + state.caughtFish.length * 34) continue;
    if (Math.abs(rock.x - W / 2) > rock.w * 0.5 + 34) continue;

    const dropCount = 1 + Math.floor(Math.random() * state.caughtFish.length);
    dropCaughtFish(dropCount, rock);
    rock.cooldown = 1.6;
    sound.escape();
  }
}

function dropCaughtFish(count, rock) {
  const dropped = [];
  for (let i = 0; i < count && state.caughtFish.length; i += 1) {
    const index = Math.floor(Math.random() * state.caughtFish.length);
    const [fish] = state.caughtFish.splice(index, 1);
    fish.hooked = false;
    fish.escaped = true;
    dropped.push(fish);
  }
  addRockHitEffect(rock, dropped.length);
  state.bestCandidate = state.caughtFish[state.caughtFish.length - 1] || null;
}


function struggleProfile(fish) {
  if (fish.mult <= 4) return { count: 1, escapeChance: 0.06, progress: [0.6] };
  if (fish.mult <= 6) return { count: 1, escapeChance: 0.08, progress: [0.6] };
  if (fish.mult <= 12) return { count: 2, escapeChance: 0.1, progress: [0.45, 0.75] };
  if (fish.mult <= 19) return { count: 2, escapeChance: 0.13, progress: [0.45, 0.75] };
  if (fish.mult <= 40) return { count: 3, escapeChance: 0.16, progress: [0.3, 0.6, 0.85] };
  if (fish.mult <= 75) return { count: 3, escapeChance: 0.2, progress: [0.3, 0.6, 0.85] };
  return { count: 3, escapeChance: 0.24, progress: [0.3, 0.6, 0.85] };
}

function setupStruggleChecks(fish) {
  if (fish.isBoss) {
    if (fish.bossType !== "crimson") {
      const caughtDepth = Math.max(0.6, state.depth);
      state.struggleChecks = [{
        index: 1,
        total: 1,
        depth: Math.max(0.25, caughtDepth * 0.52),
        escapeChance: 0.3,
        done: false,
      }];
      return;
    }
    const caughtDepth = Math.max(0.6, state.depth);
    state.struggleChecks = [0.2, 0.4, 0.6, 0.8].map((progress, index) => ({
      index: index + 1,
      total: 4,
      depth: Math.max(0.25, caughtDepth * (1 - progress)),
      escapeChance: 1 - bossDoubleChance,
      doubleChance: bossDoubleChance,
      mode: "boss",
      done: false,
    }));
    return;
  }

  const profile = struggleProfile(fish);
  const caughtDepth = Math.max(0.6, state.depth);
  state.struggleChecks = profile.progress.slice(0, profile.count).map((progress, index) => ({
    index: index + 1,
    total: profile.count,
    depth: Math.max(0.25, caughtDepth * (1 - progress)),
    escapeChance: profile.escapeChance,
    done: false,
  }));
}

function maybeStartStruggle() {
  const fish = state.caughtFish;
  if (!fish || state.roulette) return;
  if (fish.bossType === "crimson") return;
  const check = state.struggleChecks.find((item) => !item.done && state.depth <= item.depth);
  if (!check || state.depth <= 0.2) return;

  check.done = true;
  const checkDoubleChance = check.doubleChance ?? doubleChance;
  const zones = rouletteZones(check.escapeChance, checkDoubleChance);
  const landingAngle = pickRouletteLanding(zones);
  const outcome = outcomeForRouletteAngle(landingAngle, zones);

  state.roulette = {
    timer: 0,
    duration: 1.05,
    settleTimer: 0,
    settleDuration: 0.75,
    settled: false,
    outcome,
    mode: check.mode || "fish",
    escapeChance: check.escapeChance,
    doubleChance: checkDoubleChance,
    checkIndex: check.index,
    checkTotal: check.total,
    escapeStart: zones.escape.start,
    escapeEnd: zones.escape.end,
    doubleStart: zones.double.start,
    doubleEnd: zones.double.end,
    finalPointerAngle: landingAngle,
    startAngle: Math.random() * Math.PI * 2,
    spins: 4 + Math.floor(Math.random() * 3),
    resolved: false,
  };
  sound.roulette();
}

function bossOutcomeForAngle(angle) {
  const value = normalizeAngle(angle);
  return value > Math.PI && value < TAU ? "ESCAPE" : "DOUBLE";
}

function pickBossLanding(outcome) {
  const margin = 0.16;
  if (outcome === "ESCAPE") {
    return Math.PI + margin + Math.random() * (Math.PI - margin * 2);
  }
  return margin + Math.random() * (Math.PI - margin * 2);
}

function maybeStartBossWheel() {
  const fish = state.caughtFish;
  if (!fish || !fish.isBoss || state.bossWheel) return;
  const check = state.struggleChecks.find((item) => item.mode === "boss" && !item.done && state.depth <= item.depth);
  if (!check || state.depth <= 0.2) return;

  check.done = true;
  const outcome = Math.random() < (check.doubleChance ?? bossDoubleChance) ? "DOUBLE" : "ESCAPE";
  state.bossWheel = {
    timer: 0,
    duration: 1.18,
    settleTimer: 0,
    settleDuration: 0.82,
    settled: false,
    outcome,
    escapeChance: check.escapeChance,
    doubleChance: check.doubleChance,
    checkIndex: check.index,
    checkTotal: check.total,
    finalPointerAngle: pickBossLanding(outcome),
    startAngle: Math.random() * Math.PI * 2,
    spins: 5 + Math.floor(Math.random() * 3),
    resolved: false,
  };
  sound.roulette();
}

function updateBossWheel(dt) {
  maybeStartBossWheel();
  if (!state.bossWheel) return;

  const wheel = state.bossWheel;

  if (!wheel.settled) {
    const previousTimer = wheel.timer;
    wheel.timer = Math.min(wheel.duration, wheel.timer + dt);

    if (wheel.timer < wheel.duration) {
      if (Math.floor(wheel.timer * 18) !== Math.floor(previousTimer * 18)) {
        sound.roulette();
      }
      return;
    }

    wheel.settled = true;
    wheel.settleTimer = 0;
    if (wheel.outcome === "ESCAPE") {
      sound.escape();
    } else {
      sound.win();
    }
    return;
  }

  wheel.settleTimer += dt;
  if (wheel.settleTimer < wheel.settleDuration) {
    if (wheel.outcome !== "ESCAPE" && Math.floor(wheel.settleTimer * 5) !== Math.floor((wheel.settleTimer - dt) * 5)) {
      sound.roulette();
    }
    return;
  }

  if (wheel.resolved) return;
  wheel.resolved = true;

  const visibleOutcome = bossOutcomeForAngle(wheel.finalPointerAngle);
  if (visibleOutcome === "ESCAPE") {
    const escapedName = state.caughtFish ? state.caughtFish.name : "Boss";
    if (state.caughtFish) state.caughtFish.escaped = true;
    state.caughtFish = null;
    state.bossWheel = null;
    showResult("BOSS ESCAPED", `${escapedName} Broke Free`, "The boss wheel landed on ESCAPE. Payout is $0.", true);
    return;
  }

  if (state.caughtFish?.bossType === "crimson") {
    state.caughtFish.valueMultiplier = (state.caughtFish.valueMultiplier || 1) * 2;
    state.caughtFish.doubleFlash = 1.2;
    state.bestCandidate = state.caughtFish;
    addDoubleEffect(state.caughtFish);
  } else if (state.caughtFish) {
    state.caughtFish.safeFlash = 0.8;
    state.bestCandidate = state.caughtFish;
  }
  state.bossWheel = null;
}

function updateRoulette(dt) {
  if (!state.roulette) return;

  const roulette = state.roulette;

  if (!roulette.settled) {
    const previousTimer = roulette.timer;
    roulette.timer = Math.min(roulette.duration, roulette.timer + dt);

    if (roulette.timer < roulette.duration) {
      if (Math.floor(roulette.timer * 18) !== Math.floor(previousTimer * 18)) {
        sound.roulette();
      }
      return;
    }

    roulette.settled = true;
    roulette.settleTimer = 0;
    if (roulette.outcome === "ESCAPE") {
      sound.escape();
    } else if (roulette.outcome === "DOUBLE") {
      sound.win();
    } else {
      sound.safe();
    }
    return;
  }

  roulette.settleTimer += dt;
  if (roulette.settleTimer < roulette.settleDuration) {
    if (roulette.outcome !== "ESCAPE" && Math.floor(roulette.settleTimer * 5) !== Math.floor((roulette.settleTimer - dt) * 5)) {
      sound.roulette();
    }
    return;
  }

  if (roulette.resolved) return;
  roulette.resolved = true;

  if (roulette.mode === "golden") {
    if (roulette.outcome === "DOUBLE") {
      for (const fish of state.caughtFish) {
        fish.valueMultiplier = (fish.valueMultiplier || 1) * 2;
        fish.doubleFlash = 1.2;
      }
      if (state.caughtFish.length) {
        state.bestCandidate = state.caughtFish[state.caughtFish.length - 1];
        addDoubleEffect(state.bestCandidate);
      }
    }
    state.roulette = null;
    return;
  }

  const visibleOutcome = outcomeForRouletteAngle(roulette.finalPointerAngle, {
    escape: { start: roulette.escapeStart, end: roulette.escapeEnd },
    double: { start: roulette.doubleStart, end: roulette.doubleEnd },
  });

  if (visibleOutcome === "ESCAPE") {
    if (state.caughtFish) state.caughtFish.escaped = true;
    state.caughtFish = null;
    state.roulette = null;
    showResult("ESCAPED", "Fish Broke Free", "The struggle wheel landed on ESCAPE. Payout is $0.", true);
    return;
  }

  if (visibleOutcome === "DOUBLE" && state.caughtFish) {
    state.caughtFish.valueMultiplier = (state.caughtFish.valueMultiplier || 1) * 2;
    state.caughtFish.doubleFlash = 1.2;
    state.bestCandidate = state.caughtFish;
    addDoubleEffect(state.caughtFish);
  }

  state.roulette = null;
}

function finishPull() {
  if (!state.caughtFish.length) {
    sound.lose();
    showResult("EMPTY HOOK", "No Catch", "The hook came back clean. Payout is $0.", true);
    return;
  }

  const payout = caughtFishPayout();
  state.balance += payout;
  sound.win();
  showResult(
    "CAUGHT",
    `${state.caughtFish.length} Fish ${money(payout)}`,
    `Payout ${money(payout)} from ${state.caughtFish.length} fish. Total dive cost was ${money(state.spent)}.`,
    true
  );
}

function caughtFishPayout() {
  return state.caughtFish.reduce((total, fish) => total + bet() * fish.mult * (fish.valueMultiplier || 1), 0);
}

function payoutForCatch(fish) {
  if (fish.bossType === "octopus") {
    return bet() * (fish.mult + (fish.collectorBonusMult || 0)) * (fish.valueMultiplier || 1);
  }
  if (fish.bossType === "mystery") {
    if (!fish.mysteryMult) fish.mysteryMult = mysteryPrizeMult();
    return bet() * fish.mysteryMult * (fish.valueMultiplier || 1);
  }
  return bet() * fish.mult * (fish.valueMultiplier || 1);
}

function resultBodyForCatch(fish, payout) {
  if (fish.bossType === "crimson") {
    return `Four boss gambles cleared. Payout ${money(payout)}. Total dive cost was ${money(state.spent)}.`;
  }
  if (fish.bossType === "octopus") {
    const doubleText = (fish.valueMultiplier || 1) > 1 ? ` Wheel multiplier x${Math.round(fish.valueMultiplier)}.` : "";
    return `Collector grabbed ${fish.collectorCount || 0} fish.${doubleText} Payout ${money(payout)}. Total dive cost was ${money(state.spent)}.`;
  }
  if (fish.bossType === "mystery") {
    const doubleText = (fish.valueMultiplier || 1) > 1 ? ` Wheel multiplier x${Math.round(fish.valueMultiplier)}.` : "";
    return `Mystery prize opened at ${Math.round(fish.mysteryMult)}X.${doubleText} Payout ${money(payout)}. Total dive cost was ${money(state.spent)}.`;
  }
  return `Payout ${money(payout)}. Total dive cost was ${money(state.spent)}.`;
}

function mysteryPrizeMult() {
  const roll = Math.random();
  if (roll < 0.55) return Math.round(100 + Math.random() * 400);
  if (roll < 0.85) return Math.round(500 + Math.random() * 1500);
  if (roll < 0.97) return Math.round(2000 + Math.random() * 3500);
  return Math.round(6000 + Math.random() * 4000);
}

function openMysteryClam() {
  const fish = state.pendingMysteryFish;
  if (!fish) return false;
  fish.mysteryOpened = true;
  fish.mysteryMult = mysteryPrizeMult();
  const payout = payoutForCatch(fish);
  state.balance += payout;
  state.pendingMysteryFish = null;
  sound.win();
  showResult(
    "PEARL OPENED",
    `${fish.name} ${money(payout)}`,
    resultBodyForCatch(fish, payout),
    true
  );
  return true;
}

function showResult(kicker, title, body, canRestart, buttonText = "NEW ROUND") {
  state.status = "finished";
  state.isHolding = false;
  resultKicker.textContent = kicker;
  resultTitle.textContent = title;
  resultBody.textContent = body;
  resultPanel.classList.remove("hidden");
  if (bossOmenOverlay) bossOmenOverlay.classList.add("hidden");
  deepButton.classList.remove("is-held");
  deepButton.disabled = true;
  pullButton.disabled = true;
  newRoundButton.disabled = !canRestart;
  newRoundButton.textContent = buttonText;
  betDownButton.disabled = false;
  betUpButton.disabled = false;
  updateHud();
}

function updateShark(dt) {
  if (!state.shark) return;
  state.shark.x -= state.shark.speed * dt;
  if (!state.shark.done && state.shark.x < W / 2 + 35) {
    state.shark.done = true;
    state.hookY += 20;
  }
  if (state.shark.x < -260) {
    showResult("LINE CUT", "Saw Shark Strike", `The line snapped at ${Math.floor(state.depth)}F. Payout is $0.`, true);
  }
}

function updateFish(dt) {
  const surgeActive = state.status === "shuffle" && state.pullSurgeTimer > 0;
  for (const fish of state.fish) {
    if (fish.doubleFlash) fish.doubleFlash = Math.max(0, fish.doubleFlash - dt);
    if (fish.hooked) continue;
    const isSurging = surgeActive && fish.depth <= state.pullStartDepth;
    if (isSurging && fish.shuffleTimer > 0) {
      fish.shuffleTimer = Math.max(0, fish.shuffleTimer - dt);
      fish.shuffleTurnTimer = Math.max(0, (fish.shuffleTurnTimer || 0) - dt);
      if (fish.shuffleTurnTimer <= 0 && Math.random() < 0.72) {
        fish.dir *= -1;
        fish.shuffleTurnTimer = 0.08 + Math.random() * 0.22;
      }
      fish.phase += dt * 22;
      fish.x += fish.speed * fish.dir * dt * 350 * (fish.shuffleSpeed || 5);
      if (fish.shuffleTimer <= 0) {
        fish.shuffleDuration = null;
        fish.shuffleSpeed = null;
        fish.shuffleTurnTimer = null;
      }
    } else {
      fish.phase += dt * 5.6;
      fish.x += fish.speed * fish.dir * dt * 350;
    }

    if (fish.x < 68) fish.dir = 1;
    if (fish.x > W - 68) fish.dir = -1;
    fish.x = Math.max(68, Math.min(W - 68, fish.x));
  }
  state.pullSurgeTimer = Math.max(0, state.pullSurgeTimer - dt);
  state.hookShakeTimer = Math.max(0, state.hookShakeTimer - dt);
}

function addDoubleEffect(fish) {
  state.effects.push({
    type: "double",
    x: W / 2,
    y: hookDiveY + 62,
    timer: 0,
    duration: 1.1,
    multiplier: fish.valueMultiplier || 2,
  });
}

function addCollectorEffect(fish, boss) {
  state.effects.push({
    type: "collector",
    x: fish.x,
    y: yForDepth(fish.depth),
    timer: 0,
    duration: 1.0,
    value: bet() * fish.mult,
    total: bet() * ((boss.mult || 0) + (boss.collectorBonusMult || 0)),
  });
}

function addRockHitEffect(rock, count) {
  state.effects.push({
    type: "rock-hit",
    x: W / 2,
    y: hookDiveY + 30,
    timer: 0,
    duration: 1.0,
    count,
  });
}

function updateEffects(dt) {
  for (const effect of state.effects) {
    effect.timer += dt;
  }
  state.effects = state.effects.filter((effect) => effect.timer < effect.duration);
}

function updateFakePlayers(dt) {
  if (!state.fakePlayersEnabled) {
    state.fakeEvents = [];
    return;
  }

  const pressure = state.bossOmenTriggered && state.depth < 88 ? 1.35 : 1;
  for (const player of state.fakePlayers) {
    player.timer -= dt;
    player.phase += dt * 2;

    if (player.status === "idle") {
      if (player.timer <= 0) {
        player.status = "diving";
        player.targetDepth = Math.max(12, Math.min(maxDepth, state.depth + 18 + Math.random() * 34));
        player.timer = 1.5 + Math.random() * 2.5;
      }
      continue;
    }

    if (player.status === "diving") {
      player.depth = Math.min(player.targetDepth, player.depth + dt * (8 + Math.random() * 3) * pressure);
      if (player.depth >= player.targetDepth - 0.5 || player.timer <= 0) {
        player.status = "pulling";
        player.timer = 1.4 + Math.random() * 2.2;
        addFakeEvent(`${player.name} starts pulling at ${Math.floor(player.depth)}F`, player.color);
      }
      continue;
    }

    if (player.status === "pulling") {
      player.depth = Math.max(0, player.depth - dt * (10 + Math.random() * 4));
      if (player.depth <= 1 || player.timer <= 0) {
        fakePlayerResult(player);
        player.status = "idle";
        player.timer = 1.8 + Math.random() * 4.4;
        player.targetDepth = 18 + Math.random() * 62;
      }
    }
  }

  for (const event of state.fakeEvents) event.timer += dt;
  state.fakeEvents = state.fakeEvents.filter((event) => event.timer < event.duration);
}

function fakePlayerResult(player) {
  const bossHint = state.bossOmen && Math.random() < 0.35;
  if (bossHint) {
    addFakeEvent(`${player.name} rushes the ${state.bossOmen.type.toUpperCase()} signal`, player.color);
    return;
  }

  const roll = Math.random();
  if (roll < 0.22) {
    addFakeEvent(`${player.name} lost the line`, player.color);
  } else if (roll < 0.52) {
    addFakeEvent(`${player.name} escaped at ${Math.floor(player.depth + Math.random() * 18)}F`, player.color);
  } else {
    const fakeWin = bet() * (6 + Math.floor(Math.random() * 90));
    addFakeEvent(`${player.name} pulled ${money(fakeWin)}`, player.color);
  }
}

function addFakeEvent(text, color) {
  state.fakeEvents.unshift({
    text,
    color,
    timer: 0,
    duration: 2.6,
  });
  state.fakeEvents = state.fakeEvents.slice(0, 4);
}

function addBubbles(dt) {
  if (Math.random() < dt * 9) {
    state.bubbles.push({
      x: Math.random() * W,
      y: H + 20,
      r: 2 + Math.random() * 6,
      speed: 24 + Math.random() * 70,
      drift: Math.random() * 22 - 11,
    });
  }

  for (const bubble of state.bubbles) {
    bubble.y -= bubble.speed * dt;
    bubble.x += bubble.drift * dt;
  }
  state.bubbles = state.bubbles.filter((bubble) => bubble.y > -30);
}

function drawBackground() {
  const depthRatio = Math.min(1, state.depth / maxDepth);
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, depthRatio < 0.2 ? "#61c2df" : "#276f91");
  sea.addColorStop(0.18, depthRatio < 0.52 ? "#127aa7" : "#0b527c");
  sea.addColorStop(0.45, depthRatio < 0.52 ? "#0c4c76" : "#08385f");
  sea.addColorStop(0.72, depthRatio < 0.52 ? "#082c4b" : "#041d38");
  sea.addColorStop(1, depthRatio < 0.52 ? "#051725" : "#020914");
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = Math.max(0.08, 0.4 - depthRatio * 0.32);
  for (let i = 0; i < 7; i += 1) {
    const y = 92 + i * 21 + Math.sin(state.time * 1.4 + i) * 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 24) {
      ctx.lineTo(x, y + Math.sin(x * 0.025 + state.time * 2 + i) * 12);
    }
    ctx.strokeStyle = i < 3 ? "#dbfbff" : "#76d5ec";
    ctx.lineWidth = i < 2 ? 5 : 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  if (state.depth < 0.45 && state.status === "ready") {
    drawBoat();
  }
  drawDepthMarkers();
  drawRocks();
  drawBubbles();
}

function drawDepthShade(depthRatio) {
  const darkness = Math.min(0.72, depthRatio * 0.68);
  const danger = riskForDepth(Math.max(1, state.depth)).label === "HIGH";

  ctx.save();
  ctx.fillStyle = `rgba(0, 8, 20, ${darkness})`;
  ctx.fillRect(0, 0, W, H);

  if (depthRatio > 0.2) {
    const vignette = ctx.createRadialGradient(W / 2, hookDiveY, 80, W / 2, hookDiveY, 520);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, `rgba(0, 0, 0, ${0.16 + depthRatio * 0.34})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  if (danger) {
    ctx.fillStyle = `rgba(90, 0, 20, ${Math.min(0.18, (depthRatio - 0.5) * 0.22)})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

function drawEffects() {
  for (const effect of state.effects) {
    if (effect.type === "pull-surge") {
      const progress = Math.min(1, effect.timer / effect.duration);
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = "#c9f6ff";
      ctx.lineWidth = 12 * alpha + 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 52 + progress * 340, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = "#c9f6ff";
      ctx.fillRect(0, hookDiveY - 100 - progress * 35, W, 200 + progress * 70);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fff6da";
      ctx.strokeStyle = "#0b527c";
      ctx.lineWidth = 4;
      ctx.font = "950 30px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText("CURRENT SHIFT", effect.x, effect.y - 108 - progress * 34);
      ctx.fillText("CURRENT SHIFT", effect.x, effect.y - 108 - progress * 34);
      ctx.restore();
      continue;
    }
    if (effect.type === "rock-hit") {
      const progress = Math.min(1, effect.timer / effect.duration);
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ff5966";
      ctx.strokeStyle = "#2b0710";
      ctx.lineWidth = 5;
      ctx.font = "950 38px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(`LOST ${effect.count}`, effect.x, effect.y - progress * 42);
      ctx.fillText(`LOST ${effect.count}`, effect.x, effect.y - progress * 42);
      ctx.restore();
      continue;
    }
    if (effect.type === "collector") {
      const progress = Math.min(1, effect.timer / effect.duration);
      const alpha = 1 - progress;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#e6b3ff";
      ctx.strokeStyle = "#261044";
      ctx.lineWidth = 4;
      ctx.font = "950 30px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeText(`GRAB +${money(effect.value)}`, effect.x, effect.y - 36 - progress * 60);
      ctx.fillText(`GRAB +${money(effect.value)}`, effect.x, effect.y - 36 - progress * 60);
      ctx.restore();
      continue;
    }
    if (effect.type !== "double") continue;
    const progress = Math.min(1, effect.timer / effect.duration);
    const alpha = 1 - progress;
    const radius = 45 + progress * 190;

    ctx.save();
    ctx.globalAlpha = alpha * 0.75;
    ctx.strokeStyle = "#ffd36a";
    ctx.lineWidth = 8 * (1 - progress) + 2;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.28;
    ctx.fillStyle = "#ffd36a";
    for (let i = 0; i < 10; i += 1) {
      const angle = i * (Math.PI * 2 / 10) + progress * 1.4;
      const distance = 32 + progress * 150;
      ctx.beginPath();
      ctx.arc(effect.x + Math.cos(angle) * distance, effect.y + Math.sin(angle) * distance, 8 + progress * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffd36a";
    ctx.strokeStyle = "#4b2a14";
    ctx.lineWidth = 4;
    ctx.font = "950 54px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(`x${Math.round(effect.multiplier)}`, effect.x, effect.y - 88 - progress * 20);
    ctx.fillText(`x${Math.round(effect.multiplier)}`, effect.x, effect.y - 88 - progress * 20);
    ctx.restore();
  }
}

function drawBoat() {
  ctx.save();
  ctx.translate(W / 2, 70);
  ctx.rotate(-0.035);
  ctx.fillStyle = "#8e5737";
  ctx.beginPath();
  ctx.moveTo(-165, 5);
  ctx.lineTo(160, -5);
  ctx.quadraticCurveTo(125, 70, -110, 64);
  ctx.quadraticCurveTo(-155, 54, -165, 5);
  ctx.fill();
  ctx.fillStyle = "#d8a36e";
  ctx.fillRect(-88, -52, 150, 56);
  ctx.fillStyle = "#6a3426";
  ctx.fillRect(-40, -86, 55, 36);
  ctx.fillStyle = "#f1d3a3";
  for (let x = -132; x < 140; x += 46) {
    ctx.fillRect(x, -2, 34, 24);
  }
  ctx.restore();
}

function drawDepthMarkers() {
  ctx.save();
  ctx.textAlign = "right";
  ctx.font = "800 28px Trebuchet MS";
  const currentLayer = Math.floor(state.depth);

  for (let offset = 0; offset <= 4; offset += 1) {
    const depth = currentLayer + offset;
    if (depth > maxDepth) continue;
    const y = yForDepth(depth);
    const isCurrent = offset === 0;

    ctx.fillStyle = isCurrent ? "rgba(255, 246, 218, 0.9)" : "rgba(218, 239, 248, 0.52)";
    ctx.fillText(isCurrent ? `CURRENT ${depth}F` : `+${offset} ${depth}F`, W - 18, y + 10);

    ctx.strokeStyle = isCurrent ? "rgba(255, 211, 106, 0.45)" : "rgba(255, 255, 255, 0.13)";
    ctx.lineWidth = isCurrent ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(W - 175, y);
    ctx.lineTo(W - 14, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawRocks() {
  ctx.save();
  ctx.fillStyle = "rgba(3, 18, 30, 0.36)";
  ctx.beginPath();
  ctx.ellipse(72, 820, 86, 210, 0.2, 0, Math.PI * 2);
  ctx.ellipse(632, 760, 96, 260, -0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(125, 216, 222, 0.16)";
  for (let i = 0; i < 9; i += 1) {
    const x = 25 + i * 82;
    const h = 30 + (i % 3) * 22;
    ctx.beginPath();
    ctx.roundRect(x, H - 188 - h, 14, h, 8);
    ctx.fill();
  }
  ctx.restore();
}

function drawPullRocks() {
  if (state.status !== "pulling") return;
  for (const rock of state.rocks) {
    if (rock.y < hookTop - 80 || rock.y > H - 160) continue;
    ctx.save();
    ctx.translate(rock.x, rock.y + Math.sin(state.time * 3 + rock.phase) * 4);
    ctx.fillStyle = rock.cooldown > 0 ? "rgba(255, 89, 102, 0.88)" : "rgba(90, 105, 118, 0.94)";
    ctx.strokeStyle = rock.cooldown > 0 ? "#ffd36a" : "rgba(255, 231, 154, 0.82)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-rock.w * 0.5, rock.h * 0.2);
    ctx.lineTo(-rock.w * 0.32, -rock.h * 0.55);
    ctx.lineTo(-rock.w * 0.05, -rock.h * 0.35);
    ctx.lineTo(rock.w * 0.22, -rock.h * 0.62);
    ctx.lineTo(rock.w * 0.5, rock.h * 0.1);
    ctx.lineTo(rock.w * 0.28, rock.h * 0.55);
    ctx.lineTo(-rock.w * 0.28, rock.h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = "#182938";
    ctx.lineWidth = 3;
    for (let x = -rock.w * 0.32; x <= rock.w * 0.36; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x - 16, -rock.h * 0.36);
      ctx.lineTo(x + 14, rock.h * 0.34);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff1a8";
    ctx.font = "950 13px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("ROCK", 0, -rock.h * 0.72);
    ctx.restore();
  }
}

function drawBubbles() {
  ctx.save();
  for (const bubble of state.bubbles) {
    ctx.globalAlpha = Math.max(0.15, Math.min(0.75, bubble.y / H));
    ctx.strokeStyle = "#c9f6ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGoldenBubbles() {
  ctx.save();
  for (const bubble of state.goldenBubbles) {
    if (bubble.triggered) continue;
    const y = yForDepth(bubble.depth);
    if (y < hookTop - 80 || y > H - 130) continue;
    const pulse = 1 + Math.sin(state.time * 4.2 + bubble.phase) * 0.08;
    const r = bubble.r * pulse;

    ctx.globalAlpha = 0.85;
    const glow = ctx.createRadialGradient(bubble.x, y, r * 0.15, bubble.x, y, r * 2.0);
    glow.addColorStop(0, "rgba(255, 246, 170, 0.92)");
    glow.addColorStop(0.45, "rgba(255, 211, 106, 0.42)");
    glow.addColorStop(1, "rgba(255, 211, 106, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bubble.x, y, r * 2.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.96;
    ctx.fillStyle = "rgba(255, 217, 88, 0.28)";
    ctx.strokeStyle = "#fff0a8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bubble.x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.beginPath();
    ctx.arc(bubble.x - r * 0.28, y - r * 0.34, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHook() {
  const shake = state.hookShakeTimer > 0
    ? Math.sin(state.time * 105) * 18 * Math.min(1, state.hookShakeTimer / pullShakeDuration)
    : 0;
  const x = W / 2 + shake;
  const y = state.hookY;
  ctx.save();

  if (state.status === "pulling") {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffd36a";
    ctx.beginPath();
    ctx.arc(x, hookDiveY, hookCatchRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = "#ffd36a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, hookDiveY, hookCatchRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = "#b9934b";
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, 72);
  ctx.lineTo(x, y - 42);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 231, 154, 0.8)";
  ctx.lineWidth = 3;
  for (let cy = 98; cy < y - 44; cy += 24) {
    ctx.beginPath();
    ctx.ellipse(x, cy, 9, 15, 0.25, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.translate(x, y);
  ctx.strokeStyle = "#b77929";
  ctx.lineWidth = 15;
  ctx.beginPath();
  ctx.moveTo(0, -45);
  ctx.quadraticCurveTo(-38, 12, -12, 58);
  ctx.quadraticCurveTo(12, 92, 52, 48);
  ctx.stroke();

  ctx.strokeStyle = "#5e421f";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(29, 58);
  ctx.lineTo(58, 49);
  ctx.stroke();

  ctx.fillStyle = "#e3468d";
  ctx.strokeStyle = "#ffe49c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.rect(-11, -8, 22, 22);
  ctx.rotate(0.76);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFakePlayers() {
  if (!state.fakePlayersEnabled) return;
  for (const player of state.fakePlayers) {
    const y = yForDepth(player.depth);
    if (y < hookTop - 110 || y > H - 190) continue;
    const x = player.lane + Math.sin(state.time * 1.8 + player.phase) * 18;
    const hookScale = 0.48;

    ctx.save();
    ctx.globalAlpha = player.opacity;
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, y - 18);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = player.color;
    ctx.font = "900 16px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(player.name, x, Math.max(36, y - 52));

    ctx.translate(x, y);
    ctx.scale(hookScale, hookScale);
    ctx.strokeStyle = player.color;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, -38);
    ctx.quadraticCurveTo(-30, 8, -10, 48);
    ctx.quadraticCurveTo(10, 72, 43, 38);
    ctx.stroke();
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(0, -40, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFish(fish) {
  if (fish.escaped) return;
  const fishY = fish.hooked ? fish.y : yForDepth(fish.depth) + Math.sin(fish.phase) * 9;
  if (fish.isBoss) {
    if (!fish.hooked && (fishY < hookTop - fish.size || fishY > H - 160)) return;
    drawBossCatch(fish, fishY);
    return;
  }
  if (!fish.hooked && (fishY < hookTop - 90 || fishY > H - 230)) return;
  if (fish.isSpecial) {
    drawSpecialCatch(fish, fishY);
    return;
  }

  const struggle = fish.hooked ? Math.sin(state.time * 24) * 13 : 0;
  const roll = fish.hooked ? Math.sin(state.time * 18) * 0.18 : 0;
  const rarity = fish.rarity || 1;
  const glow = rarity >= 3 ? 0.22 + rarity * 0.06 : 0;
  const isDoubled = (fish.valueMultiplier || 1) > 1;

  ctx.save();
  ctx.translate(fish.x + struggle, fishY);
  ctx.rotate(roll);
  ctx.scale(fish.dir, 1);

  if (glow) {
    ctx.save();
    ctx.globalAlpha = glow;
    ctx.fillStyle = fish.accent;
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.size * 1.55, fish.size * 0.98, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = fish.color;
  ctx.strokeStyle = "rgba(5, 16, 25, 0.45)";
  ctx.lineWidth = 2 + Math.min(3, rarity);
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.size, fish.size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (isDoubled) {
    ctx.save();
    ctx.globalAlpha = 0.56;
    ctx.fillStyle = "#ffd36a";
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.size * 1.04, fish.size * 0.58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = rarity >= 4 ? fish.accent : fish.color;
  ctx.beginPath();
  ctx.moveTo(-fish.size * 0.85, 0);
  ctx.lineTo(-fish.size * (1.35 + rarity * 0.08), -fish.size * (0.34 + rarity * 0.04));
  ctx.lineTo(-fish.size * (1.28 + rarity * 0.07), fish.size * (0.36 + rarity * 0.04));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (rarity >= 3) {
    ctx.fillStyle = fish.accent;
    ctx.strokeStyle = "rgba(5, 16, 25, 0.35)";
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-fish.size * 0.1 + i * fish.size * 0.28, -fish.size * 0.36);
      ctx.lineTo(fish.size * 0.08 + i * fish.size * 0.2, -fish.size * (0.82 + rarity * 0.06));
      ctx.lineTo(fish.size * 0.18 + i * fish.size * 0.2, -fish.size * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.fillStyle = "#fff7d8";
  ctx.beginPath();
  ctx.arc(fish.size * 0.42, -fish.size * 0.12, fish.size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(fish.size * 0.46, -fish.size * 0.12, fish.size * 0.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.26)";
  for (let i = -1; i <= rarity; i += 1) {
    ctx.beginPath();
    ctx.ellipse(-fish.size * 0.23 + i * 11, 4, 4 + rarity * 0.6, 9 + rarity, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  if (rarity >= 2) {
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.75;
    for (let i = 0; i < rarity; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-fish.size * 0.45 + i * 16, -fish.size * 0.34);
      ctx.quadraticCurveTo(-fish.size * 0.32 + i * 16, 0, -fish.size * 0.46 + i * 16, fish.size * 0.35);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  if (rarity >= 4) {
    ctx.fillStyle = "#ffe56d";
    ctx.strokeStyle = "#6d3b13";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fish.size * 0.08, -fish.size * 0.56);
    ctx.lineTo(fish.size * 0.24, -fish.size * 0.88);
    ctx.lineTo(fish.size * 0.38, -fish.size * 0.56);
    ctx.lineTo(fish.size * 0.54, -fish.size * 0.84);
    ctx.lineTo(fish.size * 0.58, -fish.size * 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  if (!fish.hooked) {
    ctx.scale(fish.dir, 1);
    ctx.fillStyle = rarity >= 4 ? "#ffe56d" : rarity >= 3 ? "#ffef9a" : "#fff6d2";
    ctx.font = `900 ${14 + Math.min(6, rarity * 2)}px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.fillText(fishValue(fish), 0, -fish.size - 10);
  } else if (isDoubled) {
    ctx.scale(fish.dir, 1);
    drawDoubleBadge(0, -fish.size - 18, fish.valueMultiplier || 2);
  }
  ctx.restore();
}

function drawSpecialCatch(fish, fishY) {
  const struggle = fish.hooked ? Math.sin(state.time * 24) * 13 : Math.sin(state.time * 2 + fish.phase) * 8;
  const bob = Math.sin(state.time * 3 + fish.phase) * 6;
  const pulse = 1 + Math.sin(state.time * 4 + fish.phase) * 0.05;
  const isDoubled = (fish.valueMultiplier || 1) > 1;

  ctx.save();
  ctx.translate(fish.x + struggle, fishY + bob);
  ctx.scale(fish.dir * pulse, pulse);

  drawSpecialGlow(fish);

  if (fish.shape === "jelly") drawCrystalJelly(fish);
  if (fish.shape === "crab") drawTreasureCrab(fish);
  if (fish.shape === "ray") drawGhostRay(fish);
  if (fish.shape === "tuna") drawCrownedTuna(fish);
  if (fish.shape === "whale") drawAbyssWhale(fish);

  if (isDoubled) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "#ffd36a";
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.size * 1.32, fish.size * 0.82, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSpecialLabel(fish);
  if (fish.hooked && isDoubled) {
    ctx.scale(fish.dir, 1);
    drawDoubleBadge(0, -fish.size - 58, fish.valueMultiplier || 2);
  }
  ctx.restore();
}

function drawBossCatch(fish, fishY) {
  if (fish.bossType === "octopus") {
    drawOctopusBoss(fish, fishY);
    return;
  }
  if (fish.bossType === "mystery") {
    drawMysteryBoss(fish, fishY);
    return;
  }

  const struggle = fish.hooked ? Math.sin(state.time * 28) * 24 : Math.sin(state.time * 2 + fish.phase) * 16;
  const bob = Math.sin(state.time * 3 + fish.phase) * 10;
  const pulse = 1 + Math.sin(state.time * 5 + fish.phase) * 0.06;
  const isDoubled = (fish.valueMultiplier || 1) > 1;

  ctx.save();
  ctx.translate(fish.x + struggle, fishY + bob);
  ctx.scale(fish.dir * pulse, pulse);

  const glow = 0.58 + Math.sin(state.time * 6) * 0.14;
  ctx.save();
  ctx.globalAlpha = glow;
  ctx.fillStyle = "#ff314f";
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.size * 2.05, fish.size * 1.02, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = "#ff6b7b";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.size * 1.45, fish.size * 0.66, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = fish.color;
  ctx.strokeStyle = "#4c0610";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.size * 1.28, fish.size * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#7d0718";
  ctx.beginPath();
  ctx.moveTo(-fish.size * 1.08, 0);
  ctx.lineTo(-fish.size * 1.95, -fish.size * 0.52);
  ctx.lineTo(-fish.size * 1.78, fish.size * 0.58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = fish.accent;
  ctx.strokeStyle = "#4c0610";
  ctx.lineWidth = 4;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-fish.size * 0.46 + i * fish.size * 0.24, -fish.size * 0.35);
    ctx.lineTo(-fish.size * 0.22 + i * fish.size * 0.22, -fish.size * 0.9);
    ctx.lineTo(-fish.size * 0.08 + i * fish.size * 0.2, -fish.size * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = "#fff6d8";
  ctx.beginPath();
  ctx.ellipse(fish.size * 0.55, -fish.size * 0.12, fish.size * 0.16, fish.size * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#13040a";
  ctx.beginPath();
  ctx.arc(fish.size * 0.6, -fish.size * 0.12, fish.size * 0.08, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff3d1";
  for (let i = 0; i < 7; i += 1) {
    ctx.beginPath();
    ctx.moveTo(fish.size * (0.52 + i * 0.09), fish.size * 0.13);
    ctx.lineTo(fish.size * (0.57 + i * 0.09), fish.size * 0.34);
    ctx.lineTo(fish.size * (0.63 + i * 0.09), fish.size * 0.13);
    ctx.closePath();
    ctx.fill();
  }

  if (isDoubled) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#ffd36a";
    ctx.beginPath();
    ctx.ellipse(0, 0, fish.size * 1.24, fish.size * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.scale(fish.dir, 1);
  ctx.textAlign = "center";
  ctx.fillStyle = "#ff6b7b";
  ctx.font = "950 28px Trebuchet MS";
  ctx.fillText("BOSS", 0, -fish.size * 0.78);
  ctx.fillStyle = "#fff2c7";
  ctx.font = "950 38px Trebuchet MS";
  ctx.fillText(fishValue(fish), 0, -fish.size * 0.56);
  if (fish.hooked && isDoubled) {
    drawDoubleBadge(0, -fish.size * 0.92, fish.valueMultiplier || 2);
  }

  ctx.restore();
}

function drawOctopusBoss(fish, fishY) {
  const wiggle = fish.hooked ? Math.sin(state.time * 24) * 20 : Math.sin(state.time * 2 + fish.phase) * 14;
  const pulse = 1 + Math.sin(state.time * 5 + fish.phase) * 0.055;
  ctx.save();
  ctx.translate(fish.x + wiggle, fishY + Math.sin(state.time * 3) * 8);
  ctx.scale(pulse, pulse);

  ctx.save();
  ctx.globalAlpha = 0.58;
  ctx.fillStyle = "#b86cff";
  ctx.beginPath();
  ctx.ellipse(0, 10, fish.size * 1.35, fish.size * 1.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#3a146e";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * fish.size * 0.16, fish.size * 0.28);
    ctx.quadraticCurveTo(i * fish.size * 0.22 + Math.sin(state.time * 4 + i) * 30, fish.size * 0.85, i * fish.size * 0.46, fish.size * 1.16);
    ctx.stroke();
  }

  ctx.fillStyle = fish.color;
  ctx.strokeStyle = "#261044";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(0, -fish.size * 0.12, fish.size * 0.74, fish.size * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff6da";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * fish.size * 0.26, -fish.size * 0.22, fish.size * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#14051f";
    ctx.beginPath();
    ctx.arc(side * fish.size * 0.28, -fish.size * 0.2, fish.size * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff6da";
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#e6b3ff";
  ctx.font = "950 28px Trebuchet MS";
  ctx.fillText("COLLECTOR", 0, -fish.size * 0.86);
  ctx.fillStyle = "#fff2c7";
  ctx.font = "950 34px Trebuchet MS";
  ctx.fillText(fishValue(fish), 0, -fish.size * 0.64);
  if (fish.collectorCount) {
    ctx.fillStyle = "#d9ffff";
    ctx.font = "900 20px Trebuchet MS";
    ctx.fillText(`GRABBED ${fish.collectorCount}`, 0, -fish.size * 0.48);
  }
  ctx.restore();
}

function drawMysteryBoss(fish, fishY) {
  const wobble = fish.hooked ? Math.sin(state.time * 22) * 18 : Math.sin(state.time * 2 + fish.phase) * 12;
  const pulse = 1 + Math.sin(state.time * 6 + fish.phase) * 0.06;
  ctx.save();
  ctx.translate(fish.x + wobble, fishY + Math.sin(state.time * 3) * 8);
  ctx.scale(pulse, pulse);

  ctx.save();
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = "#ffd36a";
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.size * 1.35, fish.size * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#d89b22";
  ctx.strokeStyle = "#5e3308";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(0, fish.size * 0.08, fish.size * 0.92, fish.size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, -fish.size * 0.18, fish.size * 0.98, fish.size * 0.46, 0, Math.PI, 0);
  ctx.quadraticCurveTo(fish.size * 0.55, fish.size * 0.1, 0, fish.size * 0.16);
  ctx.quadraticCurveTo(-fish.size * 0.55, fish.size * 0.1, -fish.size * 0.98, -fish.size * 0.18);
  ctx.closePath();
  ctx.fillStyle = "#f7c65b";
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff6da";
  ctx.strokeStyle = "#fff1a8";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -fish.size * 0.02, fish.size * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff1a8";
  ctx.font = "950 28px Trebuchet MS";
  ctx.fillText("PEARL CLAM", 0, -fish.size * 0.78);
  ctx.fillStyle = "#fff6da";
  ctx.font = "950 34px Trebuchet MS";
  ctx.fillText(fish.mysteryOpened ? `${Math.round(fish.mysteryMult)}X` : "TAP TO OPEN", 0, -fish.size * 0.58);
  ctx.restore();
}

function drawDoubleBadge(x, y, multiplier) {
  ctx.save();
  ctx.translate(x, y);
  const scale = 1 + Math.sin(state.time * 12) * 0.08;
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 211, 106, 0.95)";
  ctx.strokeStyle = "#5a310e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-34, -18, 68, 36, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3b230a";
  ctx.font = "950 22px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`x${Math.round(multiplier)}`, 0, 1);
  ctx.restore();
}

function drawSpecialGlow(fish) {
  ctx.save();
  ctx.globalAlpha = fish.shape === "whale" ? 0.34 : 0.42;
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.size * 1.35, fish.size * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSpecialLabel(fish) {
  ctx.save();
  ctx.scale(fish.dir, 1);
  ctx.textAlign = "center";
  ctx.fillStyle = fish.tag === "LEGENDARY" ? "#ffef7a" : fish.tag === "EPIC" ? "#ffb7ff" : "#9ffff4";
  ctx.font = "900 15px Trebuchet MS";
  ctx.fillText(fish.tag, 0, -fish.size - 34);
  ctx.font = "950 22px Trebuchet MS";
  ctx.fillText(fishValue(fish), 0, -fish.size - 12);
  ctx.restore();
}

function drawCrystalJelly(fish) {
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = fish.color;
  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, -8, fish.size * 0.72, fish.size * 0.48, 0, Math.PI, 0);
  ctx.quadraticCurveTo(fish.size * 0.54, fish.size * 0.24, 0, fish.size * 0.28);
  ctx.quadraticCurveTo(-fish.size * 0.54, fish.size * 0.24, -fish.size * 0.72, -8);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = 3;
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 10, fish.size * 0.18);
    ctx.quadraticCurveTo(i * 13 + Math.sin(state.time * 4 + i) * 9, fish.size * 0.68, i * 6, fish.size * 1.02);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTreasureCrab(fish) {
  ctx.save();
  ctx.fillStyle = fish.color;
  ctx.strokeStyle = "#4f1d18";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 8, fish.size * 0.72, fish.size * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#8b4a2a";
  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-fish.size * 0.38, -fish.size * 0.34, fish.size * 0.76, fish.size * 0.46, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = fish.accent;
  ctx.fillRect(-fish.size * 0.08, -fish.size * 0.34, fish.size * 0.16, fish.size * 0.46);

  ctx.strokeStyle = fish.color;
  ctx.lineWidth = 7;
  for (let side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(side * fish.size * 0.34, fish.size * (0.05 + i * 0.14));
      ctx.lineTo(side * fish.size * (0.75 + i * 0.08), fish.size * (0.18 + i * 0.16));
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(side * fish.size * 0.78, -fish.size * 0.08, fish.size * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGhostRay(fish) {
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = fish.color;
  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(fish.size * 0.9, 0);
  ctx.quadraticCurveTo(0, -fish.size * 0.72, -fish.size * 1.15, 0);
  ctx.quadraticCurveTo(0, fish.size * 0.48, fish.size * 0.9, 0);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.beginPath();
  ctx.moveTo(-fish.size * 0.5, 4);
  ctx.quadraticCurveTo(0, fish.size * 0.15, fish.size * 0.5, 4);
  ctx.stroke();
  ctx.restore();
}

function drawCrownedTuna(fish) {
  ctx.save();
  ctx.fillStyle = fish.color;
  ctx.strokeStyle = "#6d3b13";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.size * 0.86, fish.size * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.moveTo(-fish.size * 0.74, 0);
  ctx.lineTo(-fish.size * 1.22, -fish.size * 0.36);
  ctx.lineTo(-fish.size * 1.1, fish.size * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#fff06e";
  ctx.beginPath();
  ctx.moveTo(fish.size * 0.1, -fish.size * 0.42);
  ctx.lineTo(fish.size * 0.25, -fish.size * 0.78);
  ctx.lineTo(fish.size * 0.42, -fish.size * 0.42);
  ctx.lineTo(fish.size * 0.58, -fish.size * 0.72);
  ctx.lineTo(fish.size * 0.62, -fish.size * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawAbyssWhale(fish) {
  ctx.save();
  ctx.fillStyle = fish.color;
  ctx.strokeStyle = "rgba(111, 248, 255, 0.36)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, fish.size * 1.28, fish.size * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0c1220";
  ctx.beginPath();
  ctx.moveTo(-fish.size * 1.05, 0);
  ctx.lineTo(-fish.size * 1.75, -fish.size * 0.38);
  ctx.lineTo(-fish.size * 1.6, fish.size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.arc(fish.size * 0.62, -fish.size * 0.12, fish.size * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRoulette() {
  const roulette = state.roulette;
  if (!roulette) return;

  const progress = Math.min(1, roulette.timer / roulette.duration);
  const easeOut = 1 - Math.pow(1 - progress, 3);
  const pointerAngle = roulette.startAngle + roulette.spins * Math.PI * 2 * easeOut
    + (roulette.finalPointerAngle - roulette.startAngle) * easeOut;
  const cx = W / 2;
  const cy = 330;
  const radius = 92;

  ctx.save();
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = "rgba(8, 18, 31, 0.82)";
  ctx.beginPath();
  ctx.roundRect(cx - 158, cy - 136, 316, 310, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 211, 106, 0.65)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff6da";
  ctx.font = "900 24px Trebuchet MS";
  ctx.fillText(roulette.mode === "golden" ? "GOLDEN BUBBLE" : "STRUGGLE CHECK", cx, cy - 100);
  ctx.font = "800 16px Trebuchet MS";
  ctx.fillStyle = "#a9d8eb";
  ctx.fillText(
    roulette.mode === "golden"
      ? "Safe 50% / Double 50%"
      : `Check ${roulette.checkIndex}/${roulette.checkTotal} - Escape ${Math.round(roulette.escapeChance * 100)}% / Double ${Math.round(roulette.doubleChance * 100)}%`,
    cx,
    cy - 76
  );

  ctx.translate(cx, cy + 10);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#2aa866";
  ctx.fill();

  const doubleStart = roulette.mode === "golden" ? 0 : roulette.doubleStart;
  const doubleEnd = roulette.mode === "golden" ? Math.PI : roulette.doubleEnd;

  if (roulette.mode !== "golden") {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, roulette.escapeStart, roulette.escapeEnd);
    ctx.closePath();
    ctx.fillStyle = "#cf344a";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, doubleStart, doubleEnd);
  ctx.closePath();
  ctx.fillStyle = "#f4c542";
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.rotate(pointerAngle);
  ctx.fillStyle = "#ffd36a";
  ctx.beginPath();
  ctx.moveTo(radius + 22, 0);
  ctx.lineTo(radius - 12, -13);
  ctx.lineTo(radius - 12, 13);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#4b2a14";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#fff6da";
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();

  if (roulette.mode === "golden") {
    drawRouletteLegendItem(-45, radius + 35, "#f4c542", "DOUBLE");
    drawRouletteLegendItem(45, radius + 35, "#2aa866", "SAFE");
  } else {
    drawRouletteLegendItem(-82, radius + 35, "#cf344a", "ESCAPE");
    drawRouletteLegendItem(0, radius + 35, "#f4c542", "DOUBLE");
    drawRouletteLegendItem(82, radius + 35, "#2aa866", "SAFE");
  }

  if (progress >= 1) {
    const visibleOutcome = roulette.mode === "golden"
      ? roulette.outcome
      : outcomeForRouletteAngle(roulette.finalPointerAngle, {
        escape: { start: roulette.escapeStart, end: roulette.escapeEnd },
        double: { start: roulette.doubleStart, end: roulette.doubleEnd },
      });
    ctx.fillStyle = visibleOutcome === "ESCAPE" ? "#ff5966" : visibleOutcome === "DOUBLE" ? "#ffd36a" : "#78e6a3";
    ctx.font = "950 30px Trebuchet MS";
    ctx.fillText(visibleOutcome, 0, radius + 78);
  }

  ctx.restore();
}

function drawBossRoulette(roulette) {
  const progress = Math.min(1, roulette.timer / roulette.duration);
  const easeOut = 1 - Math.pow(1 - progress, 3);
  const pointerAngle = roulette.startAngle + roulette.spins * Math.PI * 2 * easeOut
    + (roulette.finalPointerAngle - roulette.startAngle) * easeOut;
  const cx = W / 2;
  const cy = 330;
  const radius = 108;
  const pulse = 0.5 + Math.sin(state.time * 8) * 0.18;
  const isCrimson = state.caughtFish?.bossType === "crimson";
  const safeLabel = isCrimson ? "DOUBLE" : "SAFE";

  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "rgba(31, 3, 12, 0.9)";
  ctx.beginPath();
  ctx.roundRect(cx - 176, cy - 154, 352, 336, 18);
  ctx.fill();
  ctx.strokeStyle = `rgba(255, 49, 79, ${0.72 + pulse})`;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#fff1d1";
  ctx.font = "950 29px Trebuchet MS";
  ctx.fillText("BOSS GAMBLE", cx, cy - 116);
  ctx.font = "900 17px Trebuchet MS";
  ctx.fillStyle = "#ff9aa7";
  ctx.fillText(`Round ${roulette.checkIndex}/${roulette.checkTotal} - ${safeLabel} or ESCAPE`, cx, cy - 88);

  ctx.translate(cx, cy + 14);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#cf344a";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = "#f4c542";
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 246, 218, 0.64)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-radius, 0);
  ctx.lineTo(radius, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#fff4f4";
  ctx.font = "950 25px Trebuchet MS";
  ctx.fillText("ESCAPE", 0, -42);
  ctx.fillStyle = "#3b230a";
  ctx.fillText(safeLabel, 0, 56);

  ctx.save();
  ctx.rotate(pointerAngle);
  ctx.fillStyle = "#fff2c7";
  ctx.beginPath();
  ctx.moveTo(radius + 26, 0);
  ctx.lineTo(radius - 14, -16);
  ctx.lineTo(radius - 14, 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#5b1119";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "#fff6da";
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  drawRouletteLegendItem(-58, radius + 38, "#cf344a", "ESCAPE");
  drawRouletteLegendItem(58, radius + 38, "#f4c542", safeLabel);

  if (progress >= 1) {
    const visibleOutcome = bossOutcomeForAngle(roulette.finalPointerAngle);
    ctx.fillStyle = visibleOutcome === "ESCAPE" ? "#ff5966" : "#ffd36a";
    ctx.font = "950 34px Trebuchet MS";
    ctx.fillText(visibleOutcome === "DOUBLE" ? safeLabel : visibleOutcome, 0, radius + 82);
  }

  ctx.restore();
}

function drawRouletteLegendItem(x, y, color, label) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-34, -12, 68, 24, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color === "#f4c542" ? "#3b230a" : "#fff6da";
  ctx.font = "900 11px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, 1);
  ctx.restore();
}

function updateBossOmenOverlay(dt) {
  if (!bossOmenOverlay) return;

  if (!state.bossOmen || state.status !== "diving" || state.depth >= 82) {
    bossOmenOverlay.classList.add("hidden");
    bossOmenOverlay.classList.remove("is-alert", "is-glow");
    return;
  }

  if (!state.bossOmenTriggered && state.depth >= state.bossOmen.activeFrom) {
    state.bossOmenTriggered = true;
    state.bossOmenTimer = 2.5;
  }

  if (!state.bossOmenTriggered) {
    bossOmenOverlay.classList.add("hidden");
    return;
  }

  state.bossOmenTimer = Math.max(0, state.bossOmenTimer - dt);
  const isAlert = state.bossOmenTimer > 0;
  bossOmenOverlay.classList.toggle("hidden", false);
  bossOmenOverlay.classList.toggle("is-alert", isAlert);
  bossOmenOverlay.classList.toggle("is-glow", !isAlert);

  if (bossOmenTitle && state.bossOmen) {
    bossOmenTitle.textContent = state.bossOmen.text;
    bossOmenOverlay.style.setProperty("--boss-omen-color", state.bossOmen.color);
  }
}

function drawShark() {
  if (!state.shark) return;
  const s = state.shark;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.fillStyle = "#7f929c";
  ctx.strokeStyle = "#1a2730";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 145, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#5b6c76";
  ctx.beginPath();
  ctx.moveTo(98, -4);
  ctx.lineTo(180, -54);
  ctx.lineTo(168, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-28, -34);
  ctx.lineTo(-58, -104);
  ctx.lineTo(10, -35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e7f4f3";
  ctx.beginPath();
  ctx.ellipse(-83, 2, 55, 28, 0, 0, Math.PI);
  ctx.fill();

  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(-102, -17, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-140 + i * 10, 12);
    ctx.lineTo(-135 + i * 10, 28);
    ctx.lineTo(-130 + i * 10, 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFakeEvents() {
  if (!state.fakePlayersEnabled || state.fakeEvents.length === 0) return;
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  state.fakeEvents.forEach((event, index) => {
    const progress = event.timer / event.duration;
    const alpha = Math.max(0, Math.min(1, 1 - progress));
    const y = 166 + index * 36 - progress * 8;
    const x = 22;
    ctx.globalAlpha = alpha * 0.86;
    ctx.fillStyle = "rgba(5, 17, 27, 0.72)";
    ctx.beginPath();
    ctx.roundRect(x, y - 16, 286, 30, 8);
    ctx.fill();
    ctx.strokeStyle = event.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = event.color;
    ctx.font = "900 13px Trebuchet MS";
    ctx.fillText(event.text, x + 10, y);
  });

  ctx.restore();
}

function render() {
  drawBackground();
  drawGoldenBubbles();
  for (const fish of state.fish) drawFish(fish);
  drawFakePlayers();
  drawPullRocks();
  drawHook();
  drawShark();
  drawEffects();
  drawFakeEvents();
  drawDepthShade(Math.min(1, state.depth / maxDepth));
  drawRoulette();
  if (state.bossWheel) drawBossRoulette(state.bossWheel);

  if (state.status === "ready") {
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255, 246, 218, 0.88)";
    ctx.font = "900 34px Trebuchet MS";
    ctx.fillText("HOLD GO DEEP", W / 2, 250);
    ctx.font = "700 20px Trebuchet MS";
    ctx.fillText("Each layer costs 1 bet. Pull up before the strike.", W / 2, 284);
    ctx.restore();
  }
}

function frame(now) {
  if (!state.previousNow) state.previousNow = now;
  const dt = Math.min(0.04, (now - state.previousNow) / 1000);
  state.previousNow = now;
  state.time += dt;

  sinkStep(dt);
  updatePullShuffle(dt);
  updateRoulette(dt);
  updateGoldenBubbles(dt);
  updatePull(dt);
  updateShark(dt);
  updateFish(dt);
  updateFakePlayers(dt);
  updateEffects(dt);
  addBubbles(dt);
  updateHud();
  updateBossOmenOverlay(dt);
  updateMusic();
  render();
  requestAnimationFrame(frame);
}

function changeBet(delta) {
  if (state.status === "diving" || state.status === "shuffle" || state.status === "pulling" || state.status === "cut") return;
  state.betIndex = Math.max(0, Math.min(betSteps.length - 1, state.betIndex + delta));
  deepButton.disabled = state.balance < bet();
  updateHud();
}

deepButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  deepButton.setPointerCapture(event.pointerId);
  beginDive();
});

deepButton.addEventListener("pointerup", (event) => {
  event.preventDefault();
  stopDive();
});

deepButton.addEventListener("pointercancel", stopDive);
deepButton.addEventListener("lostpointercapture", () => {
  if (state.isHolding) stopDive();
});
window.addEventListener("pointerup", () => {
  if (state.isHolding) stopDive();
});
window.addEventListener("mouseup", () => {
  if (state.isHolding) stopDive();
});
window.addEventListener("touchend", () => {
  if (state.isHolding) stopDive();
});
window.addEventListener("blur", () => {
  if (state.isHolding) stopDive();
});

if (balancePanel) {
  balancePanel.addEventListener("click", refillBalanceForDev);
}
pullButton.addEventListener("click", startPull);
betDownButton.addEventListener("click", () => changeBet(-1));
betUpButton.addEventListener("click", () => changeBet(1));
newRoundButton.addEventListener("click", () => {
  if (!openMysteryClam()) resetRound();
});
if (sharkToggle) {
  sharkToggle.addEventListener("change", () => {
    state.sharksEnabled = sharkToggle.checked;
  });
}
if (fakePlayersToggle) {
  fakePlayersToggle.addEventListener("change", () => {
    state.fakePlayersEnabled = fakePlayersToggle.checked;
    if (!state.fakePlayersEnabled) state.fakeEvents = [];
  });
}
if (devToggleButton && devControls) {
  devToggleButton.addEventListener("click", () => {
    devControls.classList.toggle("hidden");
  });
}
if (crimsonChanceSlider) {
  crimsonChanceSlider.addEventListener("input", updateBossChanceText);
}
if (octopusChanceSlider) {
  octopusChanceSlider.addEventListener("input", updateBossChanceText);
}
if (mysteryChanceSlider) {
  mysteryChanceSlider.addEventListener("input", updateBossChanceText);
}

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => event.preventDefault());
document.addEventListener("gesturestart", (event) => event.preventDefault());

updateBossChanceText();
resetRound();
requestAnimationFrame(frame);
