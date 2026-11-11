// =============== Игровой движок ===============
import {
  HEROES, HERO_GROWTH, HERO_MILESTONES, PLAYER_DICE, ABILITIES, RELICS,
  KILLS_PER_FLOOR, BOSS_TIME, PRESTIGE_FLOOR, OFFLINE_CAP,
} from './data.js';
import { makeMonsterSpec, bossTier, biomeOf } from './monsters.js';
import { makeItem, rollRarity, gearTotals, salvageValue, upgradeCost, upgradeDC, RARITIES, SLOTS, itemPower } from './loot.js';

const SAVE_KEY = 'dice-fate-v2';
const OLD_SAVE_KEY = 'dice-fate-v1';

export const d = sides => 1 + Math.floor(Math.random() * sides);
const now = () => Date.now();
const rnd = (a, b) => a + Math.random() * (b - a);

export function bulk(base, growth, lvl, k) { return base * growth ** lvl * (growth ** k - 1) / (growth - 1); }
export function maxBuy(base, growth, lvl, gold) {
  const k = Math.floor(Math.log(gold * (growth - 1) / (base * growth ** lvl) + 1) / Math.log(growth));
  return Math.max(0, k);
}

// ---------- Состояние ----------
function freshState() {
  return {
    v: 2,
    gold: 0, floor: 1, maxFloor: 1, kills: 0, auto: true,
    heroes: Object.fromEntries(HEROES.map(h => [h.id, 0])),
    str: 0, dieTier: 0, acc: 0, tactic: 0,
    abil: {},
    shards: 0, shardsTotal: 0, relics: {}, campaigns: 0,
    inv: [], eq: Object.fromEntries(SLOTS.map(s => [s.id, null])), dust: 0, autoSalvage: -1, nextItemId: 1,
    stats: { gold: 0, rolls: 0, nat20: 0, nat1: 0, kills: 0, bosses: 0, items: 0, legendaries: 0, bestFloor: 1, upgrades: 0 },
    seen: { biomes: [0], uniques: [] },
    started: now(), lastSave: now(),
  };
}

export const G = {
  S: freshState(),
  M: null,
  timers: {},          // прогресс атаки каждого героя (0..1)
  lastRolls: {},       // последний бросок каждого героя, для карточек
  tapRoll: { r: 20, text: 'Тапай!', n: 0 },
  buyMode: 1,
  gear: gearTotals({}),
  version: 0,
};
const S = () => G.S;

// ---------- События для UI ----------
const listeners = new Set();
const evListeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function onEvent(fn) { evListeners.add(fn); return () => evListeners.delete(fn); }
function emit(type, data) { evListeners.forEach(fn => fn(type, data)); }
export function notify() { G.version++; listeners.forEach(fn => fn()); }
export const toast = (msg, kind) => emit('toast', { msg, kind });

// ---------- Производные значения ----------
export const relic = id => S().relics[id] || 0;
export const abilOn = id => (S().abil[id]?.until || 0) > now();
const uq = id => G.gear.uniques.has(id);
function recalcGear() { G.gear = gearTotals(S().eq); }

