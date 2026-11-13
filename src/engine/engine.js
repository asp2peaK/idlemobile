// =============== Игровой движок (2.0) ===============
import {
  HEROES, HERO_GROWTH, HERO_MILESTONES, PLAYER_DICE, ABILITIES, KILLS_PER_FLOOR, BOSS_TIME, PRESTIGE_FLOOR,
  OFFLINE_CAP, TRAITS, TALENT_TREES, CONTRACTS, CURSES, VERSION,
} from './data.js';
import { makeMonsterSpec, bossTier, biomeOf } from './monsters.js';
import { makeItem, rollRarity, gearTotals, salvageValue, upgradeCost, upgradeDC, RARITIES, SLOTS, itemPower } from './loot.js';

const SAVE_KEY = 'dice-fate-v2';
const OLD_SAVE_KEY = 'dice-fate-v1';

export const d = sides => 1 + Math.floor(Math.random() * sides);
const now = () => Date.now();
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

export function bulk(base, growth, lvl, k) { return base * growth ** lvl * (growth ** k - 1) / (growth - 1); }
export function maxBuy(base, growth, lvl, gold) {
  const k = Math.floor(Math.log(gold * (growth - 1) / (base * growth ** lvl) + 1) / Math.log(growth));
  return Math.max(0, k);
}

// ---------- Состояние ----------
function freshState() {
  return {
    v: 3, ver: VERSION,
    gold: 0, floor: 1, maxFloor: 1, kills: 0, auto: true, hpFrac: 1,
    heroes: Object.fromEntries(HEROES.map(h => [h.id, 0])),
    str: 0, dieTier: 0, acc: 0, tactic: 0,
    lvl: 1, xp: 0, talents: {},
    abil: {},
    shards: 0, shardsTotal: 0, relics: {}, campaigns: 0, curses: [],
    inv: [], eq: Object.fromEntries(SLOTS.map(s => [s.id, null])), dust: 0, autoSalvage: -1, nextItemId: 1,
    contracts: [], contractsDone: 0,
    stats: { gold: 0, rolls: 0, nat20: 0, nat1: 0, kills: 0, bosses: 0, items: 0, legendaries: 0, bestFloor: 1, upgrades: 0,
      blocks: 0, weak: 0, deaths: 0, traitKills: 0 },
    seen: { biomes: [0], uniques: [], traits: [] },
    started: now(), lastSave: now(),
  };
}

export const G = {
  S: freshState(),
  M: null,
  timers: {}, lastRolls: {},
  tapRoll: { r: 20, text: 'Тапай!', n: 0 },
  buyMode: 1,
  gear: gearTotals({}),
  weak: null,          // слабое место {x, y, until}
  weakAt: now() + 8000,
  restUntil: 0,        // отряд отдыхает после поражения
  vulnUntil: 0,        // монстр уязвим (после слабого места)
  counter: false,      // следующий тап — гарантированный крит (после блока)
  version: 0,
  showChangelog: false,
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
export const tal = id => S().talents[id] || 0;
export const cursed = id => S().curses.includes(id);
export const abilOn = id => (S().abil[id]?.until || 0) > now();
const uq = id => G.gear.uniques.has(id);
function recalcGear() { G.gear = gearTotals(cursed('naked') ? {} : S().eq); }

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
  return (1 + relic('blade') * 0.2) * (1 + S().heroes.bard * 0.01) * (1 + G.gear.dmg / 100);
}
export function bossMul() { return G.M?.tier ? (1 + tal('execute') * 0.2) * (uq('holy') ? 2.5 : 1) : 1; }
export function vulnMul() { return G.vulnUntil > now() ? 1.5 : 1; }
export function partyMul(h) {
  let m = dmgMul() * (1 + G.gear.party / 100) * (1 + tal('cry') * 0.05) * (abilOn('rage') ? 2 : 1);
  if (h) m *= 1 + (G.gear.cls[h.id] || 0) / 100;
  return m;
}
export function tapMul() { return dmgMul() * (1 + G.gear.tap / 100) * (1 + tal('power') * 0.15); }
export function goldMul() {
  let m = (1 + relic('greed') * 0.15) * (1 + S().heroes.cleric * 0.02) * (1 + G.gear.gold / 100) * (1 + tal('goldh') * 0.08);
  if (abilOn('midas')) m *= 3;
  if (uq('midas')) m *= 1.5;
  if (cursed('greedy')) m *= 0.5;
  return m;
}
export function luck() { return relic('luck') + G.gear.luck + (uq('fortune') ? 3 : 0) + tal('lucky'); }
export function critBonus() { return G.gear.critRange + (uq('shadow') ? 2 : 0); }
export function critDmgMul() { return (1 + G.gear.critDmg / 100) * (uq('vorpal') ? 3 : 1); }
export function speedMul() { return 1 + Math.min(G.gear.speed, 150) / 100 + (uq('haste') ? 0.25 : 0); }
export function bossTime() { return Math.max(10, BOSS_TIME + relic('hourglass') * 3 + G.gear.bossTime + (uq('dragonhelm') ? 10 : 0) - (cursed('rush') ? 10 : 0)); }
export function killsPerFloor() { return uq('leagues') ? 5 : KILLS_PER_FLOOR; }
export function invCap() { return 30 + relic('bag') * 10; }
const rollPenalty = () => (cursed('unlucky') ? 2 : 0);

