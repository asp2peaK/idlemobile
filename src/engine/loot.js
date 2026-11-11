// =============== Лут и экипировка ===============
import { HEROES } from './data.js';

export const SLOTS = [
  { id: 'weapon', name: 'Оружие' },
  { id: 'helm',   name: 'Шлем' },
  { id: 'armor',  name: 'Доспех' },
  { id: 'amulet', name: 'Амулет' },
  { id: 'ring',   name: 'Кольцо' },
  { id: 'boots',  name: 'Сапоги' },
];

export const RARITIES = [
  { name: 'Обычный',     short: 'Обычн.',  color: '#b4b0a8', mul: 1,   aff: 0 },
  { name: 'Необычный',   short: 'Необ.',   color: '#56d062', mul: 1.6, aff: 1 },
  { name: 'Редкий',      short: 'Редк.',   color: '#4aa2ff', mul: 2.6, aff: 2 },
  { name: 'Эпический',   short: 'Эпич.',   color: '#bb62ff', mul: 4.2, aff: 3 },
  { name: 'Легендарный', short: 'Легенд.', color: '#ffa22e', mul: 7,   aff: 3 },
  { name: 'Мифический',  short: 'Миф.',    color: '#ff3d62', mul: 12,  aff: 4 },
];

const MAIN = { weapon: 'dmg', helm: 'tap', armor: 'party', amulet: 'gold', ring: 'critDmg', boots: 'speed' };

// scaled: растёт с уровнем предмета и заточкой; иначе — фиксированное значение от редкости
export const STATS = {
  dmg:       { label: v => `+${fmtPct(v)}% урона`,            base: 8,  scaled: true, suffix: 'силы' },
  tap:       { label: v => `+${fmtPct(v)}% урона тапа`,       base: 15, scaled: true, suffix: 'удальца' },
  party:     { label: v => `+${fmtPct(v)}% урона отряда`,     base: 10, scaled: true, suffix: 'полководца' },
  gold:      { label: v => `+${fmtPct(v)}% золота`,           base: 8,  scaled: true, suffix: 'алчности' },
  critDmg:   { label: v => `+${fmtPct(v)}% крит. урона`,      base: 20, scaled: true, suffix: 'ярости' },
  cls:       { label: (v, a) => `+${fmtPct(v)}% урона: ${HEROES.find(h => h.id === a.hero)?.name}`, base: 30, scaled: true, suffix: 'героя' },
  speed:     { label: v => `+${v}% скорости атаки`,           flat: (r, main) => main ? 4 + r * 3 : 2 + r * 1.5, suffix: 'ветра' },
  hit:       { label: v => `+${v} к попаданию`,               flat: r => 1 + Math.floor(r / 2), suffix: 'меткости' },
  critRange: { label: () => `+1 к диапазону крита`,           flat: () => 1, minRar: 3, suffix: 'убийцы' },
  luck:      { label: v => `+${v} к удаче`,                   flat: r => 1 + (r >= 4 ? 1 : 0), suffix: 'удачи' },
  loot:      { label: v => `+${v}% к шансу лута`,             flat: r => 3 + r * 2, suffix: 'искателя' },
  bossTime:  { label: v => `+${v} сек на босса`,              flat: r => 2 + r, suffix: 'терпения' },
};
const AFFIX_POOL = ['dmg', 'tap', 'party', 'gold', 'critDmg', 'cls', 'speed', 'hit', 'critRange', 'luck', 'loot', 'bossTime'];

export const UNIQUES = {
  weapon: [{ id: 'vorpal', name: 'Ворпальный клинок', desc: 'Криты наносят ещё ×3 урона', v: 'sword' },
           { id: 'holy', name: 'Святой мститель', desc: '+150% урона по боссам', v: 'hammer' }],
  helm:   [{ id: 'dragonhelm', name: 'Шлем драконоборца', desc: '+10 сек на босса' },
           { id: 'insight', name: 'Венец прозрения', desc: 'Твои тапы всегда с преимуществом', v: 1 }],
  armor:  [{ id: 'mithril', name: 'Мифриловая кольчуга', desc: 'Все герои +3 к попаданию' },
           { id: 'ethereal', name: 'Эфирный доспех', desc: 'Сундуки появляются вдвое чаще' }],
  amulet: [{ id: 'midas', name: 'Амулет Мидаса', desc: 'Всё золото ×1.5' },
           { id: 'fortune', name: 'Око фортуны', desc: '+3 к удаче' }],
  ring:   [{ id: 'shadow', name: 'Кольцо теней', desc: 'Диапазон крита +2 для всех' },
           { id: 'echo', name: 'Кольцо эха', desc: '15% шанс, что атака героя повторится' }],
  boots:  [{ id: 'haste', name: 'Сапоги скорости', desc: 'Скорость атаки +25%' },
           { id: 'leagues', name: 'Семимильные сапоги', desc: 'Нужно 5 убийств на этаж вместо 10' }],
};

const MATERIALS = ['Ржавый', 'Железный', 'Стальной', 'Закалённый', 'Дварфийский', 'Эльфийский', 'Мифриловый',
  'Адамантиевый', 'Драконий', 'Рунический', 'Звёздный', 'Астральный', 'Божественный', 'Первородный'];
