'use strict';
/* =========================================================
   Кости Судьбы — D&D idle на кубиках
   ========================================================= */

// ---------- Данные ----------
const HEROES = [
  { id: 'fighter',   name: 'Воин',      icon: '⚔️', c: '#c0504a', die: 10, n: 1, int: 1.5, power: 1,     cost: 15,    hit: 3,
    perk: 'Боевая выучка: +3 к попаданию' },
  { id: 'rogue',     name: 'Плут',      icon: '🗡️', c: '#7a8a9a', die: 4,  n: 2, int: 0.9, power: 3,     cost: 120,   hit: 2, critMin: 19, critMul: 3,
    perk: 'Скрытая атака: крит на 19–20, урон ×3' },
  { id: 'ranger',    name: 'Следопыт',  icon: '🏹', c: '#5a9a4a', die: 8,  n: 1, int: 1.2, power: 12,    cost: 900,   hit: 6,
    perk: 'Меткость: +6 к попаданию' },
  { id: 'cleric',    name: 'Жрец',      icon: '☀️', c: '#e0b040', die: 6,  n: 1, int: 2.0, power: 50,    cost: 7000,  hit: 2, goldPct: 2,
    perk: 'Благодать: +2% золота за уровень' },
  { id: 'wizard',    name: 'Волшебник', icon: '🧙', c: '#5a7ae0', die: 12, n: 1, int: 3.0, power: 260,   cost: 6e4,   hit: 0, auto: true,
    perk: 'Огненный шар: всегда попадает' },
  { id: 'paladin',   name: 'Паладин',   icon: '🛡️', c: '#e8d8a0', die: 10, n: 1, int: 2.0, power: 900,   cost: 5e5,   hit: 3, critMul: 4,
    perk: 'Божественная кара: крит ×4' },
  { id: 'bard',      name: 'Бард',      icon: '🪕', c: '#d060a0', die: 6,  n: 1, int: 2.5, power: 3000,  cost: 4e6,   hit: 2, dmgPct: 1,
    perk: 'Вдохновение: +1% урона всем за уровень' },
  { id: 'barbarian', name: 'Варвар',    icon: '🪓', c: '#d07030', die: 12, n: 1, int: 1.4, power: 1.6e4, cost: 3e7,   hit: 2, adv: true,
    perk: 'Безрассудная атака: всегда с преимуществом' },
  { id: 'druid',     name: 'Друид',     icon: '🐻', c: '#3a8a6a', die: 8,  n: 3, int: 2.5, power: 6e4,   cost: 2.5e8, hit: 3,
    perk: 'Дикий облик: бросает 3d8' },
  { id: 'warlock',   name: 'Колдун',    icon: '👁️', c: '#9a4ae0', die: 20, n: 1, int: 2.0, power: 4e5,   cost: 2e9,   hit: 4, critMin: 18,
    perk: 'Мистический заряд: d20 урона, крит на 18–20' },
];
const HERO_GROWTH = 1.07;

const PLAYER_DICE = [
  { n: 1, d: 4,  cost: 0 },   { n: 1, d: 6,  cost: 60 },   { n: 1, d: 8,  cost: 800 },
  { n: 1, d: 10, cost: 9000 }, { n: 1, d: 12, cost: 1e5 }, { n: 1, d: 20, cost: 1.5e6 },
  { n: 2, d: 20, cost: 3e7 },  { n: 3, d: 20, cost: 8e8 }, { n: 4, d: 20, cost: 3e10 },
  { n: 6, d: 20, cost: 1e12 }, { n: 8, d: 20, cost: 5e13 },
];

const BIOMES = [
  { name: 'Подземелье',      color: '#3a6a2a', mobs: [['Крыса', '🐀'], ['Гоблин', '👺'], ['Летучая мышь', '🦇'], ['Паук', '🕷️']], boss: ['Король гоблинов', '👹'] },
  { name: 'Тёмный лес',      color: '#2a6a4a', mobs: [['Волк', '🐺'], ['Кабан', '🐗'], ['Змея', '🐍'], ['Шатун', '🐻']], boss: ['Древний энт', '🌳'] },
  { name: 'Склепы',          color: '#5a4a8a', mobs: [['Скелет', '💀'], ['Зомби', '🧟'], ['Призрак', '👻'], ['Костяная гончая', '🦴']], boss: ['Граф-вампир', '🧛'] },
  { name: 'Огненные пещеры', color: '#9a3a1a', mobs: [['Скорпион', '🦂'], ['Огненный бес', '😈'], ['Тролль', '🧌'], ['Лавовый червь', '🪱']], boss: ['Красный дракон', '🐉'] },
  { name: 'Ледяной пик',     color: '#3a7aa0', mobs: [['Йети', '🦍'], ['Мамонт', '🦣'], ['Снежный дух', '❄️'], ['Ледяной волк', '🐺']], boss: ['Ледяной колосс', '🗿'] },
  { name: 'Бездна',          color: '#7a1a6a', mobs: [['Демон', '👿'], ['Кракен', '🦑'], ['Око бездны', '👁️'], ['Пожиратель', '🦈']], boss: ['Князь демонов', '😈'] },
];
const CYCLE_PREFIX = ['', 'Древний ', 'Проклятый ', 'Легендарный ', 'Божественный '];