export function heroHit(h) { return h.hit + Math.floor(S().heroes[h.id] / 4) + G.gear.hit + (uq('mithril') ? 3 : 0) - rollPenalty(); }
export function heroCritMin(h) { return Math.max(12, (h.critMin || 20) - critBonus()); }
export function heroInterval(h) { return h.int / speedMul(); }
export function heroPower(h) { return h.power * heroMul(S().heroes[h.id]); }
export function heroCost(h, k) { return bulk(h.cost * 0.95 ** relic('tome'), HERO_GROWTH, S().heroes[h.id], k); }
export function heroBuyK(h) {
  if (G.buyMode === 'max') return Math.max(1, maxBuy(h.cost * 0.95 ** relic('tome'), HERO_GROWTH, S().heroes[h.id], S().gold));
  return G.buyMode;
}

// ---------- Монстры: формулы ----------
export const HP_GROWTH = 1.5;
export function floorAC(f) { return Math.min(30, 8 + Math.floor(f / 3)); }
const BOSS_HP = [1, 8, 10, 15];
const BOSS_GOLD = [1, 5, 7, 12];
const BOSS_DMG = [1, 2, 2.5, 3.5];
const BOSS_XP = [1, 4, 8, 20];
export function floorHP(f) { return Math.ceil(10 * HP_GROWTH ** (f - 1)) * (cursed('thick') ? 2 : 1); }
export function floorGold(f) { return Math.ceil(10 * HP_GROWTH ** (f - 1) / 5); }
export function monsterAtk(f) { return Math.min(26, 2 + Math.floor(f / 4)); }
export function monsterHitDmg(f, tier = 0) { return 10 * HP_GROWTH ** (f - 1) * 0.22 * BOSS_DMG[tier] * (cursed('fierce') ? 2 : 1); }
export function blockDC() { return Math.min(24, 10 + Math.floor(S().floor / 10) + (G.M?.tier || 0)); }
export function blockBonus() { return 2 + tal('parry') * 2 + Math.floor(S().acc / 3); }

