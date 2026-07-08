const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

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
const newRoundButton = document.getElementById("newRoundButton");
const deepButton = document.getElementById("deepButton");
const pullButton = document.getElementById("pullButton");
const betDownButton = document.getElementById("betDownButton");
const betUpButton = document.getElementById("betUpButton");

const W = canvas.width;
const H = canvas.height;
const maxDepth = 100;
const hookTop = 165;
const hookDiveY = 520;
const layerHeight = 145;
const betSteps = [10, 20, 50, 100, 200, 500, 1000];
const TAU = Math.PI * 2;
const doubleChance = 0.12;
let audioCtx = null;
let music = null;

const state = {
  balance: 10000,
  betIndex: 3,
  depth: 0,
  spent: 0,
  status: "ready",
  isHolding: false,
  lastTickDepth: 0,
  hookY: hookDiveY,
  messageTimer: 0,
  bubbles: [],
  effects: [],
  fish: [],
  shark: null,
  caughtFish: null,
  bestCandidate: null,
  pullProgress: 0,
  roulette: null,
  struggleChecks: [],
  result: null,
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
  { name: "Crystal Jelly", mult: 80, minDepth: 15, weight: 40, shape: "jelly", catchRate: 0.28, holdRate: 0.46, color: "#8ff6ff", accent: "#d9ffff", size: 58, rarity: 4, tag: "RARE" },
  { name: "Treasure Crab", mult: 120, minDepth: 25, weight: 28, shape: "crab", catchRate: 0.24, holdRate: 0.4, color: "#e66b42", accent: "#ffd36a", size: 60, rarity: 4, tag: "RARE" },
  { name: "Ghost Ray", mult: 250, minDepth: 40, weight: 18, shape: "ray", catchRate: 0.18, holdRate: 0.34, color: "#9ce7ff", accent: "#ffffff", size: 76, rarity: 5, tag: "EPIC" },
  { name: "Crowned Tuna", mult: 400, minDepth: 50, weight: 10, shape: "tuna", catchRate: 0.14, holdRate: 0.28, color: "#f6b84e", accent: "#fff06e", size: 78, rarity: 5, tag: "EPIC" },
  { name: "Abyss Whale", mult: 800, minDepth: 70, weight: 4, shape: "whale", catchRate: 0.08, holdRate: 0.2, color: "#192334", accent: "#6ff8ff", size: 118, rarity: 6, tag: "LEGENDARY" },
];