const ABILITIES = [
  { id: 'rage',  name: 'Ярость',       icon: '🔥', unlock: 5,  dur: 20, cd: 120, desc: 'Урон всего отряда ×2 на 20 сек' },
  { id: 'adv',   name: 'Преимущество', icon: '🍀', unlock: 10, dur: 30, cd: 180, desc: 'Все броски с преимуществом (2d20, берётся лучший) на 30 сек' },
  { id: 'midas', name: 'Мидас',        icon: '💰', unlock: 15, dur: 30, cd: 300, desc: 'Золото с монстров ×3 на 30 сек' },
];

const KILLS_PER_FLOOR = 10;
const BOSS_TIME = 30;
const SHARD_BONUS = 0.10;
const PRESTIGE_FLOOR = 20;
const OFFLINE_CAP = 8 * 3600;
const SAVE_KEY = 'dice-fate-v1';

// ---------- Состояние ----------
function freshState() {
  return {
    gold: 0, floor: 1, maxFloor: 1, kills: 0, auto: true,
    heroes: Object.fromEntries(HEROES.map(h => [h.id, 0])),
    str: 0, dieTier: 0, acc: 0, tactic: 0,
    abil: {},
    shards: 0, campaigns: 0,
    totalGold: 0, rolls: 0, nat20: 0, nat1: 0, kills_total: 0, bestFloor: 1,
    started: Date.now(), lastSave: Date.now(),
  };
}
let S = freshState();
let M = null;          // текущий монстр
let buyMode = 1;
let tab = 'party';

// ---------- Утилиты ----------
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const d = sides => 1 + Math.floor(Math.random() * sides);
const now = () => Date.now();

const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toString();
  const t = Math.floor(Math.log10(n) / 3);
  if (t >= SUF.length) return n.toExponential(2);
  const v = n / 1000 ** t;
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + SUF[t];
}
function fmtTime(s) {
  s = Math.floor(s);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  if (h) return `${h} ч ${m} мин`;
  if (m) return `${m} мин ${s % 60} с`;
  return `${s % 60} с`;
}
function bulk(base, growth, lvl, k) { return base * growth ** lvl * (growth ** k - 1) / (growth - 1); }
function maxBuy(base, growth, lvl, gold) {
  const k = Math.floor(Math.log(gold * (growth - 1) / (base * growth ** lvl) + 1) / Math.log(growth));
  return Math.max(0, k);
}

// SVG фигуры кубиков
const DIE_SHAPES = {
  4:  '50,6 94,88 6,88',
  6:  '12,12 88,12 88,88 12,88',
  8:  '50,4 94,50 50,96 6,50',
  10: '50,4 94,42 50,96 6,42',
  12: '50,4 94,36 78,92 22,92 6,36',
  20: '50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5',
};
function dieIcon(sides, color = '#e8b84a') {
  return `<svg viewBox="0 0 100 100"><polygon points="${DIE_SHAPES[sides]}" fill="none" stroke="${color}" stroke-width="9" stroke-linejoin="round"/></svg>`;
}
function bigD20(id) {
  return `<svg viewBox="0 0 100 100" class="d20 bigdie" id="${id}">
    <polygon class="d20-outer" points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5"/>
    <polygon class="d20-face" points="50,22 77,68 23,68"/>
    <polyline class="d20-edge" points="50,3 50,22 91,26.5 77,68 91,73.5 50,97 23,68 9,73.5 23,68 9,26.5 50,22"/>
    <line class="d20-edge" x1="77" y1="68" x2="50" y2="97"/><line class="d20-edge" x1="23" y1="68" x2="50" y2="97"/>
    <text x="50" y="58" class="d20-num">?</text></svg>`;
}

// ---------- Формулы ----------
const abilOn = id => (S.abil[id]?.until || 0) > now();
function heroMul(lvl) {
  if (lvl <= 0) return 0;
  return lvl * 2 ** (Math.floor(lvl / 25) + (lvl >= 10 ? 1 : 0));
}
function dmgMul() {
  let m = 1 + S.shards * SHARD_BONUS;
  m *= 1 + S.heroes.bard * 0.01;
  return m;
}
function partyMul() { return dmgMul() * (abilOn('rage') ? 2 : 1); }
function goldMul() {
  let m = 1 + S.shards * SHARD_BONUS;
  m *= 1 + S.heroes.cleric * 0.02;
  if (abilOn('midas')) m *= 3;
  return m;
}
function heroHit(h) { return h.hit + Math.floor(S.heroes[h.id] / 4); }
function heroPower(h) { return h.power * heroMul(S.heroes[h.id]); }
function heroCost(h, k) { return bulk(h.cost, HERO_GROWTH, S.heroes[h.id], k); }

function floorAC(f) { return Math.min(30, 8 + Math.floor(f / 3)); }
function isBossFloor(f) { return f % 5 === 0; }
function floorHP(f) { return Math.ceil(10 * 1.42 ** (f - 1)); }
function floorGold(f) { return Math.ceil(floorHP(f) / 3.5); }