// ---------- Отряд: ХП и КД ----------
function rawPartyDps() {
  return HEROES.reduce((s, h) => s + (S().heroes[h.id] ? h.n * (h.die + 1) / 2 * heroPower(h) / h.int : 0), 0);
}
export function partyMaxHP() {
  const base = 40 + 6 * rawPartyDps() + 10 * tapPower();
  return base * (1 + G.gear.hp / 100) * (1 + relic('aegis') * 0.2) * (1 + tal('fort') * 0.1) * (1 + S().heroes.barbarian * 0.01);
}
export function partyAC() {
  return 10 + Math.floor(S().heroes.paladin / 10) + G.gear.ac + tal('shield') + Math.floor(S().heroes.fighter / 25);
}
export function partyHP() { return S().hpFrac * partyMaxHP(); }
function healParty(amount) {
  const max = partyMaxHP();
  S().hpFrac = Math.min(1, S().hpFrac + amount / max);
}
function healPct(p) { S().hpFrac = Math.min(1, S().hpFrac + p); }

export function hitChance(bonus, ac, adv) {
  const p = Math.min(0.95, Math.max(0.05, (21 - (ac - bonus)) / 20));
  return adv ? 1 - (1 - p) ** 2 : p;
}
export function heroDps(h, ac = G.M?.ac ?? floorAC(S().floor)) {
  if (!S().heroes[h.id]) return 0;
  const adv = h.adv || abilOn('adv');
  let p = h.auto ? 1 : hitChance(heroHit(h), ac, adv);
  if (!h.auto && G.M?.traits?.includes('ghostly')) p *= 0.5;
  let c = h.auto ? 0 : (21 - heroCritMin(h)) / 20;
  if (adv) c = 1 - (1 - c) ** 2;
  const avg = h.n * (h.die + 1) / 2 * heroPower(h);
  const critM = (h.critMul || 2) * critDmgMul();
  const echo = uq('echo') ? 1.15 : 1;
  return p * avg * (1 + c * (critM - 1)) / heroInterval(h) * partyMul(h) * echo * bossMul();
}
export function partyDps(ac) { return HEROES.reduce((s, h) => s + heroDps(h, ac), 0); }

export function playerDie() { return PLAYER_DICE[S().dieTier]; }
export function playerHit() { return 2 + S().acc + Math.floor(S().str / 10) + G.gear.hit - rollPenalty(); }
export function tapPower() { return (1 + S().str) * 2 ** Math.floor(S().str / 25); }
export function tapCritMin() { return 20 - critBonus() - tal('eye'); }
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
export function curseMul(list = S().curses) { return 1 + list.reduce((s, id) => s + (CURSES.find(c => c.id === id)?.bonus || 0), 0); }
export function pendingShards() {
  if (S().maxFloor < PRESTIGE_FLOOR) return 0;
  return Math.floor(((S().maxFloor - 20) / 10) ** 1.8 * (1 + relic('prism') * 0.1) * curseMul());
}

// ---------- Опыт и таланты ----------
export function xpNeed(l = S().lvl) { return Math.ceil(15 * 1.2 ** l); }
export function talentPoints() {
  const spent = Object.values(S().talents).reduce((a, b) => a + b, 0);
  return S().lvl - 1 - spent;
}
function gainXp(x) {
  const st = S();
  st.xp += x * (1 + relic('scholar') * 0.25);
  let ups = 0;
  while (st.xp >= xpNeed()) { st.xp -= xpNeed(); st.lvl++; ups++; }
  if (ups) { toast(`Уровень ${st.lvl}! +${ups} очк. таланта`, 'epic'); emit('levelup', st.lvl); }
}
export function learnTalent(tree, t) {
  if (talentPoints() < 1 || tal(t.id) >= t.max) return;
  S().talents[t.id] = tal(t.id) + 1;
  recalcGear();
  notify();
}
export function respecTalents() {
  S().talents = {};
  notify();
}

