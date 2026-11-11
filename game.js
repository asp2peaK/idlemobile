'use strict';

// ---------- Данные ----------
const BUILDINGS = [
  { id: 'peasant',  name: 'Крестьянин',   icon: '👨‍🌾', cost: 15,      gps: 0.1,    desc: 'Платит скромную подать' },
  { id: 'farm',     name: 'Ферма',        icon: '🌾', cost: 100,     gps: 1,      desc: 'Зерно на продажу' },
  { id: 'mill',     name: 'Лесопилка',    icon: '🪓', cost: 1100,    gps: 8,      desc: 'Доски для всего королевства' },
  { id: 'quarry',   name: 'Каменоломня',  icon: '⛏️', cost: 12000,   gps: 47,     desc: 'Камень для стен' },
  { id: 'smithy',   name: 'Кузница',      icon: '⚒️', cost: 130000,  gps: 260,    desc: 'Мечи и подковы' },
  { id: 'market',   name: 'Рынок',        icon: '🏪', cost: 1.4e6,   gps: 1400,   desc: 'Купцы со всех земель' },
  { id: 'tavern',   name: 'Таверна',      icon: '🍺', cost: 2e7,     gps: 7800,   desc: 'Эль течёт рекой' },
  { id: 'cathedral',name: 'Собор',        icon: '⛪', cost: 3.3e8,   gps: 44000,  desc: 'Десятина с паломников' },
  { id: 'castle',   name: 'Замок',        icon: '🏯', cost: 5.1e9,   gps: 260000, desc: 'Оплот твоей власти' },
  { id: 'dragon',   name: 'Логово дракона', icon: '🐉', cost: 7.5e10, gps: 1.6e6, desc: 'Дракон охраняет казну... и множит её' },
];
const COST_GROWTH = 1.15;

const UPGRADE_TIERS = [
  { need: 10,  costMul: 10,    title: 'Мастера' },
  { need: 25,  costMul: 50,    title: 'Гильдия' },
  { need: 50,  costMul: 500,   title: 'Королевская хартия' },
  { need: 100, costMul: 5000,  title: 'Легендарные' },
  { need: 150, costMul: 5e5,   title: 'Магия' },
];

const TAP_UPGRADES = [
  { id: 'tap1', name: 'Кожаный кошель',      icon: '👝', cost: 100,    desc: 'Сила тапа ×2' },
  { id: 'tap2', name: 'Сборщик налогов',     icon: '📜', cost: 1000,   desc: 'Сила тапа ×2' },
  { id: 'tap3', name: 'Железная перчатка',   icon: '🧤', cost: 25000,  desc: 'Тап даёт +2% от дохода/сек' },
  { id: 'tap4', name: 'Королевский указ',    icon: '📯', cost: 5e5,    desc: 'Тап даёт ещё +3% от дохода/сек' },
  { id: 'tap5', name: 'Скипетр',             icon: '🔱', cost: 2e7,    desc: 'Сила тапа ×3' },
  { id: 'tap6', name: 'Корона власти',       icon: '👑', cost: 5e9,    desc: 'Тап даёт ещё +5% от дохода/сек' },
];

const GLOBAL_UPGRADES = [
  { id: 'g1', name: 'Дороги',          icon: '🛤️', cost: 5000,   desc: 'Весь доход +10%', mul: 1.1 },
  { id: 'g2', name: 'Монетный двор',   icon: '🪙', cost: 2e5,    desc: 'Весь доход +15%', mul: 1.15 },
  { id: 'g3', name: 'Ярмарка',         icon: '🎪', cost: 1e7,    desc: 'Весь доход +20%', mul: 1.2 },
  { id: 'g4', name: 'Банк тамплиеров', icon: '🏦', cost: 1e9,    desc: 'Весь доход +25%', mul: 1.25 },
  { id: 'g5', name: 'Империя',         icon: '🗺️', cost: 1e11,   desc: 'Весь доход +50%', mul: 1.5 },
];

const CROWN_BONUS = 0.1;          // +10% за каждую корону
const CROWN_DIVISOR = 1e6;        // короны = floor(sqrt(заработано / 1e6))
const OFFLINE_CAP = 8 * 3600;     // максимум 8 часов офлайна
const SAVE_KEY = 'kingdom-idle-v1';