function hitChance(bonus, ac, adv) {
  const need = ac - bonus; // нужно выбросить >= need
  let p = Math.min(0.95, Math.max(0.05, (21 - need) / 20));
  return adv ? 1 - (1 - p) ** 2 : p;
}
function heroDps(h, ac) {
  const lvl = S.heroes[h.id];
  if (!lvl) return 0;
  const adv = h.adv || abilOn('adv');
  const p = h.auto ? 1 : hitChance(heroHit(h), ac, adv);
  let c = (21 - (h.critMin || 20)) / 20;
  if (adv) c = 1 - (1 - c) ** 2;
  if (h.auto) c = 0;
  const avg = h.n * (h.die + 1) / 2 * heroPower(h);
  return p * avg * (1 + c * ((h.critMul || 2) - 1)) / h.int * partyMul();
}
function partyDps(ac = floorAC(S.floor)) { return HEROES.reduce((s, h) => s + heroDps(h, ac), 0); }

function playerDie() { return PLAYER_DICE[S.dieTier]; }
function playerHit() { return 2 + S.acc + Math.floor(S.str / 10); }
function tapPower() { return (1 + S.str) * 2 ** Math.floor(S.str / 25); }
function tapAvg() {
  const pd = playerDie();
  return (pd.n * (pd.d + 1) / 2 * tapPower() + partyDps() * S.tactic * 0.02) * dmgMul();
}
function goldPerSec() {
  const dps = partyDps();
  if (dps <= 0) return 0;
  const hp = floorHP(S.floor) * (isBossFloor(S.floor) ? 8 : 1);
  const killRate = 1 / (hp / dps + 0.35);
  return killRate * floorGold(S.floor) * (isBossFloor(S.floor) ? 6 : 1) * goldMul();
}
function pendingShards() {
  if (S.maxFloor < PRESTIGE_FLOOR) return 0;
  return Math.floor(((S.maxFloor - 10) / 5) ** 1.6);
}

function rollD20(adv) {
  const a = d(20);
  if (!adv) return a;
  return Math.max(a, d(20));
}
function earn(g) { S.gold += g; S.totalGold += g; }

// ---------- Монстры ----------
function spawnMonster(mimic) {
  const f = S.floor;
  const bi = Math.floor((f - 1) / 10);
  const biome = BIOMES[bi % BIOMES.length];
  const prefix = CYCLE_PREFIX[Math.min(Math.floor(bi / BIOMES.length), CYCLE_PREFIX.length - 1)];
  const boss = isBossFloor(f) && !mimic;
  let name, icon;
  if (mimic) { name = 'Мимик'; icon = '🧰'; }
  else if (f % 10 === 0) { [name, icon] = biome.boss; }
  else if (boss) { const m = biome.mobs[Math.floor(Math.random() * biome.mobs.length)]; name = 'Вожак: ' + m[0]; icon = m[1]; }
  else { const m = biome.mobs[Math.floor(Math.random() * biome.mobs.length)]; name = m[0]; icon = m[1]; }
  const hp = floorHP(f) * (boss ? 8 : 1) * (mimic ? 3 : 1);
  M = {
    name: prefix + name, icon, boss, mimic: !!mimic,
    hp, maxHp: hp, ac: floorAC(f) + (boss ? 2 : 0),
    gold: floorGold(f) * (boss ? 6 : 1) * (mimic ? 25 : 1),
    bossEnd: boss ? now() + BOSS_TIME * 1000 : 0,
    spawnAt: now(),
    dead: false,
  };
  document.documentElement.style.setProperty('--biome', biome.color);
  el.biome.textContent = biome.name;
  el.monster.textContent = icon;
  el.monster.className = 'monster spawn' + (boss ? ' boss' : '');
  el.mName.textContent = M.name;
  el.mName.parentElement.classList.toggle('boss', boss || M.mimic);
  el.mAc.textContent = M.ac;
  el.bossTimer.classList.toggle('hidden', !boss);
  renderFloor();
  renderHP();
}

function damage(amount, kind, label) {
  if (!M || M.dead) return;
  M.hp -= amount;
  if (kind !== 'quiet') {
    el.monster.classList.remove('hit', 'spawn');
    void el.monster.offsetWidth;
    el.monster.classList.add('hit');
  }
  if (M.hp <= 0) kill();
  renderHP();
}

function kill() {
  M.dead = true;
  M.hp = 0;
  const g = M.gold * goldMul();
  earn(g);
  S.kills_total++;
  floatText(`+${fmt(g)}`, 'gold', 0, 30);
  el.monster.classList.add('dead');
  if (M.mimic) toast('🧰 Мимик повержен! Он был набит золотом');
  if (!M.mimic) {
    S.kills++;
    const need = isBossFloor(S.floor) ? 1 : KILLS_PER_FLOOR;
    if (S.kills >= need && S.floor === S.maxFloor) {
      S.maxFloor++;
      S.bestFloor = Math.max(S.bestFloor, S.maxFloor);
      if (M.boss) toast(`🏆 ${M.name} повержен!`);
      const unlocked = ABILITIES.find(a => a.unlock === S.maxFloor);
      if (unlocked) setTimeout(() => toast(`${unlocked.icon} Новое умение: ${unlocked.name}!`), 900);
    }
    if (S.kills >= need && S.auto && S.floor < S.maxFloor) { S.floor++; S.kills = 0; }
  }
  setTimeout(() => spawnMonster(), 320);
}