// ---------- Контракты ----------
function newContract(exclude = []) {
  const st = S();
  const pool = CONTRACTS.filter(c => !exclude.includes(c.id));
  const c = pick(pool);
  const target = Math.ceil(c.base + c.per * st.stats.bestFloor);
  const f = st.stats.bestFloor;
  const roll = Math.random();
  let reward;
  if (roll < 0.12 && f >= 25) reward = { kind: 'shards', amount: 1 + Math.floor(f / 50) };
  else if (roll < 0.4) reward = { kind: 'item', rar: f >= 60 ? 3 : 2 };
  else if (roll < 0.7) reward = { kind: 'dust', amount: Math.ceil((25 + f * 4) * rnd(0.8, 1.3)) };
  else reward = { kind: 'gold', secs: 240 };
  return { uid: Math.random().toString(36).slice(2), id: c.id, target, prog: 0, reward };
}
function ensureContracts() {
  const st = S();
  while (st.contracts.length < 3) st.contracts.push(newContract(st.contracts.map(c => c.id)));
}
function track(id, n = 1) {
  S().contracts.forEach(c => {
    if (c.id === id && c.prog < c.target) {
      c.prog = Math.min(c.target, c.prog + n);
      if (c.prog >= c.target) toast('Контракт выполнен! Загляни в таверну', 'gold');
    }
  });
}
export function claimContract(uid) {
  const st = S();
  const i = st.contracts.findIndex(c => c.uid === uid);
  const c = st.contracts[i];
  if (!c || c.prog < c.target) return null;
  const r = c.reward;
  let res = { ...r };
  if (r.kind === 'shards') { st.shards += r.amount; st.shardsTotal += r.amount; }
  if (r.kind === 'dust') st.dust += r.amount;
  if (r.kind === 'gold') { res.gold = Math.max(goldPerSec(), floorGold(st.floor)) * r.secs; earn(res.gold); }
  if (r.kind === 'item') dropItem(st.stats.bestFloor, luck() + 3, true, r.rar);
  st.contracts.splice(i, 1, newContract(st.contracts.map(x => x.id)));
  st.contractsDone++;
  notify();
  return res;
}
export function rerollCost() { return Math.ceil(5 + S().stats.bestFloor / 4); }
export function rerollContract(uid) {
  const st = S();
  const i = st.contracts.findIndex(c => c.uid === uid);
  if (i < 0 || st.dust < rerollCost()) return;
  st.dust -= rerollCost();
  st.contracts.splice(i, 1, newContract(st.contracts.map(x => x.id)));
  notify();
}

function rollD20(adv) {
  const a = d(20);
  return adv ? Math.max(a, d(20)) : a;
}
function earn(g) { S().gold += g; S().stats.gold += g; }

// ---------- Монстры ----------
function rollTraits(f, tier) {
  if (f < 6) return [];
  let n = tier >= 3 ? 3 : tier;
  if (!tier && Math.random() < Math.min(0.3, 0.08 + f / 400)) n = 1;
  const pool = TRAITS.map(t => t.id);
  const out = [];
  for (let i = 0; i < n; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}
export function spawnMonster(mimic) {
  const st = S();
  const f = st.floor;
  const m = makeMonsterSpec(f, { mimic });
  const tier = m.tier;
  const traits = mimic ? ['brute'] : rollTraits(f, tier);
  traits.forEach(t => { if (!st.seen.traits.includes(t)) st.seen.traits.push(t); });
  const hp = floorHP(f) * BOSS_HP[tier] * (mimic ? 3 : 1);
  G.M = {
    uid: Math.random(),
    name: m.name, spec: m.spec, tier, mimic: !!mimic, biome: m.biome, circle: m.circle, traits,
    hp, maxHp: hp,
    ac: floorAC(f) + (tier ? tier + 1 : 0) + (traits.includes('armored') ? 4 : 0),
    atk: monsterAtk(f) + tier,
    atkInt: (tier ? 1.9 : 2.3) / (traits.includes('frenzy') ? 2 : 1),
    atkT: 1.2,
    atkCount: 0,
    charge: null, stunUntil: 0,
    gold: floorGold(f) * BOSS_GOLD[tier] * (mimic ? 25 : 1),
    bossEnd: tier ? now() + bossTime() * 1000 : 0,
    bossDur: tier ? bossTime() : 0,
    dead: false,
  };
  G.weak = null;
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
  amount *= bossMul() * vulnMul();
  M.hp -= amount;
  emit('hit', { ...info, amount });
  if (M.hp <= 0) kill();
}

function kill() {
  const st = S(), M = G.M;
  M.dead = true; M.hp = 0; M.charge = null;
  G.weak = null;
  const g = M.gold * goldMul();
  earn(g);
  st.stats.kills++;
  track('kills');
  if (M.traits.length) { st.stats.traitKills++; track('traits'); }
  gainXp((2 + st.floor * 0.4) * BOSS_XP[M.tier] * (M.mimic ? 5 : 1));
  healPct(0.1 + tal('second') * 0.04 + G.gear.regen / 100);
  emit('kill', { gold: g });
  if (M.tier) { st.stats.bosses++; track('bosses'); }
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
      if (st.maxFloor === PRESTIGE_FLOOR) setTimeout(() => toast('Доступна Новая кампания!', 'epic'), 1200);
    }
    if (st.kills >= need && st.auto && st.floor < st.maxFloor) { st.floor++; st.kills = 0; }
  }
  setTimeout(() => spawnMonster(), 380);
  notify();
}