// ---------- Состояние ----------
function freshState() {
  return {
    gold: 0,
    runEarned: 0,
    totalEarned: 0,
    taps: 0,
    owned: Object.fromEntries(BUILDINGS.map(b => [b.id, 0])),
    upgrades: {},
    crowns: 0,
    resets: 0,
    lastTick: Date.now(),
    started: Date.now(),
  };
}

let S = freshState();
let buyMode = 1;
const buffs = { prodMul: 1, prodUntil: 0, tapMul: 1, tapUntil: 0 };

// ---------- Формулы ----------
function bulkCost(b, n, k) {
  // сумма стоимостей с n-го по (n+k-1)-й экземпляр
  const r = COST_GROWTH;
  return b.cost * Math.pow(r, n) * (Math.pow(r, k) - 1) / (r - 1);
}
function maxAffordable(b, n, gold) {
  const r = COST_GROWTH;
  const k = Math.floor(Math.log(gold * (r - 1) / (b.cost * Math.pow(r, n)) + 1) / Math.log(r));
  return Math.max(0, k);
}
function buildingMul(b) {
  let m = 1;
  UPGRADE_TIERS.forEach((t, i) => { if (S.upgrades[b.id + '_' + i]) m *= 2; });
  return m;
}
function globalMul() {
  let m = 1 + S.crowns * CROWN_BONUS;
  GLOBAL_UPGRADES.forEach(u => { if (S.upgrades[u.id]) m *= u.mul; });
  if (Date.now() < buffs.prodUntil) m *= buffs.prodMul;
  return m;
}
function buildingGps(b) {
  return b.gps * S.owned[b.id] * buildingMul(b);
}
function baseGps() {
  let sum = 0;
  BUILDINGS.forEach(b => { sum += buildingGps(b); });
  return sum;
}
function gps() {
  return baseGps() * globalMul();
}
function tapValue() {
  let v = 1;
  if (S.upgrades.tap1) v *= 2;
  if (S.upgrades.tap2) v *= 2;
  if (S.upgrades.tap5) v *= 3;
  let pct = 0;
  if (S.upgrades.tap3) pct += 0.02;
  if (S.upgrades.tap4) pct += 0.03;
  if (S.upgrades.tap6) pct += 0.05;
  v += gps() * pct;
  v *= 1 + S.crowns * CROWN_BONUS;
  if (Date.now() < buffs.tapUntil) v *= buffs.tapMul;
  return v;
}
function pendingCrowns() {
  return Math.floor(Math.sqrt(S.runEarned / CROWN_DIVISOR));
}

function earn(x) {
  S.gold += x;
  S.runEarned += x;
  S.totalEarned += x;
}

// ---------- Формат чисел ----------
const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
function fmt(n) {
  if (!isFinite(n)) return '∞';
  if (n < 1000) {
    if (n < 10 && n % 1 !== 0) return n.toFixed(1);
    return Math.floor(n).toString();
  }
  const tier = Math.floor(Math.log10(n) / 3);
  if (tier >= SUFFIX.length) return n.toExponential(2);
  const v = n / Math.pow(1000, tier);
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + SUFFIX[tier];
}
function fmtTime(sec) {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  if (h) return `${h} ч ${m} мин`;
  if (m) return `${m} мин ${s} с`;
  return `${s} с`;
}

// ---------- DOM ----------
const $ = id => document.getElementById(id);
const el = {
  gold: $('gold'), gps: $('gps'), crowns: $('crowns'), tapValue: $('tapValue'),
  tapBtn: $('tapBtn'), merchant: $('merchant'),
  buildings: $('buildings'), upgrades: $('upgrades'), glory: $('glory'),
  toast: $('toast'), modal: $('modal'), modalBox: $('modalBox'),
};