function bossFailed() {
  toast(`💀 ${M.name} слишком силён! Отступаем и качаемся`);
  S.auto = false;
  S.floor = Math.max(1, S.floor - 1);
  S.kills = 0;
  spawnMonster();
}

// ---------- Атаки ----------
function heroAttack(h, idx) {
  if (!M || M.dead) return;
  const lvl = S.heroes[h.id];
  const adv = h.adv || abilOn('adv');
  const r = rollD20(adv);
  S.rolls++;
  const ref = heroRefs[h.id];
  const critMin = h.critMin || 20;
  const x = (idx % 2 ? 1 : -1) * rnd(40, 90);
  if (!h.auto && (r === 1 || (r !== 20 && r + heroHit(h) < M.ac))) {
    ref.last.innerHTML = `d20 <b>${r}</b>${r === 1 ? ' — нат. 1!' : ''} · промах`;
    floatText(`${h.icon} мимо`, 'miss', x, 0);
    return;
  }
  const crit = !h.auto && r >= critMin;
  let sum = 0;
  for (let i = 0; i < h.n; i++) sum += d(h.die);
  const dmg = sum * heroPower(h) * partyMul() * (crit ? (h.critMul || 2) : 1);
  ref.last.innerHTML = h.auto
    ? `${h.n}d${h.die}: <b>${sum}</b> → ${fmt(dmg)}`
    : `d20 <b>${r}</b> · ${h.n}d${h.die}: <b>${sum}</b> → ${crit ? '<span style="color:#ff6a4a">КРИТ ' : ''}${fmt(dmg)}${crit ? '</span>' : ''}`;
  floatText(`${h.icon}${fmt(dmg)}`, crit ? 'crit' : '', x, rnd(-10, 30));
  damage(dmg);
}

function playerAttack() {
  if (!M || M.dead) return;
  const adv = abilOn('adv');
  const r = rollD20(adv);
  S.rolls++;
  animateD20(el.d20, r);
  const pd = playerDie();
  if (r === 20) S.nat20++;
  if (r === 1) S.nat1++;
  if (r === 1 || (r !== 20 && r + playerHit() < M.ac)) {
    el.rollCaption.textContent = r === 1 ? 'Нат. 1 — провал!' : `${r}+${playerHit()} < КД ${M.ac}`;
    floatText(r === 1 ? 'ПРОВАЛ' : 'мимо', 'miss', rnd(-30, 30), 10);
    return;
  }
  let sum = 0;
  for (let i = 0; i < pd.n; i++) sum += d(pd.d);
  const crit = r === 20;
  const dmg = (sum * tapPower() + partyDps() * S.tactic * 0.02) * dmgMul() * (crit ? 2 : 1);
  el.rollCaption.textContent = crit ? 'НАТУРАЛЬНАЯ 20!' : `${r}+${playerHit()} · ${pd.n}d${pd.d}: ${sum}`;
  floatText(fmt(dmg), crit ? 'crit tap' : 'tap', rnd(-40, 40), 0);
  if (crit) shake();
  damage(dmg);
  if (navigator.vibrate) navigator.vibrate(crit ? [20, 30, 40] : 8);
}

function animateD20(svg, value) {
  svg.classList.remove('rolling', 'nat20', 'nat1');
  void svg.getBoundingClientRect();
  svg.classList.add('rolling');
  if (value === 20) svg.classList.add('nat20');
  if (value === 1) svg.classList.add('nat1');
  svg.querySelector('text').textContent = value;
}

function shake() {
  el.arena.animate(
    [{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-4px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }],
    { duration: 260 });
}

let floatCount = 0;
function floatText(text, cls, dx = 0, dy = 0) {
  if (floatCount > 16) return;
  const f = document.createElement('div');
  f.className = 'fl ' + (cls || '');
  f.textContent = text;
  f.style.marginLeft = dx + 'px';
  f.style.marginTop = dy + 'px';
  el.floats.appendChild(f);
  floatCount++;
  setTimeout(() => { f.remove(); floatCount--; }, 1100);
}

// ---------- DOM ----------
const el = {};
['gold', 'gps', 'shards', 'arena', 'biome', 'floorNum', 'pips', 'floorPrev', 'floorNext', 'monster', 'floats',
 'mName', 'mAc', 'hpFill', 'hpText', 'bossTimer', 'bossFill', 'bossTime', 'abilities', 'rollBtn', 'd20',
 'rollCaption', 'chest', 'heroList', 'youList', 'gloryBox', 'toast', 'modal', 'modalBox', 'monsterWrap']
  .forEach(id => { el[id] = $(id); });

function renderHP() {
  if (!M) return;
  const p = Math.max(0, M.hp / M.maxHp);
  el.hpFill.style.transform = `scaleX(${p})`;
  el.hpText.textContent = `${fmt(Math.max(0, Math.ceil(M.hp)))} / ${fmt(M.maxHp)}`;
}
function renderFloor() {
  el.floorNum.textContent = S.floor;
  el.floorPrev.disabled = S.floor <= 1;
  el.floorNext.disabled = S.floor >= S.maxFloor;
  const boss = isBossFloor(S.floor);
  const need = boss ? 1 : KILLS_PER_FLOOR;
  const done = S.floor < S.maxFloor ? need : Math.min(S.kills, need);
  let html = '';
  for (let i = 0; i < need; i++) html += `<i class="pip${boss ? ' boss' : ''}${i < done ? ' on' : ''}"></i>`;
  el.pips.innerHTML = html;
}