const plural = m => m === 'Драконий' ? 'Драконьи' : m.replace(/ый$/, 'ые').replace(/ий$/, 'ие').replace(/ой$/, 'ые');
const NOUNS = {
  weapon: [['Меч', 'sword'], ['Топор', 'axe'], ['Молот', 'hammer'], ['Кинжал', 'dagger'], ['Посох', 'staff']],
  helm:   [['Шлем', 0], ['Капюшон', 1], ['Венец', 2]],
  armor:  [['Доспех', 0], ['Нагрудник', 1], ['Панцирь', 2]],
  amulet: [['Амулет', 0], ['Талисман', 1], ['Медальон', 2]],
  ring:   [['Перстень', 0], ['Перстень', 1]],
  boots:  [['Сапоги', 0, true], ['Башмаки', 1, true]],
};

function fmtPct(v) {
  if (v < 100) return v.toFixed(v < 10 ? 1 : 0);
  if (v < 1e4) return Math.round(v).toString();
  return (v / 1000).toFixed(1) + 'K';
}
const pick = a => a[Math.floor(Math.random() * a.length)];
const d20 = () => 1 + Math.floor(Math.random() * 20);

export const ilvlScale = ilvl => 1 + ilvl * 0.1;
export const plusMul = plus => 1 + plus * 0.08;

// Бросок на редкость: d20 + удача. Нат. 20 → легендарка, и ещё бросок на подтверждение → мифик
export function rollRarity(luck, adv, minRar = 0) {
  let r = d20();
  if (adv) r = Math.max(r, d20());
  let rar;
  let confirm = null;
  if (r === 20) {
    confirm = d20() + luck;
    rar = confirm >= 19 ? 5 : 4;
  } else {
    const t = r + luck;
    rar = t >= 21 ? 4 : t >= 18 ? 3 : t >= 14 ? 2 : t >= 9 ? 1 : 0;
  }
  return { roll: r, confirm, rar: Math.max(rar, minRar) };
}

export function makeItem(id, ilvl, rar, slot) {
  slot = slot || pick(SLOTS).id;
  const [noun, variant, isPlural] = pick(NOUNS[slot]);
  const item = { id, slot, rar, ilvl, plus: 0, variant, affixes: [] };
  // основной стат
  item.affixes.push(rollAffix(MAIN[slot], rar, true));
  const pool = AFFIX_POOL.filter(k => k !== MAIN[slot] && !(STATS[k].minRar > rar));
  for (let i = 0; i < RARITIES[rar].aff && pool.length; i++) {
    const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    item.affixes.push(rollAffix(k, rar, false));
  }
  if (rar >= 4) {
    const u = pick(UNIQUES[slot]);
    item.unique = u.id;
    item.name = u.name;
    if (u.v !== undefined) item.variant = u.v;
  } else {
    const mat = MATERIALS[Math.min(MATERIALS.length - 1, Math.floor(ilvl / 12))];
    const sfx = item.affixes[1] ? ' ' + STATS[item.affixes[1].k].suffix : '';
    item.name = `${isPlural ? plural(mat) : mat} ${noun.toLowerCase()}${sfx}`;
    item.name = item.name[0].toUpperCase() + item.name.slice(1);
  }
  return item;
}

function rollAffix(k, rar, main) {
  const st = STATS[k];
  const a = { k };
  if (st.scaled) a.v = st.base * RARITIES[rar].mul * (0.85 + Math.random() * 0.3) * (main ? 1.4 : 1);
  else a.v = Math.round(st.flat(rar, main) * 10) / 10;
  if (k === 'cls') a.hero = pick(HEROES.slice(0, 10)).id;
  return a;
}

// Итоговое значение аффикса с учётом уровня предмета и заточки
export function affixValue(item, a) {
  const st = STATS[a.k];
  if (st.scaled) return a.v * ilvlScale(item.ilvl) * plusMul(item.plus);
  return a.v;
}

export function itemPower(item) {
  if (!item) return 0;
  return Math.round(RARITIES[item.rar].mul * ilvlScale(item.ilvl) * plusMul(item.plus) * 10 * (1 + item.affixes.length * 0.15) * (item.unique ? 1.5 : 1));
}

export function uniqueInfo(item) {
  if (!item?.unique) return null;
  return UNIQUES[item.slot].find(u => u.id === item.unique);
}

export function gearTotals(eq) {
  const t = { dmg: 0, tap: 0, party: 0, gold: 0, critDmg: 0, speed: 0, hit: 0, critRange: 0, luck: 0, loot: 0, bossTime: 0, cls: {}, uniques: new Set() };
  Object.values(eq).forEach(item => {
    if (!item) return;
    item.affixes.forEach(a => {
      const v = affixValue(item, a);
      if (a.k === 'cls') t.cls[a.hero] = (t.cls[a.hero] || 0) + v;
      else t[a.k] += v;
    });
    if (item.unique) t.uniques.add(item.unique);
  });
  return t;
}

export function salvageValue(item) { return Math.ceil((item.rar + 1) ** 2 * (1 + item.ilvl / 15)); }
export function upgradeCost(item) { return Math.ceil(5 * (item.rar + 1) * 1.22 ** item.plus * (1 + item.ilvl / 50)); }
export function upgradeDC(item, forge) { return Math.max(2, Math.min(19, 4 + item.plus - forge)); }