function retreat(msg) {
  toast(msg, 'bad');
  const st = S();
  st.auto = false;
  st.floor = Math.max(1, st.floor - 1);
  st.kills = 0;
  spawnMonster();
}
function bossFailed() { retreat(`${G.M.name} слишком силён! Отступаем и качаемся`); }
function partyFell() {
  S().stats.deaths++;
  G.restUntil = now() + 5000;
  emit('death');
  retreat('Отряд пал! Отступаем на этаж назад и отдыхаем');
}

// ---------- Атаки монстра ----------
function monsterAttack(heavy) {
  const M = G.M, st = S();
  const r = d(20);
  const ac = partyAC();
  let dmg = monsterHitDmg(st.floor, M.tier) * rnd(0.6, 1.4) * (M.traits.includes('brute') ? 1.8 : 1);
  if (heavy) {
    dmg *= 3;
    if (M.charge?.failed) dmg *= 0.5;
  } else if (r === 1 || (r !== 20 && r + M.atk < ac)) {
    emit('mhit', { miss: true, r, ac });
    return;
  }
  if (r === 20 && !heavy) dmg *= 2;
  const before = st.hpFrac;
  st.hpFrac -= dmg / partyMaxHP();
  if (M.traits.includes('vampire')) M.hp = Math.min(M.maxHp, M.hp + M.maxHp * 0.03);
  emit('mhit', { dmg, heavy, crit: r === 20, r, ac, halved: !!M.charge?.failed });
  if (st.hpFrac <= 0 && before > 0) { st.hpFrac = 0; partyFell(); }
}

export function blockAttack() {
  const M = G.M;
  if (!M?.charge || M.charge.tried) return;
  M.charge.tried = true;
  const r = d(20);
  const total = r + blockBonus();
  const dc = blockDC();
  const ok = r === 20 || (r !== 1 && total >= dc);
  if (ok) {
    M.charge = null;
    M.stunUntil = now() + 2500;
    M.atkT = M.atkInt;
    G.counter = true;
    S().stats.blocks++;
    track('blocks');
    toast(`Блок! ${r}+${blockBonus()} ≥ ${dc} — враг оглушён, следующий тап крит`, 'gold');
  } else {
    M.charge.failed = true;
    toast(`Блок не удался: ${r}+${blockBonus()} < ${dc}. Урон вдвое меньше`, 'bad');
  }
  emit('block', { ok, r, dc });
  notify();
}