// ----- Отряд -----
const heroRefs = {};
const RING = 2 * Math.PI * 30;
function buildHeroes() {
  el.heroList.innerHTML = '';
  HEROES.forEach(h => {
    const card = document.createElement('div');
    card.className = 'hcard';
    card.style.setProperty('--c', h.c);
    card.innerHTML = `
      <div class="portrait">
        <svg class="ring" viewBox="0 0 66 66"><circle class="bg" cx="33" cy="33" r="30"/><circle class="fg" cx="33" cy="33" r="30" stroke-dasharray="${RING}" stroke-dashoffset="${RING}"/></svg>
        <span>${h.icon}</span>
        <span class="lvl">Ур. 0</span>
      </div>
      <div class="h-info">
        <div class="h-name">${h.name}</div>
        <div class="h-tags">
          <span class="tag">${dieIcon(h.die, h.c)}${h.n}d${h.die}</span>
          <span class="tag" data-r="hit"></span>
          <span class="tag">⏱ ${h.int}с</span>
        </div>
        <div class="h-stat" data-r="stat"></div>
        <div class="h-last" data-r="last"></div>
      </div>
      <button class="btn-buy"><span class="t">Нанять</span><span class="c">0</span></button>`;
    const btn = card.querySelector('.btn-buy');
    btn.addEventListener('click', () => {
      const k = heroBuyK(h);
      const cost = heroCost(h, k);
      if (S.gold < cost) return;
      S.gold -= cost;
      const was = S.heroes[h.id];
      S.heroes[h.id] += k;
      if (!was) toast(`${h.icon} ${h.name} присоединяется к отряду!`);
      [10, 25, 50, 75, 100, 125, 150, 175, 200].forEach(ms => {
        if (was < ms && S.heroes[h.id] >= ms) toast(`${h.icon} ${h.name}: уровень ${ms} — урон ×2!`);
      });
      updateLists(true);
    });
    el.heroList.appendChild(card);
    heroRefs[h.id] = {
      card, btn, t: 0,
      ring: card.querySelector('.fg'),
      lvl: card.querySelector('.lvl'),
      hit: card.querySelector('[data-r=hit]'),
      stat: card.querySelector('[data-r=stat]'),
      last: card.querySelector('[data-r=last]'),
      bt: btn.querySelector('.t'), bc: btn.querySelector('.c'),
    };
    heroRefs[h.id].last.textContent = h.perk;
  });
}
function heroBuyK(h) {
  if (buyMode === 'max') return Math.max(1, maxBuy(h.cost, HERO_GROWTH, S.heroes[h.id], S.gold));
  return buyMode;
}

// ----- Персонаж -----
const YOU = [
  { id: 'str', icon: '💪', name: 'Сила', c: '#c0504a',
    info: () => `Урон тапа ×${fmt(tapPower())} · каждые 25 ур. ×2`,
    lvl: () => S.str, max: Infinity, bulk: true,
    cost: k => bulk(10, 1.085, S.str, k), maxK: () => maxBuy(10, 1.085, S.str, S.gold),
    buy: k => { S.str += k; } },
  { id: 'die', icon: '🎲', name: 'Кубик урона', c: '#9a5ad8',
    info: () => { const n = PLAYER_DICE[S.dieTier + 1]; return `Сейчас ${playerDie().n}d${playerDie().d}` + (n ? ` → ${n.n}d${n.d}` : ' (максимум)'); },
    lvl: () => S.dieTier, max: PLAYER_DICE.length - 1,
    cost: () => PLAYER_DICE[S.dieTier + 1]?.cost ?? Infinity,
    buy: () => { S.dieTier++; } },
  { id: 'acc', icon: '🎯', name: 'Точность', c: '#5a9a4a',
    info: () => `+${S.acc} к броску атаки (всего +${playerHit()})`,
    lvl: () => S.acc, max: 15,
    cost: () => 100 * 4.2 ** S.acc,
    buy: () => { S.acc++; } },
  { id: 'tactic', icon: '📜', name: 'Тактика', c: '#e0b040',
    info: () => `Тап добавляет ${S.tactic * 2}% урона/сек отряда`,
    lvl: () => S.tactic, max: 25,
    cost: () => 500 * 2.6 ** S.tactic,
    buy: () => { S.tactic++; } },
];
const youRefs = {};
function buildYou() {
  el.youList.innerHTML = `
    <div class="stats" style="margin:0 0 10px">
      <div class="stat"><div class="k">Средний урон тапа</div><div class="v" id="ysTap">0</div></div>
      <div class="stat"><div class="k">Урон отряда / сек</div><div class="v" id="ysDps">0</div></div>
      <div class="stat"><div class="k">Шанс попасть (тап)</div><div class="v" id="ysHit">0</div></div>
      <div class="stat"><div class="k">Множитель урона</div><div class="v" id="ysMul">0</div></div>
    </div>`;
  YOU.forEach(u => {
    const card = document.createElement('div');
    card.className = 'hcard';
    card.style.setProperty('--c', u.c);
    card.innerHTML = `
      <div class="portrait"><span>${u.icon}</span><span class="lvl">0</span></div>
      <div class="h-info"><div class="h-name">${u.name}</div><div class="h-stat" data-r="info"></div></div>
      <button class="btn-buy"><span class="t">Улучшить</span><span class="c">0</span></button>`;
    const btn = card.querySelector('.btn-buy');
    btn.addEventListener('click', () => {
      const k = u.bulk ? youK(u) : 1;
      const cost = u.cost(k);
      if (S.gold < cost || u.lvl() >= u.max) return;
      S.gold -= cost;
      u.buy(k);
      updateLists(true);
    });
    el.youList.appendChild(card);
    youRefs[u.id] = { btn, lvl: card.querySelector('.lvl'), info: card.querySelector('[data-r=info]'), bt: btn.querySelector('.t'), bc: btn.querySelector('.c') };
  });
}
function youK(u) {
  if (buyMode === 'max') return Math.max(1, u.maxK());
  return buyMode;
}