const buildingCards = {};
function buildBuildingCards() {
  el.buildings.innerHTML = '';
  BUILDINGS.forEach(b => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="icon">${b.icon}</div>
      <div class="info">
        <div class="name">${b.name}</div>
        <div class="desc" data-r="desc"></div>
      </div>
      <div class="count" data-r="count">0</div>
      <button class="buy" data-r="buy"></button>`;
    const refs = {
      card,
      desc: card.querySelector('[data-r=desc]'),
      count: card.querySelector('[data-r=count]'),
      buy: card.querySelector('[data-r=buy]'),
    };
    refs.buy.addEventListener('click', () => buyBuilding(b));
    el.buildings.appendChild(card);
    buildingCards[b.id] = refs;
  });
}

function buyAmount(b) {
  const n = S.owned[b.id];
  if (buyMode === 'max') return Math.max(1, maxAffordable(b, n, S.gold));
  return buyMode;
}

function buyBuilding(b) {
  const k = buyAmount(b);
  const cost = bulkCost(b, S.owned[b.id], k);
  if (S.gold < cost) return;
  S.gold -= cost;
  S.owned[b.id] += k;
  if (S.owned[b.id] === k) toast(`${b.icon} Построено: ${b.name}!`);
  upgradesDirty = true;
  render();
}

// ----- Улучшения -----
function allUpgrades() {
  const list = [];
  TAP_UPGRADES.forEach(u => list.push({
    key: u.id, icon: u.icon, name: u.name, desc: u.desc, cost: u.cost,
    visible: () => S.totalEarned >= u.cost * 0.3,
  }));
  GLOBAL_UPGRADES.forEach(u => list.push({
    key: u.id, icon: u.icon, name: u.name, desc: u.desc, cost: u.cost,
    visible: () => S.totalEarned >= u.cost * 0.3,
  }));
  BUILDINGS.forEach(b => UPGRADE_TIERS.forEach((t, i) => list.push({
    key: b.id + '_' + i, icon: b.icon, name: `${b.name}: ${t.title}`,
    desc: `${b.name} ×2 к доходу (нужно ${t.need} шт.)`,
    cost: b.cost * t.costMul,
    visible: () => S.owned[b.id] >= t.need,
  })));
  return list;
}
const UPGRADES = allUpgrades();
let upgradesDirty = true;
let upgradeRefs = [];

function rebuildUpgrades() {
  upgradesDirty = false;
  const avail = UPGRADES.filter(u => !S.upgrades[u.key] && u.visible()).sort((a, b) => a.cost - b.cost);
  el.upgrades.innerHTML = '';
  upgradeRefs = [];
  if (!avail.length) {
    el.upgrades.innerHTML = '<div class="empty">Пока нечего улучшать.<br>Строй больше и копи золото!</div>';
    return;
  }
  avail.forEach(u => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="icon">${u.icon}</div>
      <div class="info"><div class="name">${u.name}</div><div class="desc">${u.desc}</div></div>
      <button class="buy">🪙 ${fmt(u.cost)}</button>`;
    const btn = card.querySelector('.buy');
    btn.addEventListener('click', () => {
      if (S.gold < u.cost) return;
      S.gold -= u.cost;
      S.upgrades[u.key] = true;
      toast(`${u.icon} ${u.name}`);
      upgradesDirty = true;
      render();
    });
    el.upgrades.appendChild(card);
    upgradeRefs.push({ u, btn });
  });
}
let lastVisibleCount = -1;
function checkUpgradeVisibility() {
  const n = UPGRADES.reduce((c, u) => c + (!S.upgrades[u.key] && u.visible() ? 1 : 0), 0);
  if (n !== lastVisibleCount) { lastVisibleCount = n; upgradesDirty = true; }
  return n;
}