// ---------- Слабые места ----------
function tickWeak(t) {
  const M = G.M;
  if (G.weak && t >= G.weak.until) G.weak = null;
  if (!G.weak && M && !M.dead && t >= G.weakAt) {
    G.weakAt = t + rnd(7, 14) * 1000 / (1 + tal('weak') * 0.15);
    if (!M.traits.includes('evasive') && S().maxFloor >= 3) {
      G.weak = { x: rnd(28, 72), y: rnd(22, 68), until: t + 2300, id: Math.random() };
    }
  }
}
export function hitWeak() {
  const M = G.M;
  if (!G.weak || !M || M.dead) return;
  G.weak = null;
  S().stats.weak++;
  track('weak');
  const pd = playerDie();
  let sum = 0;
  for (let i = 0; i < pd.n; i++) sum += pd.d;  // максимальный бросок
  const dmg = (sum * tapPower() + partyDps() * S().tactic * 0.02) * tapMul() * 5 * (1 + tal('weak') * 0.5) * critDmgMul();
  G.vulnUntil = now() + 4000;
  G.tapRoll = { r: 20, text: 'СЛАБОЕ МЕСТО! ×5', n: G.tapRoll.n + 1 };
  damage(dmg, { src: 'tap', crit: true, weak: true, roll: 20 });
  notify();
}

// ---------- Лут ----------
function maybeDrop(M) {
  const chance = (M.tier ? 1 : M.mimic ? 1 : 0.03) * (1 + G.gear.loot / 100 + tal('scav') * 0.12);
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
  track('items');
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
  if (cursed('naked')) { toast('Проклятие Наготы: снаряжение надеть нельзя', 'bad'); return; }
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
  if (ok) { item.plus++; st.stats.upgrades++; track('upgrade'); recalcGear(); }
  notify();
  return { r, dc, ok, plus: item.plus };
}