// ----- Способности -----
const abilRefs = {};
function buildAbilities() {
  el.abilities.innerHTML = '';
  ABILITIES.forEach(a => {
    const b = document.createElement('button');
    b.className = 'abil';
    b.innerHTML = `<span>${a.icon}</span><div class="cd"></div><div class="cdt"></div><div class="lock">эт. ${a.unlock}</div>`;
    b.addEventListener('click', () => {
      if (S.maxFloor < a.unlock) { toast(`${a.icon} ${a.name} откроется на этаже ${a.unlock}`); return; }
      const st = S.abil[a.id] || {};
      if ((st.ready || 0) > now()) { toast(`${a.icon} ${a.name}: перезарядка`); return; }
      S.abil[a.id] = { until: now() + a.dur * 1000, ready: now() + a.cd * 1000 };
      toast(`${a.icon} ${a.name}! ${a.desc}`);
    });
    el.abilities.appendChild(b);
    abilRefs[a.id] = { b, cd: b.querySelector('.cd'), cdt: b.querySelector('.cdt'), lock: b.querySelector('.lock') };
  });
}
function renderAbilities() {
  const t = now();
  ABILITIES.forEach(a => {
    const r = abilRefs[a.id], st = S.abil[a.id] || {};
    const locked = S.maxFloor < a.unlock;
    r.b.classList.toggle('locked', locked);
    r.lock.classList.toggle('hidden', !locked);
    const active = (st.until || 0) > t;
    r.b.classList.toggle('active', active);
    const left = ((st.ready || 0) - t) / 1000;
    if (!locked && !active && left > 0) {
      r.cd.style.transform = `scaleY(${left / a.cd})`;
      r.cdt.textContent = Math.ceil(left);
    } else {
      r.cd.style.transform = 'scaleY(0)';
      r.cdt.textContent = active ? Math.ceil((st.until - t) / 1000) : '';
    }
  });
}

// ----- Слава -----
function renderGlory() {
  const gain = pendingShards();
  el.gloryBox.innerHTML = `
    <div class="glory">
      <div class="big-shard">◆</div>
      <p>Отряд устал. Распусти его, начни <b>новую кампанию</b> с первого этажа — и забери <b>Осколки Судьбы</b>.</p>
      <p>Каждый осколок навсегда даёт <b>+${SHARD_BONUS * 100}%</b> к урону и золоту.</p>
      <p>Сейчас: <b>${S.shards}</b> ◆ (бонус +${Math.round(S.shards * SHARD_BONUS * 100)}%)</p>
      <div class="gain">+${gain} ◆</div>
      <p style="font-size:12px;color:#a08e72">${S.maxFloor < PRESTIGE_FLOOR ? `Доступно с этажа ${PRESTIGE_FLOOR}` : 'Чем глубже этаж — тем больше осколков'}</p>
      <button class="btn-big" id="prestigeBtn" ${gain < 1 ? 'disabled' : ''}>Новая кампания</button>
    </div>
    <div class="stats">
      <div class="stat"><div class="k">Лучший этаж</div><div class="v">${S.bestFloor}</div></div>
      <div class="stat"><div class="k">Кампаний</div><div class="v">${S.campaigns}</div></div>
      <div class="stat"><div class="k">Бросков d20</div><div class="v">${fmt(S.rolls)}</div></div>
      <div class="stat"><div class="k">Натуральных 20 / 1</div><div class="v">${fmt(S.nat20)} / ${fmt(S.nat1)}</div></div>
      <div class="stat"><div class="k">Убито монстров</div><div class="v">${fmt(S.kills_total)}</div></div>
      <div class="stat"><div class="k">Всего золота</div><div class="v">${fmt(S.totalGold)}</div></div>
    </div>
    <div style="text-align:center"><button class="btn-ghost" id="wipeBtn">Стереть сохранение</button></div>`;
  $('prestigeBtn').onclick = () => {
    const g = pendingShards();
    if (g < 1) return;
    confirmModal('Новая кампания?', `Отряд, золото и этажи сбросятся. Ты получишь <b>+${g} ◆</b>.`, () => {
      const keep = {
        shards: S.shards + g, campaigns: S.campaigns + 1, totalGold: S.totalGold, rolls: S.rolls,
        nat20: S.nat20, nat1: S.nat1, kills_total: S.kills_total, bestFloor: S.bestFloor, started: S.started,
      };
      S = Object.assign(freshState(), keep);
      afterReset();
      toast(`◆ Новая кампания! +${g} осколков`);
    });
  };
  $('wipeBtn').onclick = () => confirmModal('Стереть всё?', 'Весь прогресс, включая осколки, будет удалён.', () => {
    S = freshState();
    afterReset();
  });
}
function afterReset() {
  HEROES.forEach(h => { heroRefs[h.id].t = 0; heroRefs[h.id].last.textContent = h.perk; });
  save();
  spawnMonster();
  updateLists(true);
  renderGlory();
}

