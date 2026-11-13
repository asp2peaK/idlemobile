// =============== Герои ===============
export const HEROES = [
  { id: 'fighter',   name: 'Воин',      c: '#d0564c', die: 10, n: 1, int: 1.5, power: 1,      cost: 15,     hit: 3,
    perk: 'Боевая выучка: +3 к попаданию' },
  { id: 'rogue',     name: 'Плут',      c: '#8a9aac', die: 4,  n: 2, int: 0.9, power: 3,      cost: 120,    hit: 2, critMin: 19, critMul: 3,
    perk: 'Скрытая атака: крит на 19–20, урон ×3' },
  { id: 'ranger',    name: 'Следопыт',  c: '#62a850', die: 8,  n: 1, int: 1.2, power: 12,     cost: 900,    hit: 6,
    perk: 'Меткость: +6 к попаданию' },
  { id: 'cleric',    name: 'Жрец',      c: '#e6b440', die: 6,  n: 1, int: 2.0, power: 50,     cost: 7000,   hit: 2, goldPct: 2, heal: 1,
    perk: 'Лечение: лечит отряд каждую атаку, +2% золота за ур.' },
  { id: 'wizard',    name: 'Волшебник', c: '#5a86ee', die: 12, n: 1, int: 3.0, power: 260,    cost: 6e4,    hit: 0, auto: true,
    perk: 'Огненный шар: всегда попадает' },
  { id: 'paladin',   name: 'Паладин',   c: '#eadba6', die: 10, n: 1, int: 2.0, power: 900,    cost: 5e5,    hit: 3, critMul: 4, acPer: 10,
    perk: 'Аура защиты: +1 КД отряда за 10 ур., крит ×4' },
  { id: 'bard',      name: 'Бард',      c: '#dc64aa', die: 6,  n: 1, int: 2.5, power: 3000,   cost: 4e6,    hit: 2, dmgPct: 1,
    perk: 'Вдохновение: +1% урона всем за уровень' },
  { id: 'barbarian', name: 'Варвар',    c: '#de7a32', die: 12, n: 1, int: 1.4, power: 1.6e4,  cost: 3e7,    hit: 2, adv: true, hpPct: 1,
    perk: 'Стойкость: +1% ХП отряда за ур., всегда с преимуществом' },
  { id: 'druid',     name: 'Друид',     c: '#3c9a72', die: 8,  n: 3, int: 2.5, power: 6e4,    cost: 2.5e8,  hit: 3, heal: 0.5,
    perk: 'Дикий облик: 3d8, немного лечит отряд' },
  { id: 'warlock',   name: 'Колдун',    c: '#a050ea', die: 20, n: 1, int: 2.0, power: 4e5,    cost: 2e9,    hit: 4, critMin: 18,
    perk: 'Мистический заряд: крит на 18–20' },
  // Секретные герои — открываются глубоко в подземелье
  { id: 'monk',      name: 'Монах',     c: '#f0d060', die: 6,  n: 4, int: 1.0, power: 3e7,    cost: 5e13,   hit: 6, unlock: 60,
    perk: 'Шквал ударов: 4d6, очень быстро' },
  { id: 'sorcerer',  name: 'Чародей',   c: '#ff5a8a', die: 10, n: 3, int: 2.0, power: 2e10,   cost: 4e19,   hit: 0, auto: true, unlock: 100,
    perk: 'Метамагия: 3d10, всегда попадает' },
  { id: 'godslayer', name: 'Богоборец', c: '#ff3030', die: 20, n: 4, int: 2.5, power: 5e14,   cost: 1e28,   hit: 8, critMin: 17, critMul: 5, unlock: 160,
    perk: 'Убийца богов: 4d20, крит на 17–20 ×5' },
];
export const HERO_GROWTH = 1.075;
export const HERO_MILESTONES = [10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];

// =============== Твой персонаж ===============
export const PLAYER_DICE = [
  { n: 1, d: 4, cost: 0 }, { n: 1, d: 6, cost: 60 }, { n: 1, d: 8, cost: 800 }, { n: 1, d: 10, cost: 9000 },
  { n: 1, d: 12, cost: 1e5 }, { n: 1, d: 20, cost: 1.5e6 }, { n: 2, d: 20, cost: 3e7 }, { n: 3, d: 20, cost: 8e8 },
  { n: 4, d: 20, cost: 3e10 }, { n: 6, d: 20, cost: 1e12 }, { n: 8, d: 20, cost: 5e13 }, { n: 12, d: 20, cost: 3e15 },
  { n: 16, d: 20, cost: 2e17 }, { n: 24, d: 20, cost: 2e19 }, { n: 32, d: 20, cost: 3e21 },
];