// ----- Слава (престиж) -----
function renderGlory() {
  const p = pendingCrowns();
  const next = Math.pow(p + 1, 2) * CROWN_DIVISOR;
  el.glory.innerHTML = `
    <div class="glory-box">
      <h3>👑 Новая династия</h3>
      <p>Передай трон наследнику. Всё золото, постройки и улучшения сгорят, но твоя слава останется в веках.</p>
      <p>Каждая <b>корона</b> даёт <b>+${CROWN_BONUS * 100}%</b> ко всему доходу навсегда.</p>
      <p>Короны сейчас: <b>${S.crowns}</b> (бонус +${Math.round(S.crowns * CROWN_BONUS * 100)}%)</p>
      <p>Получишь при передаче трона: <b>+${p}</b> 👑</p>
      <p style="font-size:12px;color:#6b5236">Следующая корона после ${fmt(next)} золота за правление (сейчас ${fmt(S.runEarned)})</p>
      <button class="big-btn" id="prestigeBtn" ${p < 1 ? 'disabled' : ''}>Передать трон</button>
      <div class="stats">
        Тапов: ${fmt(S.taps)}<br>
        Всего заработано: ${fmt(S.totalEarned)}<br>
        Династий сменилось: ${S.resets}<br>
        Царствуешь: ${fmtTime((Date.now() - S.started) / 1000)}
      </div>
      <button class="small-btn" id="wipeBtn">Сбросить всё</button>
    </div>`;
  $('prestigeBtn').addEventListener('click', () => {
    const gain = pendingCrowns();
    if (gain < 1) return;
    confirmModal(`Передать трон?`, `Ты получишь <b>${gain}</b> 👑, но начнёшь с нуля.`, () => {
      const keep = { crowns: S.crowns + gain, resets: S.resets + 1, totalEarned: S.totalEarned, taps: S.taps };
      S = Object.assign(freshState(), keep);
      upgradesDirty = true;
      save();
      toast(`👑 Да здравствует новый король! +${gain} корон`);
      render(true);
    });
  });
  $('wipeBtn').addEventListener('click', () => {
    confirmModal('Сбросить всё?', 'Прогресс и короны будут удалены навсегда.', () => {
      S = freshState();
      upgradesDirty = true;
      save();
      render(true);
    });
  });
}

// ----- Модалки / тосты -----
let toastTimer;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add('hidden'), 2200);
}
function showModal(html) {
  el.modalBox.innerHTML = html;
  el.modal.classList.remove('hidden');
}
function closeModal() { el.modal.classList.add('hidden'); }
function confirmModal(title, text, onYes) {
  showModal(`<h3>${title}</h3><p>${text}</p>
    <button class="big-btn" id="mYes">Да</button>
    <button class="small-btn" id="mNo">Отмена</button>`);
  $('mYes').onclick = () => { closeModal(); onYes(); };
  $('mNo').onclick = closeModal;
}

// ---------- Вкладки ----------
let currentTab = 'buildings';
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  currentTab = t.dataset.tab;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  ['buildings', 'upgrades', 'glory'].forEach(id => el[id].classList.toggle('hidden', id !== currentTab));
  document.querySelector('.buy-mode').classList.toggle('hidden', currentTab !== 'buildings');
  render(true);
}));
document.querySelectorAll('.mode').forEach(m => m.addEventListener('click', () => {
  buyMode = m.dataset.mode === 'max' ? 'max' : Number(m.dataset.mode);
  document.querySelectorAll('.mode').forEach(x => x.classList.toggle('active', x === m));
  render();
}));

// ---------- Тап ----------
el.tapBtn.addEventListener('pointerdown', e => {
  e.preventDefault();
  const v = tapValue();
  earn(v);
  S.taps++;
  spawnFloat('+' + fmt(v), e.clientX, e.clientY);
  if (navigator.vibrate) navigator.vibrate(8);
  renderTop();
});
function spawnFloat(text, x, y) {
  const zone = document.querySelector('.castle-zone');
  const rect = zone.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'float';
  f.textContent = text;
  f.style.left = (x - rect.left + (Math.random() * 30 - 15)) + 'px';
  f.style.top = (y - rect.top - 20) + 'px';
  zone.appendChild(f);
  setTimeout(() => f.remove(), 900);
}