// ----- Тост / модалки -----
let toastT;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  el.toast.style.animation = 'none'; void el.toast.offsetWidth; el.toast.style.animation = '';
  clearTimeout(toastT);
  toastT = setTimeout(() => el.toast.classList.add('hidden'), 2600);
}
function modal(html) { el.modalBox.innerHTML = html; el.modal.classList.remove('hidden'); }
function closeModal() { el.modal.classList.add('hidden'); }
function confirmModal(title, text, yes) {
  modal(`<h3>${title}</h3><p>${text}</p><button class="btn-big red" id="mYes">Да</button><br><button class="btn-ghost" id="mNo">Отмена</button>`);
  $('mYes').onclick = () => { closeModal(); yes(); };
  $('mNo').onclick = closeModal;
}

// ---------- Сундук ----------
let chestAt = now() + rnd(40, 80) * 1000, chestGone = 0;
function tickChest(t) {
  const hidden = el.chest.classList.contains('hidden');
  if (hidden && t >= chestAt && S.maxFloor >= 3) {
    el.chest.classList.remove('hidden');
    chestGone = t + 15000;
  } else if (!hidden && t >= chestGone) {
    el.chest.classList.add('hidden');
    chestAt = t + rnd(60, 140) * 1000;
  }
}
el.chest.addEventListener('click', () => {
  el.chest.classList.add('hidden');
  chestAt = now() + rnd(60, 140) * 1000;
  const income = Math.max(goldPerSec(), floorGold(S.floor) * 0.5);
  modal(`<h3>Сундук!</h3><p>Проверка Удачи — бросай d20</p>${bigD20('chestDie')}<p id="chestRes">&nbsp;</p><div id="chestBtn"></div>`);
  const die = $('chestDie');
  let i = 0;
  const spin = setInterval(() => {
    die.querySelector('text').textContent = d(20);
    if (++i > 12) {
      clearInterval(spin);
      const r = d(20);
      animateD20(die, r);
      let txt, g = 0;
      if (r === 1) { txt = '🧰 <b>Это МИМИК!</b> Убей его — внутри много золота'; }
      else if (r < 10) { g = income * 30; txt = `Немного монет: <div class="reward">+${fmt(g)}</div>`; }
      else if (r < 20) { g = income * 120; txt = `Хороший улов! <div class="reward">+${fmt(g)}</div>`; }
      else { g = income * 600; txt = `<b style="color:#ffd34a">НАТУРАЛЬНАЯ 20!</b> Сокровища дракона! <div class="reward">+${fmt(g)}</div>`; }
      $('chestRes').innerHTML = txt;
      $('chestBtn').innerHTML = `<button class="btn-big" id="chestOk">${r === 1 ? 'В бой!' : 'Забрать'}</button>`;
      $('chestOk').onclick = () => {
        closeModal();
        if (r === 1) spawnMonster(true); else { earn(g); floatText('+' + fmt(g), 'gold', 0, 0); }
      };
    }
  }, 55);
});

// ---------- Ввод ----------
el.rollBtn.addEventListener('pointerdown', e => { e.preventDefault(); playerAttack(); });
el.monsterWrap.addEventListener('pointerdown', e => { e.preventDefault(); playerAttack(); });
el.floorPrev.addEventListener('click', () => { if (S.floor > 1) { S.floor--; S.kills = 0; S.auto = false; spawnMonster(); } });
el.floorNext.addEventListener('click', () => { if (S.floor < S.maxFloor) { S.floor++; S.kills = 0; S.auto = true; spawnMonster(); } });
document.querySelectorAll('#buyMode button').forEach(b => b.addEventListener('click', () => {
  buyMode = b.dataset.m === 'max' ? 'max' : +b.dataset.m;
  document.querySelectorAll('#buyMode button').forEach(x => x.classList.toggle('on', x === b));
  updateLists(true);
}));
document.querySelectorAll('.tabb').forEach(b => b.addEventListener('click', () => {
  tab = b.dataset.p;
  document.querySelectorAll('.tabb').forEach(x => x.classList.toggle('on', x === b));
  ['party', 'you', 'glory'].forEach(p => $('p-' + p).classList.toggle('hidden', p !== tab));
  // переключатель ×1/×10/Макс нужен и на вкладке героя
  const seg = $('buyMode');
  if (tab === 'you') $('p-you').querySelector('.panel-head').appendChild(seg);
  if (tab === 'party') $('p-party').querySelector('.panel-head').appendChild(seg);
  if (tab === 'glory') renderGlory();
  updateLists(true);
}));