// =============== Биомы ===============
// kind — какой фон рисовать; arch — какие монстры водятся; hue — оттенки кожи монстров
export const BIOMES = [
  { name: 'Подземелье',        kind: 'dungeon', hue: [70, 120],  sat: 24, arch: ['goblin', 'slime', 'bat', 'spider'], boss: 'goblin', adj: 'Пещерный',     glow: '#ff9a3a', particles: 'dust' },
  { name: 'Тёмный лес',        kind: 'forest',  hue: [20, 45],   sat: 40, arch: ['beast', 'spider', 'goblin', 'bat'],   boss: 'beast',  adj: 'Лесной',      glow: '#7ac860', particles: 'spores' },
  { name: 'Склепы',            kind: 'crypt',   hue: [250, 290], sat: 25, arch: ['skull', 'ghost', 'bat'],              boss: 'skull',  adj: 'Могильный',   glow: '#9a7aff', particles: 'wisps' },
  { name: 'Гнилые топи',       kind: 'swamp',   hue: [65, 100],  sat: 45, arch: ['slime', 'eye', 'beast', 'spider'],    boss: 'slime',  adj: 'Болотный',    glow: '#b0d040', particles: 'spores' },
  { name: 'Огненные пещеры',   kind: 'lava',    hue: [0, 25],    sat: 60, arch: ['demon', 'golem', 'slime', 'bat'],     boss: 'dragon', adj: 'Огненный',    glow: '#ff5a1a', particles: 'embers' },
  { name: 'Ледяной пик',       kind: 'ice',     hue: [185, 215], sat: 45, arch: ['golem', 'beast', 'ghost'],            boss: 'golem',  adj: 'Ледяной',     glow: '#7ad0ff', particles: 'snow' },
  { name: 'Руины пустыни',     kind: 'ruins',   hue: [30, 45],   sat: 50, arch: ['skull', 'spider', 'golem', 'slime'],  boss: 'spider', adj: 'Песчаный',    glow: '#ffc04a', particles: 'dust' },
  { name: 'Небесная цитадель', kind: 'sky',     hue: [40, 60],   sat: 30, arch: ['eye', 'golem', 'ghost', 'bat'],       boss: 'eye',    adj: 'Небесный',    glow: '#fff0a0', particles: 'motes' },
  { name: 'Бездна',            kind: 'abyss',   hue: [280, 330], sat: 55, arch: ['eye', 'demon', 'spider', 'ghost'],    boss: 'demon',  adj: 'Бездонный',   glow: '#d040ff', particles: 'wisps' },
  { name: 'Астрал',            kind: 'astral',  hue: [160, 340], sat: 60, arch: ['eye', 'ghost', 'dragon', 'golem'],    boss: 'dragon', adj: 'Звёздный',    glow: '#60f0ff', particles: 'stars' },
];
export const FLOORS_PER_BIOME = 10;

export const ARCH_NAMES = {
  goblin: ['Гоблин', 'Хобгоблин', 'Багбир'],
  slime:  ['Слизень', 'Студень', 'Кисель'],
  bat:    ['Нетопырь', 'Кровосос', 'Вампир'],
  spider: ['Паук', 'Ткач', 'Птицеед'],
  beast:  ['Волколак', 'Варг', 'Оборотень'],
  skull:  ['Скелет', 'Мертвец', 'Костяк'],
  ghost:  ['Призрак', 'Дух', 'Фантом'],
  eye:    ['Соглядатай', 'Зрачок', 'Наблюдатель'],
  golem:  ['Голем', 'Истукан', 'Колосс'],
  demon:  ['Демон', 'Бес', 'Изверг'],
  dragon: ['Змей', 'Дракон', 'Виверн'],
};
export const BOSS_TITLES = {
  goblin: 'Король гоблинов', slime: 'Великая слизь', bat: 'Князь ночи', spider: 'Матерь пауков',
  beast: 'Вожак стаи', skull: 'Король-лич', ghost: 'Безликий', eye: 'Всевидящий',
  golem: 'Древний колосс', demon: 'Князь демонов', dragon: 'Пожиратель миров',
};
export const BOSS_SYL_A = ['Гро', 'Мор', 'Зул', 'Кха', 'Вел', 'Ург', 'Сар', 'Нек', 'Баэ', 'Тор', 'Ксар', 'Ил', 'Азг', 'Дру', 'Фен'];
export const BOSS_SYL_B = ['гаш', 'бул', 'зор', 'рак', 'мот', 'нир', 'тус', 'гор', 'даэль', 'лит', 'вакс', 'ог', 'рот', 'муль'];
export const CIRCLE_NAMES = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// =============== Умения ===============
export const ABILITIES = [
  { id: 'rage',  name: 'Ярость',       icon: 'rage',  unlock: 5,  dur: 20, cd: 120, desc: 'Урон отряда ×2 на 20 сек' },
  { id: 'adv',   name: 'Преимущество', icon: 'clover', unlock: 10, dur: 30, cd: 180, desc: 'Все броски с преимуществом на 30 сек' },
  { id: 'midas', name: 'Мидас',        icon: 'coins', unlock: 15, dur: 30, cd: 300, desc: 'Золото ×3 на 30 сек' },
];