// ---------- Атаки отряда ----------
function heroAttack(h, idx, echo) {
  const M = G.M;
  if (!M || M.dead) return;
  const adv = h.adv || abilOn('adv');
  const r = rollD20(adv);
  S().stats.rolls++;
  if (h.heal) healParty(partyMaxHP() * Math.min(0.08, (0.012 + S().heroes[h.id] * 0.0004) * h.heal));
  const ghost = !h.auto && M.traits.includes('ghostly') && Math.random() < 0.5;
  if (!h.auto && (r === 1 || ghost || (r !== 20 && r + heroHit(h) < M.ac))) {
    G.lastRolls[h.id] = { r, miss: true, ghost };
    emit('hit', { src: h.id, miss: true, ghost, roll: r, idx });
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
  if (r === 20) { st.stats.nat20++; track('nat20'); }
  if (r === 1) st.stats.nat1++;
  const pd = playerDie();
  const hit = playerHit();
  const counter = G.counter;
  const ghost = !counter && M.traits.includes('ghostly') && Math.random() < 0.5;
  if (!counter && (r === 1 || ghost || (r !== 20 && r + hit < M.ac))) {
    G.tapRoll = { r, text: r === 1 ? 'Нат. 1 — провал!' : ghost ? 'Удар прошёл насквозь' : `${r}+${hit} < КД ${M.ac}`, n: G.tapRoll.n + 1 };
    emit('hit', { src: 'tap', miss: true, roll: r, fumble: r === 1, ghost });
    notify();
    return;
  }
  G.counter = false;
  let sum = 0;
  for (let i = 0; i < pd.n; i++) sum += d(pd.d);
  const crit = counter || r >= tapCritMin();
  const dmg = (sum * tapPower() + partyDps() * st.tactic * 0.02) * tapMul() * (crit ? 2 * critDmgMul() : 1);
  G.tapRoll = { r, text: counter ? 'КОНТРАТАКА!' : crit ? (r === 20 ? 'НАТУРАЛЬНАЯ 20!' : 'КРИТ!') : `${r}+${hit} · ${pd.n}d${pd.d}: ${sum}`, n: G.tapRoll.n + 1 };
  if (M.traits.includes('thorns')) {
    st.hpFrac = Math.max(0.01, st.hpFrac - 0.01);
    emit('mhit', { dmg: partyMaxHP() * 0.01, thorns: true });
  }
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
    lvl: () => S().str, cost: k => bulk(10, 1.09, S().str, k), maxK: () => maxBuy(10, 1.09, S().str, S().gold),
    buy: k => { S().str += k; } },
  { id: 'die', icon: 'd20', name: 'Кубик урона', c: '#a060e8', max: PLAYER_DICE.length - 1,
    info: () => { const n = PLAYER_DICE[S().dieTier + 1]; const p = playerDie(); return `Сейчас ${p.n}d${p.d}` + (n ? ` → ${n.n}d${n.d}` : ' (максимум)'); },
    lvl: () => S().dieTier, cost: () => (PLAYER_DICE[S().dieTier + 1]?.cost ?? Infinity) * 3, buy: () => { S().dieTier++; } },
  { id: 'acc', icon: 'target', name: 'Ловкость', c: '#62a850', max: 15,
    info: () => `+${S().acc} к атаке (всего +${playerHit()}), +${Math.floor(S().acc / 3)} к блоку`,
    lvl: () => S().acc, cost: () => 150 * 4.5 ** S().acc, buy: () => { S().acc++; } },
  { id: 'tactic', icon: 'scroll', name: 'Тактика', c: '#e6b440', max: 50,
    info: () => `Тап добавляет ${S().tactic * 2}% урона/сек отряда`,
    lvl: () => S().tactic, cost: () => 800 * 2.8 ** S().tactic, buy: () => { S().tactic++; } },
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
export function heirSlots() { return 1 + relic('heir'); }

// keepIds — фамильные вещи, curses — проклятия новой кампании
export function prestige(keepIds = [], curses = []) {
  const st = S();
  const gain = pendingShards();
  if (gain < 1) return 0;
  const all = [...Object.values(st.eq).filter(Boolean), ...st.inv];
  const kept = all.filter(it => keepIds.includes(it.id)).slice(0, heirSlots());
  const keep = {
    shards: st.shards + gain, shardsTotal: st.shardsTotal + gain, relics: st.relics, campaigns: st.campaigns + 1,
    dust: Math.floor(st.dust * 0.5), autoSalvage: st.autoSalvage, nextItemId: st.nextItemId,
    stats: st.stats, seen: st.seen, started: st.started, contracts: st.contracts, contractsDone: st.contractsDone,
    curses: curses.slice(),
  };
  G.S = Object.assign(freshState(), keep);
  kept.forEach(it => { it.heir = true; G.S.eq[it.slot] ? G.S.inv.push(it) : (G.S.eq[it.slot] = it); });
  afterReset();
  return gain;
}
export function wipe() {
  G.S = freshState();
  afterReset();
}
function afterReset() {
  G.timers = {}; G.lastRolls = {}; G.restUntil = 0; G.counter = false;
  recalcGear();
  ensureContracts();
  save();
  spawnMonster();
}

// ---------- Сундук ----------
export const chest = { visible: false, at: now() + rnd(40, 80) * 1000, gone: 0 };
function chestDelay() { return rnd(70, 160) * 1000 / (uq('ethereal') ? 2 : 1); }
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
  else if (r < 10) gold = income * 20;
  else if (r < 17) gold = income * 60;
  else if (r < 20) { gold = income * 60; item = true; }
  else { gold = income * 240; item = true; }
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
  const M = G.M;
  const resting = G.restUntil > tm;

  if (resting) healPct(dt / 5);
  else {
    healPct(dt * 0.005);
    HEROES.forEach((h, i) => {
      if (!st.heroes[h.id]) { G.timers[h.id] = 0; return; }
      const iv = heroInterval(h);
      let p = (G.timers[h.id] || 0) + dt / iv;
      if (p >= 1) { p -= 1; if (p > 1) p = 0; heroAttack(h, i); }
      G.timers[h.id] = p;
    });
  }

  if (M && !M.dead) {
    if (M.traits.includes('regen')) M.hp = Math.min(M.maxHp, M.hp + M.maxHp * 0.02 * dt);
    // Атаки монстра
    if (!resting && tm >= M.stunUntil) {
      if (M.charge) {
        if (tm >= M.charge.end) { monsterAttack(true); M.charge = null; M.atkT = 0; }
      } else {
        M.atkT += dt;
        if (M.atkT >= M.atkInt) {
          M.atkT = 0;
          M.atkCount++;
          const heavy = st.maxFloor >= 4 && (M.tier ? M.atkCount % 4 === 0 : Math.random() < 0.1);
          if (heavy) {
            const dur = M.tier ? 2200 : 2600;
            M.charge = { start: tm, end: tm + dur, dur };
            emit('charge');
          } else monsterAttack(false);
        }
      }
    }
    if (M.tier && tm >= M.bossEnd) bossFailed();
  }
  tickWeak(tm);
  tickChest(tm);
  notifyT += dt;
  if (notifyT > 0.1) { notifyT = 0; notify(); }
  requestAnimationFrame(frame);
}