export function heroUnlocked(h) { return !h.unlock || S().stats.bestFloor >= h.unlock; }
export function heroMul(lvl) {
  if (lvl <= 0) return 0;
  const ms = HERO_MILESTONES.filter(m => lvl >= m).length;
  return lvl * 2 ** ms * (lvl > 1000 ? 2 ** Math.floor((lvl - 1000) / 100) : 1);
}
export function nextMilestone(lvl) {
  return HERO_MILESTONES.find(m => m > lvl) || (Math.floor(Math.max(lvl, 1000) / 100) + 1) * 100;
}
export function dmgMul() {
  return (1 + relic('blade') * 0.25) * (1 + S().heroes.bard * 0.01) * (1 + G.gear.dmg / 100);
}
export function partyMul(h) {
  let m = dmgMul() * (1 + G.gear.party / 100) * (abilOn('rage') ? 2 : 1);
  if (h) m *= 1 + (G.gear.cls[h.id] || 0) / 100;
  return m;
}
export function tapMul() { return dmgMul() * (1 + G.gear.tap / 100); }
export function goldMul() {
  let m = (1 + relic('greed') * 0.2) * (1 + S().heroes.cleric * 0.02) * (1 + G.gear.gold / 100);
  if (abilOn('midas')) m *= 3;
  if (uq('midas')) m *= 1.5;
  return m;
}
export function luck() { return relic('luck') + G.gear.luck + (uq('fortune') ? 3 : 0); }
export function critBonus() { return G.gear.critRange + (uq('shadow') ? 2 : 0); }
export function critDmgMul() { return (1 + G.gear.critDmg / 100) * (uq('vorpal') ? 3 : 1); }
export function speedMul() { return 1 + Math.min(G.gear.speed, 150) / 100 + (uq('haste') ? 0.25 : 0); }
export function bossTime() { return BOSS_TIME + relic('hourglass') * 3 + G.gear.bossTime + (uq('dragonhelm') ? 10 : 0); }
export function killsPerFloor() { return uq('leagues') ? 5 : KILLS_PER_FLOOR; }
export function invCap() { return 30 + relic('bag') * 10; }

export function heroHit(h) { return h.hit + Math.floor(S().heroes[h.id] / 4) + G.gear.hit + (uq('mithril') ? 3 : 0); }
export function heroCritMin(h) { return Math.max(12, (h.critMin || 20) - critBonus()); }
export function heroInterval(h) { return h.int / speedMul(); }
export function heroPower(h) { return h.power * heroMul(S().heroes[h.id]); }
export function heroCost(h, k) { return bulk(h.cost * 0.95 ** relic('tome'), HERO_GROWTH, S().heroes[h.id], k); }
export function heroBuyK(h) {
  if (G.buyMode === 'max') return Math.max(1, maxBuy(h.cost * 0.95 ** relic('tome'), HERO_GROWTH, S().heroes[h.id], S().gold));
  return G.buyMode;
}

export function floorAC(f) { return Math.min(30, 8 + Math.floor(f / 3)); }
const BOSS_HP = [1, 8, 10, 15];
const BOSS_GOLD = [1, 6, 8, 15];
export function floorHP(f) { return Math.ceil(10 * 1.42 ** (f - 1)); }
export function floorGold(f) { return Math.ceil(floorHP(f) / 3.5); }

export function hitChance(bonus, ac, adv) {
  const p = Math.min(0.95, Math.max(0.05, (21 - (ac - bonus)) / 20));
  return adv ? 1 - (1 - p) ** 2 : p;
}
export function heroDps(h, ac = floorAC(S().floor)) {
  if (!S().heroes[h.id]) return 0;
  const adv = h.adv || abilOn('adv');
  const p = h.auto ? 1 : hitChance(heroHit(h), ac, adv);
  let c = h.auto ? 0 : (21 - heroCritMin(h)) / 20;
  if (adv) c = 1 - (1 - c) ** 2;
  const avg = h.n * (h.die + 1) / 2 * heroPower(h);
  const critM = (h.critMul || 2) * critDmgMul();
  const echo = uq('echo') ? 1.15 : 1;
  return p * avg * (1 + c * (critM - 1)) / heroInterval(h) * partyMul(h) * echo;
}
export function partyDps(ac) { return HEROES.reduce((s, h) => s + heroDps(h, ac), 0); }