// =============== Реликвии (престиж) ===============
export const RELICS = [
  { id: 'blade',     name: 'Клинок предков',     icon: 'blade',     base: 2, growth: 1.55, max: Infinity, desc: l => `+${l * 20}% урона` },
  { id: 'aegis',     name: 'Эгида',              icon: 'shield',    base: 2, growth: 1.55, max: Infinity, desc: l => `+${l * 20}% ХП отряда` },
  { id: 'greed',     name: 'Жадность дракона',   icon: 'hoard',     base: 2, growth: 1.55, max: Infinity, desc: l => `+${l * 15}% золота` },
  { id: 'heir',      name: 'Родовой герб',       icon: 'banner',    base: 6, growth: 3,    max: 2,        desc: l => `Фамильных вещей при новой кампании: ${1 + l}` },
  { id: 'luck',      name: 'Кость удачи',        icon: 'die',       base: 4, growth: 2,    max: 8,        desc: l => `+${l} к удаче (редкость лута)` },
  { id: 'hourglass', name: 'Песочные часы',      icon: 'hourglass', base: 3, growth: 1.9,  max: 8,        desc: l => `+${l * 3} сек на босса` },
  { id: 'tome',      name: 'Фолиант гильдии',    icon: 'tome',      base: 4, growth: 2,    max: 10,       desc: l => `Найм героев дешевле на ${Math.round((1 - 0.95 ** l) * 100)}%` },
  { id: 'scholar',   name: 'Перо мудреца',       icon: 'scroll',    base: 3, growth: 1.8,  max: 10,       desc: l => `+${l * 25}% опыта персонажа` },
  { id: 'forge',     name: 'Горн дварфов',       icon: 'anvil',     base: 3, growth: 2,    max: 8,        desc: l => `Сложность заточки −${l}` },
  { id: 'bag',       name: 'Бездонная сумка',    icon: 'bag',       base: 3, growth: 2.2,  max: 5,        desc: l => `+${l * 10} мест в инвентаре` },
  { id: 'prism',     name: 'Призма судьбы',      icon: 'prism',     base: 8, growth: 1.8,  max: Infinity, desc: l => `+${l * 10}% осколков за кампанию` },
];
function fmtSimple(n) { return n >= 1e6 ? (n / 1e6) + 'M' : n >= 1e3 ? (n / 1e3) + 'K' : n; }

export const KILLS_PER_FLOOR = 10;
export const BOSS_TIME = 30;
export const PRESTIGE_FLOOR = 30;
export const OFFLINE_CAP = 8 * 3600;

// =============== 2.0: Свойства монстров ===============
export const TRAITS = [
  { id: 'armored',  name: 'Бронированный', color: '#9aa8b8', desc: '+4 к КД' },
  { id: 'regen',    name: 'Регенерация',   color: '#5ad05a', desc: 'Восстанавливает 2% ХП в секунду' },
  { id: 'frenzy',   name: 'Неистовый',     color: '#ff6a3a', desc: 'Атакует вдвое чаще' },
  { id: 'ghostly',  name: 'Призрачный',    color: '#b0a0ff', desc: '50% атак проходят насквозь (кроме магии)' },
  { id: 'vampire',  name: 'Вампир',        color: '#e0304a', desc: 'Лечится от урона по отряду' },
  { id: 'thorns',   name: 'Шипастый',      color: '#c08a3a', desc: 'Тап ранит отряд' },
  { id: 'brute',    name: 'Громила',       color: '#d05050', desc: 'Урон ×1.8' },
  { id: 'evasive',  name: 'Увёртливый',    color: '#60c0e0', desc: 'Слабые места не появляются' },
];