function money(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function fishValue(fish) {
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
  pad.gain.value = 0.07;
  pulse.gain.value = 0.0001;
  tension.gain.value = 0.0001;

  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.Q.value = 0.8;
  bassFilter.type = "lowpass";
  bassFilter.frequency.value = 180;
  bassFilter.Q.value = 5;

  oscA.type = "sine";
  oscA.frequency.value = 48;
  oscB.type = "triangle";
  oscB.frequency.value = 72;
  pulseOsc.type = "sawtooth";
  pulseOsc.frequency.value = 42;
  lfo.type = "sine";
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.02;
  tensionOsc.type = "sawtooth";
  tensionOsc.frequency.value = 118;

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
  const bassGain = 0.12 + depthRatio * 0.08;
  const bassStart = 92 + depthRatio * 20;
  playTone(bassStart, 0.12, "sawtooth", bassGain, 42 + depthRatio * 16);

  if (music.beatStep % 2 === 1) {
    playTone(240 + depthRatio * 180, 0.055, "square", 0.045 + depthRatio * 0.025, 520 + depthRatio * 240);
  }

  if (depthRatio > 0.45 && music.beatStep % 4 === 3) {
    playNoise(0.08, 0.035 + depthRatio * 0.035);
    playTone(880 + depthRatio * 380, 0.045, "triangle", 0.035 + depthRatio * 0.02);
  }

  music.beatStep += 1;
}

function updateMusic() {
  if (!audioCtx || !music) return;

  const now = audioCtx.currentTime;
  const depthRatio = Math.min(1, state.depth / maxDepth);
  const active = state.status === "diving" || state.status === "pulling" || state.status === "cut";
  const masterTarget = active ? 0.28 + depthRatio * 0.16 : 0.12;
  const pulseTarget = active ? 0.035 + depthRatio * 0.07 : 0.006;
  const tensionTarget = depthRatio > 0.35 ? (depthRatio - 0.35) * 0.085 : 0.0001;

  music.master.gain.setTargetAtTime(masterTarget, now, 0.35);
  music.pulse.gain.setTargetAtTime(pulseTarget, now, 0.25);
  music.tension.gain.setTargetAtTime(tensionTarget, now, 0.35);
  music.filter.frequency.setTargetAtTime(520 + depthRatio * 1300, now, 0.5);
  music.bassFilter.frequency.setTargetAtTime(110 + depthRatio * 180, now, 0.35);
  music.oscA.frequency.setTargetAtTime(44 + depthRatio * 22, now, 0.6);
  music.oscB.frequency.setTargetAtTime(66 + depthRatio * 44, now, 0.6);
  music.pulseOsc.frequency.setTargetAtTime(36 + depthRatio * 42, now, 0.35);
  music.tensionOsc.frequency.setTargetAtTime(120 + depthRatio * 180, now, 0.4);

  if (active && now >= music.nextBeat) {
    playMusicBeat(depthRatio);
    music.nextBeat = now + Math.max(0.24, 0.68 - depthRatio * 0.34);
  }
}

function playTone(freq, duration = 0.08, type = "sine", gain = 0.08, slideTo = null) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const amp = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(amp);
  amp.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playNoise(duration = 0.18, gain = 0.08) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const source = audioCtx.createBufferSource();
  const amp = audioCtx.createGain();
  amp.gain.setValueAtTime(gain, now);
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

function rouletteZones(escapeChance) {
  const escapeArc = TAU * escapeChance;
  const doubleArc = TAU * doubleChance;
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
  if (depth <= 20) return 0.012;
  if (depth <= 50) return 0.025;
  if (depth <= 75) return 0.04;
  return 0.06;
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

function resetRound() {
  state.depth = 0;
  state.spent = 0;
  state.status = "ready";
  state.isHolding = false;
  state.lastTickDepth = 0;
  state.hookY = hookDiveY;
  state.messageTimer = 0;
  state.shark = null;
  state.effects = [];
  state.caughtFish = null;
  state.bestCandidate = null;
  state.pullProgress = 0;
  state.roulette = null;
  state.struggleChecks = [];
  state.result = null;
  state.fish = makeFish();
  resultPanel.classList.add("hidden");
  deepButton.disabled = state.balance < bet();
  pullButton.disabled = true;
  updateHud();
}

function makeFish() {
  const lanes = [125, 245, 365, 485, 595];
  const fish = [];

  for (let depth = 1.2; depth < maxDepth; depth += 3.8 + Math.random() * 3.2) {
    const item = specialForDepth(depth) || catalogForDepth(depth);
    const index = fish.length;
    fish.push({
      ...item,
      isSpecial: Boolean(item.shape),
      x: lanes[index % lanes.length] + Math.random() * 54 - 27,
      depth: Math.min(maxDepth - 0.2, depth + Math.random() * 0.9),
      dir: index % 2 === 0 ? 1 : -1,
      speed: 0.25 + Math.random() * 0.55,
      phase: Math.random() * Math.PI * 2,
      valueMultiplier: 1,
      attempted: false,
      hooked: false,
      escaped: false,
    });
  }

  return fish;
}

function updateHud() {
  const risk = riskForDepth(Math.max(1, state.depth));
  balanceText.textContent = money(state.balance);
  betText.textContent = bet().toLocaleString("en-US");
  depthText.textContent = `${Math.floor(state.depth)}F`;
  riskText.textContent = risk.label;
  riskText.style.color = risk.color;
  costText.textContent = money(state.spent);
  bestFishText.textContent = state.bestCandidate
    ? `${state.bestCandidate.name} ${fishValue(state.bestCandidate)}`
    : "-";
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
    state.isHolding = true;
    deepButton.classList.add("is-held");
    sound.dive();
  }
}

function stopDive() {
  state.isHolding = false;
  deepButton.classList.remove("is-held");
}

function startPull() {
  ensureAudio();
  ensureMusic();
  state.status = "pulling";
  state.isHolding = false;
  state.pullProgress = 0;
  deepButton.disabled = true;
  pullButton.disabled = true;
  sound.pull();
}

function sinkStep(dt) {
  if (!state.isHolding || state.status !== "diving") return;

  const depthGain = dt * 7.1;
  state.depth = Math.min(maxDepth, state.depth + depthGain);
  state.hookY = yForDepth(state.depth);

  while (Math.floor(state.depth) > state.lastTickDepth) {
    state.lastTickDepth += 1;
    state.spent += bet();
    state.balance -= bet();
    sound.tick();

    const risk = riskForDepth(state.lastTickDepth);
    if (Math.random() < risk.rate) {
      triggerShark();
      return;
    }

    if (state.balance < bet() || state.lastTickDepth >= maxDepth) {
      startPull();
      return;
    }
  }
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

function updatePull(dt) {
  if (state.status !== "pulling") return;

  updateRoulette(dt);
  if (state.status !== "pulling") return;
  if (state.roulette) return;

  const pullSpeed = 6.2;
  const previousDepth = state.depth;
  state.depth = Math.max(0, state.depth - pullSpeed * dt);
  state.hookY = yForDepth(state.depth);

  for (const fish of state.fish) {
    if (fish.attempted || fish.depth < state.depth || fish.depth > previousDepth) continue;

    fish.attempted = true;
    const pathDistance = Math.abs(fish.x - W / 2);
    const pathBonus = pathDistance < 95 ? 0.18 : pathDistance < 175 ? 0.05 : -0.08;
    const chance = Math.max(0.04, Math.min(0.9, fish.catchRate + pathBonus));

    if (!state.caughtFish && Math.random() < chance) {
      fish.hooked = true;
      state.caughtFish = fish;
      state.bestCandidate = fish;
      setupStruggleChecks(fish);
      sound.hook();
    }
  }

  if (state.caughtFish) {
    state.caughtFish.x += (W / 2 - state.caughtFish.x) * Math.min(1, dt * 8);
    state.caughtFish.y = hookDiveY + 62;
  }

  if (state.depth <= 0) {
    finishPull();
  }
}

function struggleProfile(fish) {
  if (fish.mult <= 4) return { count: 1, escapeChance: 0.1, progress: [0.6] };
  if (fish.mult <= 6) return { count: 1, escapeChance: 0.13, progress: [0.6] };
  if (fish.mult <= 12) return { count: 2, escapeChance: 0.16, progress: [0.45, 0.75] };
  if (fish.mult <= 19) return { count: 2, escapeChance: 0.2, progress: [0.45, 0.75] };
  if (fish.mult <= 40) return { count: 3, escapeChance: 0.24, progress: [0.3, 0.6, 0.85] };
  if (fish.mult <= 75) return { count: 3, escapeChance: 0.3, progress: [0.3, 0.6, 0.85] };
  return { count: 3, escapeChance: 0.35, progress: [0.3, 0.6, 0.85] };
}

function setupStruggleChecks(fish) {
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
  const check = state.struggleChecks.find((item) => !item.done && state.depth <= item.depth);
  if (!check || state.depth <= 0.2) return;

  check.done = true;
  const zones = rouletteZones(check.escapeChance);
  const landingAngle = pickRouletteLanding(zones);
  const outcome = outcomeForRouletteAngle(landingAngle, zones);

  state.roulette = {
    timer: 0,
    duration: 1.05,
    settleTimer: 0,
    settleDuration: 0.75,
    settled: false,
    outcome,
    escapeChance: check.escapeChance,
    doubleChance,
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

function updateRoulette(dt) {
  maybeStartStruggle();
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
  if (!state.caughtFish) {
    sound.lose();
    showResult("EMPTY HOOK", "No Catch", "The hook came back clean. Payout is $0.", true);
    return;
  }

  const fish = state.caughtFish;
  const payout = bet() * fish.mult * (fish.valueMultiplier || 1);
  state.balance += payout;
  sound.win();
  showResult("CAUGHT", `${fish.name} ${money(payout)}`, `Payout ${money(payout)}. Total dive cost was ${money(state.spent)}.`, true);
}

function showResult(kicker, title, body, canRestart) {
  state.status = "finished";
  state.isHolding = false;
  resultKicker.textContent = kicker;
  resultTitle.textContent = title;
  resultBody.textContent = body;
  resultPanel.classList.remove("hidden");
  deepButton.classList.remove("is-held");
  deepButton.disabled = true;
  pullButton.disabled = true;
  newRoundButton.disabled = !canRestart;
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
  for (const fish of state.fish) {
    if (fish.doubleFlash) fish.doubleFlash = Math.max(0, fish.doubleFlash - dt);
    if (fish.hooked) continue;
    fish.phase += dt * 2.4;
    fish.x += fish.speed * fish.dir * dt * 34;

    if (fish.x < 68) fish.dir = 1;
    if (fish.x > W - 68) fish.dir = -1;
  }
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

function updateEffects(dt) {
  for (const effect of state.effects) {
    effect.timer += dt;
  }
  state.effects = state.effects.filter((effect) => effect.timer < effect.duration);
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

function drawHook() {
  const x = W / 2;
  const y = state.hookY;
  ctx.save();

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

function drawFish(fish) {
  if (fish.escaped) return;
  const fishY = fish.hooked ? fish.y : yForDepth(fish.depth) + Math.sin(fish.phase) * 9;
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
  ctx.fillText("STRUGGLE CHECK", cx, cy - 100);
  ctx.font = "800 16px Trebuchet MS";
  ctx.fillStyle = "#a9d8eb";
  ctx.fillText(`Check ${roulette.checkIndex}/${roulette.checkTotal} - Escape ${Math.round(roulette.escapeChance * 100)}% / Double ${Math.round(roulette.doubleChance * 100)}%`, cx, cy - 76);

  ctx.translate(cx, cy + 10);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#2aa866";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, roulette.escapeStart, roulette.escapeEnd);
  ctx.closePath();
  ctx.fillStyle = "#cf344a";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, roulette.doubleStart, roulette.doubleEnd);
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

  drawRouletteLegendItem(-82, radius + 35, "#cf344a", "ESCAPE");
  drawRouletteLegendItem(0, radius + 35, "#f4c542", "DOUBLE");
  drawRouletteLegendItem(82, radius + 35, "#2aa866", "SAFE");

  if (progress >= 1) {
    const visibleOutcome = outcomeForRouletteAngle(roulette.finalPointerAngle, {
      escape: { start: roulette.escapeStart, end: roulette.escapeEnd },
      double: { start: roulette.doubleStart, end: roulette.doubleEnd },
    });
    ctx.fillStyle = visibleOutcome === "ESCAPE" ? "#ff5966" : visibleOutcome === "DOUBLE" ? "#ffd36a" : "#78e6a3";
    ctx.font = "950 30px Trebuchet MS";
    ctx.fillText(visibleOutcome, 0, radius + 78);
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

function render() {
  drawBackground();
  for (const fish of state.fish) drawFish(fish);
  drawHook();
  drawShark();
  drawEffects();
  drawDepthShade(Math.min(1, state.depth / maxDepth));
  drawRoulette();

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
  updatePull(dt);
  updateShark(dt);
  updateFish(dt);
  updateEffects(dt);
  addBubbles(dt);
  updateHud();
  updateMusic();
  render();
  requestAnimationFrame(frame);
}

function changeBet(delta) {
  if (state.status === "diving" || state.status === "pulling" || state.status === "cut") return;
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

pullButton.addEventListener("click", startPull);
betDownButton.addEventListener("click", () => changeBet(-1));
betUpButton.addEventListener("click", () => changeBet(1));
newRoundButton.addEventListener("click", resetRound);

document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("selectstart", (event) => event.preventDefault());
document.addEventListener("gesturestart", (event) => event.preventDefault());

resetRound();
requestAnimationFrame(frame);