export function playerDie() { return PLAYER_DICE[S().dieTier]; }
export function playerHit() { return 2 + S().acc + Math.floor(S().str / 10) + G.gear.hit; }
export function tapPower() { return (1 + S().str) * 2 ** Math.floor(S().str / 25); }
export function tapAvg() {
  const pd = playerDie();
  return (pd.n * (pd.d + 1) / 2 * tapPower() + partyDps() * S().tactic * 0.02) * tapMul();
}
export function goldPerSec() {
  const dps = partyDps();
  if (dps <= 0) return 0;
  const t = bossTier(S().floor);
  const hp = floorHP(S().floor) * BOSS_HP[t];
  return 1 / (hp / dps + 0.35) * floorGold(S().floor) * BOSS_GOLD[t] * goldMul();
}
export function pendingShards() {
  if (S().maxFloor < PRESTIGE_FLOOR) return 0;
  return Math.floor(((S().maxFloor - 10) / 5) ** 1.6 * (1 + relic('prism') * 0.1));
}

function rollD20(adv) {
  const a = d(20);
  return adv ? Math.max(a, d(20)) : a;
}
function earn(g) { S().gold += g; S().stats.gold += g; }

// ---------- Монстры ----------
export function spawnMonster(mimic) {
  const st = S();
  const f = st.floor;
  const m = makeMonsterSpec(f, { mimic });
  const tier = m.tier;
  const hp = floorHP(f) * BOSS_HP[tier] * (mimic ? 3 : 1);
  G.M = {
    uid: Math.random(),
    name: m.name, spec: m.spec, tier, mimic: !!mimic, biome: m.biome, circle: m.circle,
    hp, maxHp: hp,
    ac: floorAC(f) + (tier ? tier + 1 : 0),
    gold: floorGold(f) * BOSS_GOLD[tier] * (mimic ? 25 : 1),
    bossEnd: tier ? now() + bossTime() * 1000 : 0,
    bossDur: tier ? bossTime() : 0,
    dead: false,
  };
  const bi = biomeOf(f).index % 10;
  if (!st.seen.biomes.includes(bi)) {
    st.seen.biomes.push(bi);
    toast(`Новые земли: ${m.biome.name}`, 'biome');
  }
  emit('spawn', G.M);
  notify();
}

function damage(amount, info) {
  const M = G.M;
  if (!M || M.dead) return;
  if (M.tier && uq('holy')) amount *= 2.5;
  M.hp -= amount;
  emit('hit', { ...info, amount });
  if (M.hp <= 0) kill();
}

function kill() {
  const st = S(), M = G.M;
  M.dead = true; M.hp = 0;
  const g = M.gold * goldMul();
  earn(g);
  st.stats.kills++;
  emit('kill', { gold: g });
  if (M.tier) st.stats.bosses++;
  // Лут
  maybeDrop(M);
  if (M.mimic) toast('Мимик повержен! Внутри было полно золота', 'gold');
  else {
    st.kills++;
    const need = M.tier ? 1 : killsPerFloor();
    if (st.kills >= need && st.floor === st.maxFloor) {
      st.maxFloor++;
      if (st.maxFloor > st.stats.bestFloor) {
        st.stats.bestFloor = st.maxFloor;
        const h = HEROES.find(x => x.unlock === st.maxFloor);
        if (h) setTimeout(() => toast(`Секретный герой: ${h.name} готов присоединиться!`, 'epic'), 600);
      }
      if (M.tier) toast(`${M.name} повержен!`, 'boss');
      const a = ABILITIES.find(x => x.unlock === st.maxFloor);
      if (a) setTimeout(() => toast(`Новое умение: ${a.name}!`, 'epic'), 900);
    }
    if (st.kills >= need && st.auto && st.floor < st.maxFloor) { st.floor++; st.kills = 0; }
  }
  setTimeout(() => spawnMonster(), 380);
  notify();
}

function bossFailed() {
  toast(`${G.M.name} слишком силён! Отступаем и качаемся`, 'bad');
  const st = S();
  st.auto = false;
  st.floor = Math.max(1, st.floor - 1);
  st.kills = 0;
  spawnMonster();
}