// Самый глубокий этаж, где отряд выживает и успевает убивать (для переноса старых сохранений)
export function safeFloor() {
  const st = S();
  for (let f = st.maxFloor; f > 1; f--) {
    const ac = floorAC(f);
    const dps = partyDps(ac) + tapAvg() * hitChance(playerHit(), ac, false) * 2;
    const ttk = floorHP(f) / Math.max(dps, 1e-9);
    const mdps = monsterHitDmg(f) * hitChance(monsterAtk(f), partyAC(), false) / 2.3 * 1.25;
    if (ttk < partyMaxHP() / Math.max(mdps, 1e-9) && ttk < 4) return f;
  }
  return 1;
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
    try {
      const old = JSON.parse(localStorage.getItem(OLD_SAVE_KEY));
      if (old) data = { gold: old.gold, floor: old.floor, maxFloor: old.maxFloor, heroes: old.heroes, str: old.str,
        dieTier: old.dieTier, acc: old.acc, tactic: old.tactic, shards: old.shards, shardsTotal: old.shards, lastSave: old.lastSave };
    } catch { /* пусто */ }
  }
  if (!data) { G.showChangelog = false; return null; }
  const def = freshState();
  const st = Object.assign(freshState(), data);
  st.heroes = { ...def.heroes, ...(data.heroes || {}) };
  st.eq = { ...def.eq, ...(data.eq || {}) };
  st.stats = { ...def.stats, ...(data.stats || {}) };
  st.seen = { ...def.seen, ...(data.seen || {}) };
  st.seen.traits = st.seen.traits || [];
  st.inv = data.inv || [];
  st.abil = data.abil || {};
  st.talents = data.talents || {};
  st.curses = data.curses || [];
  st.contracts = data.contracts || [];
  st.stats.bestFloor = Math.max(st.stats.bestFloor, st.maxFloor);
  if (data.ver !== VERSION) {
    G.showChangelog = true;
    st.ver = VERSION;
    // 2.0: реликвии подорожали — старые уровни возвращаются осколками
    if ((data.v || 2) < 3 && data.relics) {
      const refund = Object.values(data.relics).reduce((a, l) => a + l * 2, 0);
      st.relics = {};
      st.shards += refund;
    }
    st.hpFrac = 1;
  }
  G.S = st;
  recalcGear();
  if (G.showChangelog) {
    const sf = safeFloor();
    if (sf < st.floor) { st.floor = sf; st.auto = false; st.kills = 0; }
  }
  if (bossTier(st.floor) && st.floor === st.maxFloor) st.floor = Math.max(1, st.floor - 1);
  const away = Math.min((now() - (data.lastSave || now())) / 1000, OFFLINE_CAP);
  if (away > 30) {
    const gold = goldPerSec() * away;
    const drops = Math.min(15, Math.floor(away / 300 * (partyDps() > 0 ? 1 : 0)));
    if (gold > 0) earn(gold);
    st.hpFrac = 1;
    return { away, gold, drops };
  }
  return null;
}

export function start() {
  const offline = load();
  ensureContracts();
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
  if (G.showChangelog) setTimeout(() => emit('changelog'), offline ? 1500 : 400);
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