// ---------- Обновление списков ----------
function updateLists() {
  el.gold.textContent = fmt(S.gold);
  el.gps.textContent = fmt(goldPerSec());
  el.shards.textContent = S.shards;
  const g = pendingShards();
  const gb = document.querySelector('[data-p=glory]');
  let badge = gb.querySelector('.badge');
  if (g >= 1 && !badge) { badge = document.createElement('span'); badge.className = 'badge'; gb.appendChild(badge); }
  if (badge) { if (g < 1) badge.remove(); else badge.textContent = '+' + g; }

  if (tab === 'party') {
    let showNext = true;
    HEROES.forEach(h => {
      const r = heroRefs[h.id], lvl = S.heroes[h.id];
      const visible = lvl > 0 || showNext;
      if (!lvl) showNext = false;
      r.card.classList.toggle('hidden', !visible);
      if (!visible) return;
      const k = heroBuyK(h), cost = heroCost(h, k);
      r.lvl.textContent = 'Ур. ' + lvl;
      r.hit.textContent = h.auto ? '✦ авто-попадание' : `+${heroHit(h)} к атаке`;
      const next = [10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250].find(m => m > lvl);
      r.stat.innerHTML = lvl
        ? `<b>${fmt(heroDps(h, M ? M.ac : floorAC(S.floor)))}</b> урона/сек <span class="milestone">· ×2 на ур. ${next}</span>`
        : `<span class="milestone">${h.perk}</span>`;
      r.bt.textContent = lvl ? (k > 1 ? `+${k} ур.` : 'Уровень') : 'Нанять';
      r.bc.textContent = fmt(cost);
      r.btn.disabled = S.gold < cost;
    });
  } else if (tab === 'you') {
    $('ysTap').textContent = fmt(tapAvg());
    $('ysDps').textContent = fmt(partyDps());
    $('ysHit').textContent = Math.round(hitChance(playerHit(), M ? M.ac : floorAC(S.floor), abilOn('adv')) * 100) + '%';
    $('ysMul').textContent = '×' + dmgMul().toFixed(2);
    YOU.forEach(u => {
      const r = youRefs[u.id];
      const maxed = u.lvl() >= u.max;
      const k = u.bulk ? youK(u) : 1;
      const cost = maxed ? Infinity : u.cost(k);
      r.lvl.textContent = u.lvl();
      r.info.textContent = u.info();
      r.bt.textContent = maxed ? 'Максимум' : (k > 1 ? `+${k}` : 'Улучшить');
      r.bc.textContent = maxed ? '—' : fmt(cost);
      r.btn.disabled = maxed || S.gold < cost;
    });
  }
}

// ---------- Игровой цикл ----------
let last = performance.now(), uiT = 0, gloryT = 0;
function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.25);
  last = t;
  const tm = now();

  // атаки героев
  HEROES.forEach((h, i) => {
    const r = heroRefs[h.id];
    if (!S.heroes[h.id]) { r.ring.style.strokeDashoffset = RING; return; }
    r.t += dt;
    if (r.t >= h.int) { r.t -= h.int; if (r.t > h.int) r.t = 0; heroAttack(h, i); }
    if (tab === 'party') r.ring.style.strokeDashoffset = RING * (1 - r.t / h.int);
  });

  // таймер босса
  if (M && M.boss && !M.dead) {
    const left = Math.max(0, (M.bossEnd - tm) / 1000);
    el.bossFill.style.transform = `scaleX(${left / BOSS_TIME})`;
    el.bossTime.textContent = left.toFixed(1) + ' с';
    if (left <= 0) bossFailed();
  }

  tickChest(tm);
  uiT += dt; gloryT += dt;
  if (uiT > 0.2) { uiT = 0; updateLists(); renderAbilities(); renderFloor(); }
  if (gloryT > 1 && tab === 'glory' && el.modal.classList.contains('hidden')) { gloryT = 0; renderGlory(); }
  requestAnimationFrame(frame);
}

// ---------- Сохранение ----------
function save() {
  S.lastSave = now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* хранилище недоступно */ }
}
function load() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { data = null; }
  if (!data) return;
  const base = freshState();
  S = Object.assign(base, data);
  S.heroes = Object.assign(base.heroes, data.heroes || {});
  S.abil = data.abil || {};
  if (isBossFloor(S.floor) && S.floor === S.maxFloor) S.floor = Math.max(1, S.floor - 1); // не начинать с босса

  const away = Math.min((now() - (data.lastSave || now())) / 1000, OFFLINE_CAP);
  if (away > 30) {
    const gain = goldPerSec() * away;
    if (gain > 0) {
      earn(gain);
      modal(`<h3>С возвращением!</h3>
        <p>Пока тебя не было (${fmtTime(away)}), отряд зачищал этаж ${S.floor} и добыл:</p>
        <div class="reward">+${fmt(gain)}</div>
        <button class="btn-big" id="mOk">В казну!</button>`);
      $('mOk').onclick = closeModal;
    }
  }
}
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

// ---------- Старт ----------
load();
buildHeroes();
buildYou();
buildAbilities();
spawnMonster();
updateLists();
renderAbilities();
requestAnimationFrame(frame);