// ---------- Лут ----------
function maybeDrop(M) {
  const chance = (M.tier ? 1 : M.mimic ? 1 : 0.045) * (1 + G.gear.loot / 100);
  if (Math.random() >= chance) return;
  const minRar = M.tier === 3 ? 4 : M.tier === 2 ? 2 : M.tier === 1 ? 1 : 0;
  const lk = luck() + (M.tier ? 2 : 0) + (M.mimic ? 3 : 0);
  dropItem(S().floor, lk, M.tier > 0 || M.mimic, minRar);
}

export function dropItem(ilvl, lk, adv, minRar = 0, slot) {
  const st = S();
  const rr = rollRarity(lk, adv, minRar);
  const item = makeItem(st.nextItemId++, ilvl, rr.rar, slot);
  st.stats.items++;
  if (rr.rar >= 4) {
    st.stats.legendaries++;
    if (!st.seen.uniques.includes(item.unique)) st.seen.uniques.push(item.unique);
  }
  const autoSalv = rr.rar <= st.autoSalvage;
  const full = st.inv.length >= invCap();
  if (autoSalv || (full && rr.rar < 4)) {
    const dust = salvageValue(item);
    st.dust += dust;
    emit('loot', { item, roll: rr, salvaged: dust, full: full && !autoSalv });
  } else {
    st.inv.unshift(item);
    emit('loot', { item, roll: rr });
  }
  notify();
  return item;
}

export function equip(itemId) {
  const st = S();
  const i = st.inv.findIndex(x => x.id === itemId);
  if (i < 0) return;
  const item = st.inv[i];
  const prev = st.eq[item.slot];
  st.inv.splice(i, 1);
  if (prev) st.inv.unshift(prev);
  st.eq[item.slot] = item;
  recalcGear();
  notify();
}
export function unequip(slot) {
  const st = S();
  const item = st.eq[slot];
  if (!item) return;
  if (st.inv.length >= invCap()) { toast('Инвентарь полон', 'bad'); return; }
  st.eq[slot] = null;
  st.inv.unshift(item);
  recalcGear();
  notify();
}
export function salvage(itemId) {
  const st = S();
  const i = st.inv.findIndex(x => x.id === itemId);
  if (i < 0) return 0;
  const dust = salvageValue(st.inv[i]);
  st.dust += dust;
  st.inv.splice(i, 1);
  notify();
  return dust;
}
export function salvageBelow(rar) {
  const st = S();
  let dust = 0, n = 0;
  st.inv = st.inv.filter(it => {
    if (it.rar <= rar && !it.locked) { dust += salvageValue(it); n++; return false; }
    return true;
  });
  st.dust += dust;
  notify();
  return { dust, n };
}
export function toggleLock(itemId) {
  const it = S().inv.find(x => x.id === itemId);
  if (it) { it.locked = !it.locked; notify(); }
}
export function setAutoSalvage(v) { S().autoSalvage = v; notify(); }

// Заточка: бросок d20 против Сложности. Провал — пыль сгорает, предмет цел.
export function upgradeItem(slot) {
  const st = S();
  const item = st.eq[slot];
  if (!item) return null;
  const cost = upgradeCost(item);
  if (st.dust < cost) return null;
  st.dust -= cost;
  const dc = upgradeDC(item, relic('forge'));
  const r = d(20);
  const ok = r === 20 || (r !== 1 && r >= dc);
  if (ok) { item.plus++; st.stats.upgrades++; recalcGear(); }
  notify();
  return { r, dc, ok, plus: item.plus };
}