// ---------- Странствующий купец (случайное событие) ----------
let merchantAt = Date.now() + rand(45, 90) * 1000;
let merchantGone = 0;
function rand(a, b) { return a + Math.random() * (b - a); }
function tickMerchant(now) {
  if (el.merchant.classList.contains('hidden')) {
    if (now >= merchantAt) {
      el.merchant.classList.remove('hidden');
      merchantGone = now + 12000;
    }
  } else if (now >= merchantGone) {
    el.merchant.classList.add('hidden');
    merchantAt = now + rand(60, 150) * 1000;
  }
}
el.merchant.addEventListener('click', () => {
  el.merchant.classList.add('hidden');
  merchantAt = Date.now() + rand(60, 150) * 1000;
  const roll = Math.random();
  if (roll < 0.5) {
    const g = Math.max(gps() * 90, S.gold * 0.1, 25);
    earn(g);
    toast(`🧳 Купец оставил сундук: +${fmt(g)} 🪙`);
  } else if (roll < 0.8) {
    buffs.prodMul = 5; buffs.prodUntil = Date.now() + 30000;
    toast('🎉 Праздник урожая! Доход ×5 на 30 сек');
  } else {
    buffs.tapMul = 15; buffs.tapUntil = Date.now() + 15000;
    toast('⚔️ Боевой клич! Тап ×15 на 15 сек');
  }
});

// ---------- Рендер ----------
function renderTop() {
  el.gold.textContent = fmt(S.gold);
  el.gps.textContent = fmt(gps());
  el.crowns.textContent = S.crowns;
  el.tapValue.textContent = fmt(tapValue());
}

function render(full) {
  renderTop();
  const upCount = checkUpgradeVisibility();
  document.querySelector('[data-tab=upgrades]').textContent = upCount ? `Улучшения (${upCount})` : 'Улучшения';

  if (currentTab === 'buildings') {
    BUILDINGS.forEach((b, i) => {
      const r = buildingCards[b.id];
      const n = S.owned[b.id];
      // видны купленные постройки и следующая за последней купленной
      const visible = i === 0 || n > 0 || S.owned[BUILDINGS[i - 1].id] > 0;
      r.card.classList.toggle('hidden', !visible);
      const k = buyAmount(b);
      const cost = bulkCost(b, n, k);
      r.count.textContent = n;
      const each = b.gps * buildingMul(b) * globalMul();
      r.desc.textContent = n > 0
        ? `${fmt(buildingGps(b) * globalMul())}/сек · +${fmt(each)} за шт.`
        : `${b.desc} · +${fmt(each)}/сек`;
      r.buy.textContent = `${k > 1 ? '×' + k + ' ' : ''}🪙 ${fmt(cost)}`;
      r.buy.disabled = S.gold < cost;
    });
  } else if (currentTab === 'upgrades') {
    if (upgradesDirty) rebuildUpgrades();
    upgradeRefs.forEach(({ u, btn }) => { btn.disabled = S.gold < u.cost; });
  } else if (currentTab === 'glory' && full) {
    renderGlory();
  }
}

// ---------- Цикл ----------
function tick() {
  const now = Date.now();
  const dt = Math.min((now - S.lastTick) / 1000, 1);
  S.lastTick = now;
  if (dt > 0) earn(gps() * dt);
  tickMerchant(now);
}
setInterval(tick, 100);
setInterval(() => render(), 250);
setInterval(() => { if (currentTab === 'glory' && el.modal.classList.contains('hidden')) renderGlory(); }, 1000);

// ---------- Сохранение ----------
function save() {
  S.lastTick = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* хранилище недоступно */ }
}
function load() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { data = null; }
  if (!data) return;
  const base = freshState();
  S = Object.assign(base, data);
  S.owned = Object.assign(base.owned, data.owned || {});
  S.upgrades = data.upgrades || {};

  // Офлайн-доход
  const away = Math.min((Date.now() - (data.lastTick || Date.now())) / 1000, OFFLINE_CAP);
  S.lastTick = Date.now();
  if (away > 30) {
    const gain = baseGps() * globalMul() * away; // баффы на старте неактивны
    if (gain > 0) {
      earn(gain);
      showModal(`<h3>С возвращением, Ваше Величество!</h3>
        <p>Пока тебя не было (${fmtTime(away)}), подданные собрали:</p>
        <p style="font-size:26px;color:#8e6a12"><b>🪙 ${fmt(gain)}</b></p>
        <button class="big-btn" id="mOk">В казну!</button>`);
      $('mOk').onclick = closeModal;
    }
  }
}
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else tick(); });
window.addEventListener('pagehide', save);

// ---------- Старт ----------
load();
buildBuildingCards();
render(true);