// =============== 2.0: Таланты персонажа (сбрасываются каждую кампанию) ===============
export const TALENT_TREES = [
  { id: 'war', name: 'Воитель', color: '#e0584c', talents: [
    { id: 'power',   name: 'Мощный удар',    max: 10, desc: r => `+${r * 15}% урона тапа` },
    { id: 'cry',     name: 'Боевой клич',    max: 10, desc: r => `+${r * 5}% урона отряда` },
    { id: 'execute', name: 'Палач',          max: 5,  desc: r => `+${r * 20}% урона по боссам` },
    { id: 'weak',    name: 'Охотник',        max: 5,  desc: r => `Слабые места: +${r * 50}% урона и чаще` },
  ] },
  { id: 'guard', name: 'Страж', color: '#4a9aff', talents: [
    { id: 'fort',    name: 'Крепость',       max: 10, desc: r => `+${r * 10}% ХП отряда` },
    { id: 'shield',  name: 'Стена щитов',    max: 5,  desc: r => `+${r} КД отряда` },
    { id: 'parry',   name: 'Парирование',    max: 5,  desc: r => `+${r * 2} к спасброску блока` },
    { id: 'second',  name: 'Второе дыхание', max: 5,  desc: r => `+${r * 4}% ХП после каждого убийства` },
  ] },
  { id: 'luck', name: 'Ловкач', color: '#5ad05a', talents: [
    { id: 'lucky',   name: 'Счастливчик',    max: 5,  desc: r => `+${r} к удаче` },
    { id: 'eye',     name: 'Глаз мастера',   max: 3,  desc: r => `Крит тапа на ${20 - r}–20` },
    { id: 'goldh',   name: 'Золотые руки',   max: 10, desc: r => `+${r * 8}% золота` },
    { id: 'scav',    name: 'Мародёр',        max: 5,  desc: r => `+${r * 12}% к шансу лута` },
  ] },
];

// =============== 2.0: Контракты таверны ===============
export const CONTRACTS = [
  { id: 'kills',   text: n => `Убей ${n} монстров`,              base: 60,  per: 2 },
  { id: 'bosses',  text: n => `Победи ${n} боссов`,               base: 3,   per: 0.05 },
  { id: 'nat20',   text: n => `Выброси ${n} натуральных 20`,      base: 6,   per: 0.1 },
  { id: 'blocks',  text: n => `Заблокируй ${n} мощных ударов`,    base: 4,   per: 0.06 },
  { id: 'weak',    text: n => `Попади в ${n} слабых мест`,         base: 6,   per: 0.1 },
  { id: 'items',   text: n => `Найди ${n} предметов`,             base: 5,   per: 0.08 },
  { id: 'traits',  text: n => `Убей ${n} монстров со свойствами`, base: 10,  per: 0.2 },
  { id: 'upgrade', text: n => `Успешно заточи предметы ${n} раз`, base: 2,   per: 0.03 },
];

// =============== 2.0: Проклятия кампании ===============
export const CURSES = [
  { id: 'thick',  name: 'Толстокожие', desc: 'Монстры ×2 ХП',                 bonus: 0.4 },
  { id: 'fierce', name: 'Свирепые',    desc: 'Монстры бьют ×2',               bonus: 0.4 },
  { id: 'rush',   name: 'Спешка',      desc: 'На боссов на 10 сек меньше',     bonus: 0.3 },
  { id: 'greedy', name: 'Скупость',    desc: 'Золото −50%',                    bonus: 0.3 },
  { id: 'unlucky', name: 'Невезение',  desc: 'Все броски d20 отряда −2',       bonus: 0.5 },
  { id: 'naked',  name: 'Нагота',      desc: 'Нельзя надевать снаряжение',     bonus: 0.8 },
];

export const VERSION = '2.0';
export const CHANGELOG = [
  'Монстры бьют в ответ: у отряда есть ХП и КД, монстры атакуют броском d20. Отряд может пасть!',
  'Мощные удары: монстр замахивается — жми «Блок» и делай спасбросок.',
  'Слабые места: бей по светящейся руне на монстре — урон ×5.',
  'Свойства монстров: Бронированный, Регенерация, Призрачный, Вампир, Шипастый и другие.',
  'Уровень персонажа и дерево талантов из 3 ветвей — новый билд каждую кампанию.',
  'Таверна: контракты с наградами.',
  'Новая кампания: снаряжение сгорает, кроме фамильных вещей. Проклятия за бонус осколков.',
  'Баланс: прогресс медленнее, осколков меньше, лут слабее, но ценнее.',
];