// ---------- Атаки ----------
function heroAttack(h, idx, echo) {
  const M = G.M;
  if (!M || M.dead) return;
  const adv = h.adv || abilOn('adv');
  const r = rollD20(adv);
  S().stats.rolls++;
  if (!h.auto && (r === 1 || (r !== 20 && r + heroHit(h) < M.ac))) {
    G.lastRolls[h.id] = { r, miss: true };
    emit('hit', { src: h.id, miss: true, roll: r, idx });
    return;
  }
  const crit = !h.auto && r >= heroCritMin(h);
  let sum = 0;
  for (let i = 0; i < h.n; i++) sum += d(h.die);
  const dmg = sum * heroPower(h) * partyMul(h) * (crit ? (h.critMul || 2) * critDmgMul() : 1);
  G.lastRolls[h.id] = { r, sum, dmg, crit, auto: h.auto };
  damage(dmg, { src: h.id, crit, roll: r, idx });
  if (!echo && uq('echo') && Math.random() < 0.15) setTimeout(() => heroAttack(h, idx, true), 150);
}

export function playerAttack() {
  const M = G.M;
  if (!M || M.dead) return;
  const st = S();
  const adv = abilOn('adv') || uq('insight');
  const r = rollD20(adv);
  st.stats.rolls++;
  if (r === 20) st.stats.nat20++;
  if (r === 1) st.stats.nat1++;
  const pd = playerDie();
  const hit = playerHit();
  if (r === 1 || (r !== 20 && r + hit < M.ac)) {
    G.tapRoll = { r, text: r === 1 ? 'Нат. 1 — провал!' : `${r}+${hit} < КД ${M.ac}`, n: G.tapRoll.n + 1 };
    emit('hit', { src: 'tap', miss: true, roll: r, fumble: r === 1 });
    notify();
    return;
  }
  let sum = 0;
  for (let i = 0; i < pd.n; i++) sum += d(pd.d);
  const crit = r >= 20 - critBonus();
  const dmg = (sum * tapPower() + partyDps() * st.tactic * 0.02) * tapMul() * (crit ? 2 * critDmgMul() : 1);
  G.tapRoll = { r, text: crit ? (r === 20 ? 'НАТУРАЛЬНАЯ 20!' : 'КРИТ!') : `${r}+${hit} · ${pd.n}d${pd.d}: ${sum}`, n: G.tapRoll.n + 1 };
  damage(dmg, { src: 'tap', crit, roll: r });
  notify();
}

// ---------- Покупки ----------
export function buyHero(h) {
  const st = S();
  if (!heroUnlocked(h)) return;
  const k = heroBuyK(h);
  const cost = heroCost(h, k);
  if (st.gold < cost) return;
  st.gold -= cost;
  const was = st.heroes[h.id];
  st.heroes[h.id] += k;
  if (!was) toast(`${h.name} присоединяется к отряду!`, 'epic');
  else {
    const ms = HERO_MILESTONES.filter(m => was < m && st.heroes[h.id] >= m).pop();
    if (ms) toast(`${h.name}: уровень ${ms} — урон ×2!`, 'gold');
  }
  notify();
}

export const PLAYER_UPGRADES = [
  { id: 'str', icon: 'fist', name: 'Сила', c: '#d0564c', bulk: true, max: Infinity,
    info: () => `Урон тапа ×${tapPower().toLocaleString('ru')} · каждые 25 ур. ×2`,
    lvl: () => S().str, cost: k => bulk(10, 1.085, S().str, k), maxK: () => maxBuy(10, 1.085, S().str, S().gold),
    buy: k => { S().str += k; } },
  { id: 'die', icon: 'd20', name: 'Кубик урона', c: '#a060e8', max: PLAYER_DICE.length - 1,
    info: () => { const n = PLAYER_DICE[S().dieTier + 1]; const p = playerDie(); return `Сейчас ${p.n}d${p.d}` + (n ? ` → ${n.n}d${n.d}` : ' (максимум)'); },
    lvl: () => S().dieTier, cost: () => PLAYER_DICE[S().dieTier + 1]?.cost ?? Infinity, buy: () => { S().dieTier++; } },
  { id: 'acc', icon: 'target', name: 'Точность', c: '#62a850', max: 15,
    info: () => `+${S().acc} к броску атаки (всего +${playerHit()})`,
    lvl: () => S().acc, cost: () => 100 * 4.2 ** S().acc, buy: () => { S().acc++; } },
  { id: 'tactic', icon: 'scroll', name: 'Тактика', c: '#e6b440', max: 50,
    info: () => `Тап добавляет ${S().tactic * 2}% урона/сек отряда`,
    lvl: () => S().tactic, cost: () => 500 * 2.6 ** S().tactic, buy: () => { S().tactic++; } },
];
export function upgradeK(u) {
  if (!u.bulk) return 1;
  return G.buyMode === 'max' ? Math.max(1, u.maxK()) : G.buyMode;
}
export function buyUpgrade(u) {
  const k = upgradeK(u);
  if (u.lvl() >= u.max) return;
  const cost = u.cost(k);
  if (S().gold < cost) return;
  S().gold -= cost;
  u.buy(k);
  notify();
}
export function setBuyMode(m) { G.buyMode = m; notify(); }

