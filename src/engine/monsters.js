// =============== Процедурные монстры ===============
import { BIOMES, FLOORS_PER_BIOME, ARCH_NAMES, BOSS_TITLES, BOSS_SYL_A, BOSS_SYL_B, CIRCLE_NAMES } from './data.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function biomeOf(floor) {
  const bi = Math.floor((floor - 1) / FLOORS_PER_BIOME);
  const circle = Math.floor(bi / BIOMES.length);
  return { biome: BIOMES[bi % BIOMES.length], circle, index: bi };
}

export function bossTier(floor) {
  if (floor % 50 === 0) return 3;   // Великий босс
  if (floor % 10 === 0) return 2;   // Босс биома
  if (floor % 5 === 0) return 1;    // Вожак
  return 0;
}

// Стабильное имя босса для этажа
function bossName(floor, arch) {
  const r = rng(floor * 7919);
  const nm = BOSS_SYL_A[Math.floor(r() * BOSS_SYL_A.length)] + BOSS_SYL_B[Math.floor(r() * BOSS_SYL_B.length)];
  return `${nm}, ${BOSS_TITLES[arch]}`;
}

let uid = 0;
export function makeMonsterSpec(floor, opts = {}) {
  const { biome, circle } = biomeOf(floor);
  const tier = opts.mimic ? 0 : bossTier(floor);
  const r = rng((floor * 1000 + (uid++ % 997)) * 2654435761);
  let arch = tier >= 2 ? biome.boss : biome.arch[Math.floor(r() * biome.arch.length)];
  if (tier === 3) arch = ['dragon', 'demon', 'eye', 'skull'][Math.floor(floor / 50) % 4];
  if (opts.mimic) arch = 'mimic';

  const [h0, h1] = biome.hue;
  const hue = (h0 + r() * (h1 - h0) + circle * 47) % 360;
  const spec = {
    arch, hue,
    sat: biome.sat + r() * 12,
    light: 32 + r() * 12,
    eyes: 1 + Math.floor(r() * 3),          // вариации количества глаз
    horns: tier >= 1 || r() < 0.3,
    spikes: r() < 0.35,
    scar: r() < 0.3,
    crown: tier >= 2,
    aura: tier >= 1 ? (tier === 3 ? '#ffd040' : tier === 2 ? '#ff3a2a' : '#ff8a3a') : null,
    glow: biome.glow,
    seed: Math.floor(r() * 1e9),
  };

  let name;
  if (opts.mimic) name = 'Мимик';
  else if (tier >= 2) name = (tier === 3 ? 'Великий ' : '') + bossName(floor, arch);
  else {
    const noun = ARCH_NAMES[arch][Math.min(2, Math.floor(r() * 2 + circle * 0.7))];
    name = (tier === 1 ? 'Вожак: ' : '') + biome.adj + ' ' + noun.toLowerCase();
    if (tier === 1) name = 'Вожак: ' + biome.adj.toLowerCase() + ' ' + noun.toLowerCase();
    else name = biome.adj + ' ' + noun.toLowerCase();
  }
  if (circle > 0) name += ' ' + (CIRCLE_NAMES[Math.min(circle, CIRCLE_NAMES.length - 1)] || circle + 1);
  return { name, spec, tier, biome, circle };
}