export function useAbility(a) {
  const st = S();
  if (st.maxFloor < a.unlock) { toast(`${a.name} откроется на этаже ${a.unlock}`); return; }
  if ((st.abil[a.id]?.ready || 0) > now()) { toast(`${a.name}: перезарядка`); return; }
  st.abil[a.id] = { until: now() + a.dur * 1000, ready: now() + a.cd * 1000 };
  toast(`${a.name}! ${a.desc}`, 'epic');
  notify();
}

export function goFloor(delta) {
  const st = S();
  const f = st.floor + delta;
  if (f < 1 || f > st.maxFloor) return;
  st.floor = f; st.kills = 0; st.auto = delta > 0;
  spawnMonster();
}

// ---------- Реликвии и престиж ----------
export function relicCost(r) { return Math.ceil(r.base * r.growth ** relic(r.id)); }
export function buyRelic(r) {
  const st = S();
  if (relic(r.id) >= r.max) return;
  const c = relicCost(r);
  if (st.shards < c) return;
  st.shards -= c;
  st.relics[r.id] = relic(r.id) + 1;
  recalcGear();
  notify();
}
export function prestige() {
  const st = S();
  const gain = pendingShards();
  if (gain < 1) return 0;
  const keep = {
    shards: st.shards + gain, shardsTotal: st.shardsTotal + gain, relics: st.relics, campaigns: st.campaigns + 1,
    inv: st.inv, eq: st.eq, dust: st.dust, autoSalvage: st.autoSalvage, nextItemId: st.nextItemId,
    stats: st.stats, seen: st.seen, started: st.started,
  };
  G.S = Object.assign(freshState(), keep);
  const b = relic('banner');
  if (b) G.S.gold = 100 * 10 ** b;
  afterReset();
  return gain;
}
export function wipe() {
  G.S = freshState();
  afterReset();
}
function afterReset() {
  G.timers = {}; G.lastRolls = {};
  recalcGear();
  save();
  spawnMonster();
}

// ---------- Сундук ----------
export const chest = { visible: false, at: now() + rnd(40, 80) * 1000, gone: 0 };
function chestDelay() { return rnd(60, 140) * 1000 / (uq('ethereal') ? 2 : 1); }
function tickChest(t) {
  if (!chest.visible && t >= chest.at && S().maxFloor >= 3) { chest.visible = true; chest.gone = t + 15000; notify(); }
  else if (chest.visible && t >= chest.gone) { chest.visible = false; chest.at = t + chestDelay(); notify(); }
}
export function openChest() {
  chest.visible = false;
  chest.at = now() + chestDelay();
  const r = d(20);
  const income = Math.max(goldPerSec(), floorGold(S().floor) * 0.5);
  let gold = 0, item = false;
  if (r === 1) { /* мимик */ }
  else if (r < 10) gold = income * 30;
  else if (r < 17) gold = income * 120;
  else if (r < 20) { gold = income * 120; item = true; }
  else { gold = income * 600; item = true; }
  notify();
  return { r, gold, item };
}
export function claimChest(res) {
  if (res.r === 1) { spawnMonster(true); return; }
  earn(res.gold);
  if (res.item) dropItem(S().floor, luck() + (res.r === 20 ? 4 : 1), true, res.r === 20 ? 3 : 1);
  notify();
}

// ---------- Цикл ----------
let last = performance.now();
let notifyT = 0;
function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.25);
  last = t;
  const tm = now();
  const st = S();
  HEROES.forEach((h, i) => {
    if (!st.heroes[h.id]) { G.timers[h.id] = 0; return; }
    const iv = heroInterval(h);
    let p = (G.timers[h.id] || 0) + dt / iv;
    if (p >= 1) { p -= 1; if (p > 1) p = 0; heroAttack(h, i); }
    G.timers[h.id] = p;
  });
  const M = G.M;
  if (M && M.tier && !M.dead && tm >= M.bossEnd) bossFailed();
  tickChest(tm);
  notifyT += dt;
  if (notifyT > 0.12) { notifyT = 0; notify(); }
  requestAnimationFrame(frame);
}

// ---------- Сохранение ----------
export function save() {
  S().lastSave = now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S())); } catch { /* хранилище недоступно */ }
}
function load() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { data = null; }
  if (!data) {
    // перенос со старой версии
    try {
      const old = JSON.parse(localStorage.getItem(OLD_SAVE_KEY));
      if (old) data = { gold: old.gold, floor: old.floor, maxFloor: old.maxFloor, heroes: old.heroes, str: old.str,
        dieTier: old.dieTier, acc: old.acc, tactic: old.tactic, shards: old.shards, shardsTotal: old.shards, lastSave: old.lastSave };
    } catch { /* пусто */ }
  }
  if (!data) return null;
  const base = freshState();
  const st = Object.assign(base, data);
  st.heroes = Object.assign(base.heroes, data.heroes || {});
  st.eq = Object.assign(base.eq, data.eq || {});
  st.stats = Object.assign(base.stats, data.stats || {});
  st.seen = Object.assign(base.seen, data.seen || {});
  st.stats.bestFloor = Math.max(st.stats.bestFloor, st.maxFloor);
  G.S = st;
  recalcGear();
  if (bossTier(st.floor) && st.floor === st.maxFloor) st.floor = Math.max(1, st.floor - 1);
  const away = Math.min((now() - (data.lastSave || now())) / 1000, OFFLINE_CAP);
  if (away > 30) {
    const gold = goldPerSec() * away;
    // офлайн-лут: в среднем один предмет за каждые ~3 минуты
    const drops = Math.min(20, Math.floor(away / 180 * (partyDps() > 0 ? 1 : 0)));
    if (gold > 0) earn(gold);
    return { away, gold, drops };
  }
  return null;
}

export function start() {
  const offline = load();
  spawnMonster();
  requestAnimationFrame(frame);
  setInterval(save, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('pagehide', save);
  if (offline) {
    const items = [];
    for (let i = 0; i < offline.drops; i++) items.push(dropItemQuiet());
    setTimeout(() => emit('offline', { ...offline, items }), 300);
  }
  // для отладки из консоли
  window.G = G;
  window.DOF = { G, dropItem, spawnMonster, notify };
}
function dropItemQuiet() {
  const st = S();
  const rr = rollRarity(luck(), false, 0);
  const item = makeItem(st.nextItemId++, st.floor, rr.rar);
  st.stats.items++;
  if (rr.rar <= st.autoSalvage || st.inv.length >= invCap()) { st.dust += salvageValue(item); return { item, salvaged: true }; }
  st.inv.unshift(item);
  return { item };
}

export { RARITIES, SLOTS, itemPower, upgradeCost, upgradeDC, salvageValue };
