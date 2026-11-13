import { memo } from 'react';
import { RARITIES } from '../engine/loot.js';

const S = { stroke: '#1a0e08', strokeWidth: 2.5, strokeLinejoin: 'round', strokeLinecap: 'round' };

// ---------- Эмблемы героев (64×64) ----------
const HERO_PATHS = {
  fighter: c => <>
    <path d="M14,50 L44,12 L52,12 L52,20 L18,54Z" fill="url(#metal)" {...S} />
    <path d="M50,50 L20,12 L12,12 L12,20 L46,54Z" fill="url(#metal)" {...S} />
    <path d="M10,46 L22,58 M54,46 L42,58" stroke={c} strokeWidth="7" strokeLinecap="round" />
    <circle cx="32" cy="32" r="5" fill={c} {...S} />
  </>,
  rogue: c => <>
    <path d="M50,8 L54,12 L28,40 L22,36Z" fill="url(#metal)" {...S} />
    <path d="M18,32 L30,44" stroke={c} strokeWidth="6" strokeLinecap="round" />
    <path d="M24,40 L12,52" stroke="#3a2414" strokeWidth="6" strokeLinecap="round" />
    <circle cx="10" cy="54" r="4" fill={c} {...S} />
    <path d="M14,10 L22,18 M40,48 L48,56 M8,26 L16,26" stroke={c} strokeWidth="2.5" strokeLinecap="round" opacity=".6" />
  </>,
  ranger: c => <>
    <path d="M18,8 Q52,32 18,56" fill="none" stroke="#7a4a22" strokeWidth="6" strokeLinecap="round" />
    <path d="M18,8 L18,56" stroke="#e8dcc0" strokeWidth="1.5" />
    <path d="M10,32 H54" stroke="#3a2414" strokeWidth="3" />
    <path d="M54,32 L44,26 L46,32 L44,38Z" fill="url(#metal)" {...S} />
    <path d="M10,32 L4,26 M10,32 L4,38" stroke={c} strokeWidth="4" strokeLinecap="round" />
  </>,
  cleric: c => <>
    <circle cx="32" cy="32" r="13" fill={c} {...S} />
    {Array.from({ length: 8 }, (_, i) => {
      const a = i * Math.PI / 4;
      return <path key={i} d={`M${32 + Math.cos(a) * 17},${32 + Math.sin(a) * 17} L${32 + Math.cos(a) * 27},${32 + Math.sin(a) * 27}`} stroke={c} strokeWidth="5" strokeLinecap="round" />;
    })}
    <path d="M32,24 V40 M25,30 H39" stroke="#fff8d8" strokeWidth="4" strokeLinecap="round" />
  </>,
  wizard: c => <>
    <path d="M12,48 L32,6 L52,48Z" fill={c} {...S} />
    <path d="M6,50 Q32,40 58,50 Q32,58 6,50Z" fill={c} {...S} />
    <path d="M24,34 L26,30 L28,34 L32,35 L28,37 L26,41 L24,37 L20,35Z M38,22 l1,-3 l1,3 l3,1 l-3,1 l-1,3 l-1,-3 l-3,-1Z" fill="#ffe680" />
    <path d="M20,44 H44" stroke="#ffe680" strokeWidth="3" />
  </>,
  paladin: c => <>
    <path d="M32,6 L54,14 Q54,42 32,58 Q10,42 10,14Z" fill="url(#metal)" {...S} />
    <path d="M32,12 L48,18 Q48,40 32,52 Q16,40 16,18Z" fill={c} opacity=".85" />
    <path d="M32,18 V46 M22,28 H42" stroke="#fff8d8" strokeWidth="5" strokeLinecap="round" />
  </>,
  bard: c => <>
    <ellipse cx="24" cy="42" rx="14" ry="13" fill="#9a5a2a" {...S} />
    <circle cx="24" cy="42" r="4" fill="#2a140a" />
    <path d="M32,34 L52,10" stroke="#5a3418" strokeWidth="6" strokeLinecap="round" />
    <path d="M48,8 L56,4 L58,12 L52,14Z" fill={c} {...S} />
    <path d="M44,40 q4,-6 8,0 M50,48 q3,-5 6,0" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" />
  </>,
  barbarian: c => <>
    <path d="M30,6 V58" stroke="#5a3418" strokeWidth="6" strokeLinecap="round" />
    <path d="M30,12 Q52,6 56,24 Q46,22 30,30Z" fill="url(#metal)" {...S} />
    <path d="M30,12 Q8,6 6,24 Q16,22 30,30Z" fill="url(#metal)" {...S} />
    <path d="M26,40 H34 M26,46 H34" stroke={c} strokeWidth="3" />
  </>,
  druid: c => <>
    <path d="M32,56 V26" stroke="#5a3418" strokeWidth="5" strokeLinecap="round" />
    <path d="M32,30 Q12,28 10,10 Q28,10 32,30Z M32,34 Q52,32 56,14 Q36,12 32,34Z M32,26 Q26,10 32,4 Q38,10 32,26Z" fill={c} {...S} />
    <path d="M22,54 Q32,46 42,54" stroke="#3a2414" strokeWidth="3" fill="none" />
  </>,
  warlock: c => <>
    <path d="M4,32 Q32,4 60,32 Q32,60 4,32Z" fill="#1a0a24" {...S} />
    <circle cx="32" cy="32" r="13" fill={c} />
    <ellipse cx="32" cy="32" rx="3.5" ry="11" fill="#0a0410" />
    <circle cx="27" cy="27" r="3" fill="#fff" opacity=".8" />
    <path d="M14,12 L20,18 M50,12 L44,18 M32,4 V10" stroke={c} strokeWidth="3" strokeLinecap="round" />
  </>,
  monk: c => <>
    <path d="M20,30 Q20,16 32,16 Q44,16 44,30 L46,44 Q32,52 18,44Z" fill={c} {...S} />
    <path d="M24,24 H40 M24,30 H40 M24,36 H40" stroke="#5a3a08" strokeWidth="2" />
    <path d="M10,14 L18,22 M54,14 L46,22 M8,40 H16 M48,40 H56" stroke={c} strokeWidth="3" strokeLinecap="round" />
  </>,
  sorcerer: c => <>
    <path d="M32,4 C44,20 52,30 44,46 C40,54 24,54 20,46 C12,30 20,20 32,4Z" fill={c} {...S} />
    <path d="M32,20 C38,30 40,36 36,44 C34,48 30,48 28,44 C24,36 26,30 32,20Z" fill="#ffd8e8" />
    <path d="M14,56 H50" stroke={c} strokeWidth="4" strokeLinecap="round" />
  </>,
  godslayer: c => <>
    <path d="M32,2 L38,40 L32,46 L26,40Z" fill="url(#metal)" {...S} />
    <path d="M14,40 H50 L44,46 H20Z" fill={c} {...S} />
    <path d="M32,46 V60" stroke="#3a1a0a" strokeWidth="6" strokeLinecap="round" />
    <path d="M8,16 L20,24 M56,16 L44,24 M4,32 L18,34 M60,32 L46,34" stroke="#ffd040" strokeWidth="3" strokeLinecap="round" />
  </>,
};

const MetalDefs = () => (
  <defs>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffffff" /><stop offset="45%" stopColor="#b8c0c8" /><stop offset="100%" stopColor="#5a626c" />
    </linearGradient>
    <linearGradient id="goldm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#fff4b0" /><stop offset="50%" stopColor="#e8b030" /><stop offset="100%" stopColor="#8a5a10" />
    </linearGradient>
  </defs>
);

export const HeroIcon = memo(function HeroIcon({ id, c }) {
  return <svg viewBox="0 0 64 64" className="ico"><MetalDefs />{HERO_PATHS[id]?.(c)}</svg>;
});

// ---------- Предметы (64×64) ----------
function weapon(v, gem, metal) {
  switch (v) {
    case 'axe': return <>
      <path d="M22,58 L44,8" stroke="#6a3e1c" strokeWidth="6" strokeLinecap="round" />
      <path d="M38,14 Q58,10 58,32 Q48,26 34,28Z" fill={metal} {...S} />
      <circle cx="39" cy="20" r="3.5" fill={gem} />
    </>;
    case 'hammer': return <>
      <path d="M32,60 V20" stroke="#6a3e1c" strokeWidth="6" strokeLinecap="round" />
      <rect x="12" y="6" width="40" height="18" rx="4" fill={metal} {...S} />
      <path d="M20,10 V20 M44,10 V20" stroke="#1a0e08" strokeWidth="2" opacity=".5" />
      <circle cx="32" cy="15" r="5" fill={gem} {...S} />
    </>;
    case 'dagger': return <>
      <path d="M32,6 L39,36 L32,40 L25,36Z" fill={metal} {...S} />
      <path d="M20,40 H44" stroke={gem} strokeWidth="6" strokeLinecap="round" />
      <path d="M32,42 V56" stroke="#6a3e1c" strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="58" r="3.5" fill={gem} />
    </>;
    case 'staff': return <>
      <path d="M22,60 L42,16" stroke="#6a3e1c" strokeWidth="6" strokeLinecap="round" />
      <path d="M42,16 Q34,6 44,4 Q54,6 50,14" fill="none" stroke="#6a3e1c" strokeWidth="4" />
      <circle cx="45" cy="12" r="8" fill={gem} {...S} className="gem-glow" />
      <circle cx="42" cy="9" r="2.5" fill="#fff" opacity=".8" />
    </>;
    default: return <>
      <path d="M32,4 L39,12 L37,42 L27,42 L25,12Z" fill={metal} {...S} />
      <path d="M32,8 V40" stroke="#fff" strokeWidth="1.5" opacity=".6" />
      <path d="M16,42 H48" stroke={gem} strokeWidth="6" strokeLinecap="round" />
      <path d="M32,44 V56" stroke="#6a3e1c" strokeWidth="6" strokeLinecap="round" />
      <circle cx="32" cy="58" r="4" fill={gem} {...S} />
    </>;
  }
}
const ITEM_PATHS = {
  weapon: (v, gem, metal) => weapon(v, gem, metal),
  helm: (v, gem, metal) => v === 1 ? <>
      <path d="M10,54 Q8,14 32,8 Q56,14 54,54 L44,54 Q44,30 32,28 Q20,30 20,54Z" fill="#3a2a40" {...S} />
      <path d="M20,54 Q20,30 32,28 Q44,30 44,54Z" fill="#0a0610" />
      <circle cx="26" cy="42" r="2.5" fill={gem} /><circle cx="38" cy="42" r="2.5" fill={gem} />
    </> : v === 2 ? <>
      <path d="M8,40 L8,24 L18,32 L26,14 L32,26 L38,14 L46,32 L56,24 L56,40Z" fill="url(#goldm)" {...S} />
      <path d="M8,40 H56 V48 H8Z" fill="url(#goldm)" {...S} />
      <circle cx="32" cy="34" r="5" fill={gem} {...S} />
    </> : <>
      <path d="M12,44 Q10,10 32,8 Q54,10 52,44Z" fill={metal} {...S} />
      <path d="M12,44 H52 L48,56 H16Z" fill={metal} {...S} />
      <path d="M22,30 H42 V36 H34 V50 H30 V36 H22Z" fill="#120a08" />
      <path d="M32,8 Q30,0 40,2" stroke={gem} strokeWidth="5" fill="none" strokeLinecap="round" />
    </>,
  armor: (v, gem, metal) => <>
    <path d="M14,12 L24,8 Q32,16 40,8 L50,12 L58,24 L50,30 L48,56 L16,56 L14,30 L6,24Z" fill={v === 1 ? '#7a4a22' : metal} {...S} />
    <path d="M24,8 Q32,16 40,8" fill="none" {...S} />
    {v === 2 ? <path d="M20,26 H44 M20,36 H44 M20,46 H44" stroke="#1a0e08" strokeWidth="2" opacity=".5" />
      : <path d="M32,18 V54" stroke="#1a0e08" strokeWidth="2" opacity=".4" />}
    <circle cx="32" cy="30" r="6" fill={gem} {...S} />
  </>,
  amulet: (v, gem) => <>
    <path d="M14,6 Q32,36 50,6" fill="none" stroke="url(#goldm)" strokeWidth="3" />
    <path d={v === 1 ? 'M32,24 L48,40 L32,60 L16,40Z' : v === 2 ? 'M32,26 A16,16 0 1 1 31.9,26Z' : 'M32,24 L46,32 L46,48 L32,58 L18,48 L18,32Z'} fill="url(#goldm)" {...S} />
    <circle cx="32" cy="42" r="8" fill={gem} {...S} className="gem-glow" />
    <circle cx="29" cy="39" r="2.5" fill="#fff" opacity=".8" />
  </>,
  ring: (v, gem) => <>
    <ellipse cx="32" cy="40" rx="18" ry="16" fill="none" stroke="#1a0e08" strokeWidth="10" />
    <ellipse cx="32" cy="40" rx="18" ry="16" fill="none" stroke="url(#goldm)" strokeWidth="6" />
    <path d="M22,22 L32,8 L42,22 L32,30Z" fill={gem} {...S} className="gem-glow" />
    <path d="M28,18 L32,12" stroke="#fff" strokeWidth="2" opacity=".8" />
  </>,
  boots: (v, gem, metal) => <>
    <path d="M18,6 H36 V36 L56,44 Q60,56 50,56 H14 Q10,56 12,46Z" fill={v === 1 ? '#6a4020' : '#5a3a20'} {...S} />
    <path d="M18,6 H36 V14 H18Z" fill={metal} {...S} />
    <path d="M14,50 H56" stroke="#1a0e08" strokeWidth="3" />
    <circle cx="27" cy="24" r="4" fill={gem} {...S} />
    <path d="M38,40 L44,34 M44,44 L50,38" stroke={gem} strokeWidth="2.5" opacity=".7" />
  </>,
};

export const ItemIcon = memo(function ItemIcon({ item }) {
  const gem = RARITIES[item.rar].color;
  const metal = item.ilvl > 80 ? 'url(#goldm)' : 'url(#metal)';
  return <svg viewBox="0 0 64 64" className="ico"><MetalDefs />{ITEM_PATHS[item.slot](item.variant, gem, metal)}</svg>;
});

export const SlotIcon = memo(function SlotIcon({ slot }) {
  return <svg viewBox="0 0 64 64" className="ico ghost-ico">{ITEM_PATHS[slot](slot === 'weapon' ? 'sword' : 0, '#4a3a2a', '#2a221a')}</svg>;
});

// ---------- Разные иконки ----------
const MISC = {
  shield: <><path d="M32,4 L56,12 Q56,40 32,60 Q8,40 8,12Z" fill="url(#metal)" {...S} /><path d="M32,10 L50,16 Q50,38 32,53 Q14,38 14,16Z" fill="#3a6ad0" /><path d="M32,18 V46 M20,28 H44" stroke="#ffe680" strokeWidth="5" strokeLinecap="round" /></>,
  heart: <><path d="M32,56 C10,40 4,28 8,18 C12,8 26,6 32,18 C38,6 52,8 56,18 C60,28 54,40 32,56Z" fill="#e0304a" {...S} /><path d="M18,18 Q20,14 25,14" stroke="#fff" strokeWidth="3" fill="none" opacity=".7" strokeLinecap="round" /></>,
  mug: <><path d="M12,18 H44 V52 Q44,58 38,58 H18 Q12,58 12,52Z" fill="#8a5a2a" {...S} /><path d="M44,24 H52 Q58,24 58,32 V38 Q58,46 50,46 H44" fill="none" stroke="#1a0e08" strokeWidth="6" /><path d="M44,24 H52 Q58,24 58,32 V38 Q58,46 50,46 H44" fill="none" stroke="#8a5a2a" strokeWidth="3" /><path d="M10,18 Q12,6 22,10 Q28,2 36,8 Q46,6 46,18Z" fill="#fff8e0" {...S} /><path d="M20,26 V50 M28,26 V50 M36,26 V50" stroke="#5a3418" strokeWidth="2" /></>,
  skull: <><path d="M14,30 C12,12 52,12 50,30 C50,38 46,42 44,44 V52 H20 V44 C18,42 14,38 14,30Z" fill="#e8dcc0" {...S} /><circle cx="24" cy="32" r="6" fill="#1a0e08" /><circle cx="40" cy="32" r="6" fill="#1a0e08" /><path d="M32,38 L29,44 H35Z" fill="#1a0e08" /><path d="M26,52 V46 M32,52 V46 M38,52 V46" stroke="#1a0e08" strokeWidth="2" /></>,
  rune: <><circle cx="32" cy="32" r="26" fill="#ffd040" opacity=".25" /><circle cx="32" cy="32" r="18" fill="none" stroke="#ffe680" strokeWidth="4" /><path d="M32,14 V50 M22,24 L42,40 M42,24 L22,40" stroke="#fff6c0" strokeWidth="4" strokeLinecap="round" /></>,
  rage: <><path d="M32,4 C40,18 52,24 50,40 C48,54 38,60 32,60 C22,60 12,52 14,38 C16,28 24,26 24,16 C30,22 30,28 32,30 C34,22 30,12 32,4Z" fill="#ff5a1a" {...S} /><path d="M32,30 C38,38 42,44 38,52 C34,58 26,56 26,48 C26,42 30,40 32,30Z" fill="#ffd040" /></>,
  clover: <>{[[32, 18], [18, 32], [46, 32], [32, 44]].slice(0, 4).map(([x, y], i) => <circle key={i} cx={x} cy={y} r="11" fill="#4ac050" {...S} />)}<path d="M32,32 Q36,50 44,60" stroke="#2a6a20" strokeWidth="4" fill="none" /><circle cx="32" cy="32" r="5" fill="#8ae070" /></>,
  coins: <><ellipse cx="24" cy="46" rx="16" ry="7" fill="url(#goldm)" {...S} /><ellipse cx="24" cy="38" rx="16" ry="7" fill="url(#goldm)" {...S} /><ellipse cx="40" cy="30" rx="16" ry="7" fill="url(#goldm)" {...S} /><ellipse cx="40" cy="22" rx="16" ry="7" fill="url(#goldm)" {...S} /><path d="M36,22 H44" stroke="#8a5a10" strokeWidth="2.5" /></>,
  fist: <><path d="M16,30 Q16,18 26,18 H44 Q52,18 52,28 V40 Q52,56 36,56 H28 Q16,56 16,44Z" fill="#e8a070" {...S} /><path d="M26,18 V32 M35,18 V32 M44,18 V32 M16,34 H30" stroke="#1a0e08" strokeWidth="2" /></>,
  d20: <><polygon points="32,4 56,18 56,46 32,60 8,46 8,18" fill="#6a38b0" {...S} /><polygon points="32,16 46,40 18,40" fill="#9a60e8" stroke="#d0b0ff" strokeWidth="1.5" /><text x="32" y="36" fontSize="11" fontWeight="800" textAnchor="middle" fill="#fff">20</text></>,
  target: <><circle cx="32" cy="32" r="26" fill="#e8dcc0" {...S} /><circle cx="32" cy="32" r="17" fill="#c0303a" {...S} /><circle cx="32" cy="32" r="8" fill="#e8dcc0" {...S} /><path d="M32,32 L56,8" stroke="#6a3e1c" strokeWidth="4" /><path d="M52,6 L58,4 L56,12Z" fill="#c0303a" /></>,
  scroll: <><path d="M14,10 H46 Q52,10 52,16 V54 H20 Q14,54 14,48Z" fill="#efe0bf" {...S} /><path d="M22,22 H44 M22,30 H44 M22,38 H38" stroke="#7a5a3a" strokeWidth="2.5" /><circle cx="44" cy="48" r="6" fill="#c0303a" {...S} /></>,
  blade: <><path d="M32,2 L40,10 L38,44 L26,44 L24,10Z" fill="url(#metal)" {...S} /><path d="M14,44 H50" stroke="#b77cff" strokeWidth="6" strokeLinecap="round" /><path d="M32,46 V60" stroke="#3a2414" strokeWidth="6" strokeLinecap="round" /></>,
  hoard: <><path d="M6,54 L18,34 H46 L58,54Z" fill="url(#goldm)" {...S} /><circle cx="22" cy="30" r="7" fill="url(#goldm)" {...S} /><circle cx="38" cy="26" r="8" fill="url(#goldm)" {...S} /><circle cx="30" cy="44" r="5" fill="#e0203a" {...S} /></>,
  die: <><rect x="10" y="10" width="44" height="44" rx="9" fill="#f4ecd8" {...S} /><circle cx="22" cy="22" r="4" fill="#c0303a" /><circle cx="42" cy="42" r="4" fill="#c0303a" /><circle cx="32" cy="32" r="4" fill="#c0303a" /><circle cx="42" cy="22" r="4" fill="#c0303a" /><circle cx="22" cy="42" r="4" fill="#c0303a" /></>,
  hourglass: <><path d="M14,6 H50 M14,58 H50" stroke="#6a3e1c" strokeWidth="5" strokeLinecap="round" /><path d="M18,8 Q18,28 32,32 Q18,36 18,56 H46 Q46,36 32,32 Q46,28 46,8Z" fill="#d0e8ff" opacity=".7" {...S} /><path d="M24,56 Q32,44 40,56Z M26,16 H38 L32,26Z" fill="#e8c060" /></>,
  tome: <><path d="M10,12 Q22,6 32,12 Q42,6 54,12 V54 Q42,48 32,54 Q22,48 10,54Z" fill="#7a2a2a" {...S} /><path d="M32,12 V54" stroke="#1a0e08" strokeWidth="2.5" /><circle cx="21" cy="30" r="5" fill="url(#goldm)" /><path d="M38,24 H48 M38,32 H48" stroke="#e8c060" strokeWidth="2" /></>,
  anvil: <><path d="M8,20 H44 Q56,20 58,28 H44 V34 L50,44 H18 L24,34 V28 Q10,28 8,20Z" fill="#5a626c" {...S} /><path d="M14,44 H54 V54 H14Z" fill="#3a4048" {...S} /><path d="M30,6 L34,16 M40,4 L38,14 M22,8 L28,16" stroke="#ff9a3a" strokeWidth="3" strokeLinecap="round" /></>,
  bag: <><path d="M20,18 Q32,10 44,18 L50,52 Q32,60 14,52Z" fill="#7a4a22" {...S} /><path d="M22,18 Q32,26 42,18" stroke="#c9a24a" strokeWidth="3" fill="none" /><circle cx="32" cy="38" r="7" fill="#1a0a24" stroke="#b77cff" strokeWidth="2" /></>,
  banner: <><path d="M14,4 V60" stroke="#6a3e1c" strokeWidth="5" strokeLinecap="round" /><path d="M16,8 H52 L44,22 L52,36 H16Z" fill="#c0303a" {...S} /><path d="M26,16 L30,24 L36,14" stroke="#ffd040" strokeWidth="3" fill="none" /></>,
  prism: <><path d="M32,4 L56,46 L32,60 L8,46Z" fill="#9a60e8" {...S} /><path d="M32,4 L32,60 M8,46 L56,46" stroke="#d0b0ff" strokeWidth="1.5" /><path d="M32,4 L56,46 L32,40Z" fill="#c090ff" opacity=".6" /></>,
  chest: <><path d="M6,28 Q32,6 58,28 V34 H6Z" fill="#6b3b1d" {...S} /><rect x="6" y="32" width="52" height="24" fill="#83492a" {...S} /><rect x="4" y="28" width="56" height="6" fill="#c9a24a" {...S} /><rect x="27" y="32" width="10" height="12" rx="2" fill="#e8c766" {...S} /></>,
  dust: <><path d="M32,6 L40,24 L58,28 L44,40 L48,58 L32,48 L16,58 L20,40 L6,28 L24,24Z" fill="#7ad0ff" {...S} /><circle cx="32" cy="32" r="6" fill="#e8f8ff" /></>,
  lock: <><rect x="14" y="28" width="36" height="28" rx="5" fill="url(#goldm)" {...S} /><path d="M22,28 V20 Q22,10 32,10 Q42,10 42,20 V28" fill="none" stroke="#1a0e08" strokeWidth="6" /><path d="M22,28 V20 Q22,10 32,10 Q42,10 42,20 V28" fill="none" stroke="#c0c8d0" strokeWidth="3" /><circle cx="32" cy="40" r="4" fill="#1a0e08" /></>,
  swords: <><path d="M14,50 L44,12 L52,12 L52,20 L18,54Z" fill="url(#metal)" {...S} /><path d="M50,50 L20,12 L12,12 L12,20 L46,54Z" fill="url(#metal)" {...S} /></>,
  hero: <><circle cx="32" cy="20" r="12" fill="#e8a070" {...S} /><path d="M10,60 Q12,36 32,36 Q52,36 54,60Z" fill="#5a86ee" {...S} /><path d="M20,18 Q32,0 44,18 Q32,12 20,18Z" fill="#6a3e1c" {...S} /></>,
  backpack: <><path d="M14,20 Q14,10 32,10 Q50,10 50,20 V56 H14Z" fill="#7a4a22" {...S} /><rect x="20" y="30" width="24" height="16" rx="3" fill="#5a3418" {...S} /><path d="M24,10 Q24,4 32,4 Q40,4 40,10" fill="none" stroke="#1a0e08" strokeWidth="3" /><circle cx="32" cy="38" r="3" fill="#c9a24a" /></>,
  gem: <><path d="M16,10 H48 L58,24 L32,58 L6,24Z" fill="#b77cff" {...S} /><path d="M6,24 H58 M16,10 L24,24 L32,58 L40,24 L48,10 M24,24 L32,10 L40,24" stroke="#e8d0ff" strokeWidth="1.5" fill="none" /></>,
};
export const Icon = memo(function Icon({ name, className = '' }) {
  return <svg viewBox="0 0 64 64" className={'ico ' + className}><MetalDefs />{MISC[name]}</svg>;
});

// ---------- Кубики ----------
export const DIE_SHAPES = {
  4: '50,6 94,88 6,88', 6: '12,12 88,12 88,88 12,88', 8: '50,4 94,50 50,96 6,50',
  10: '50,4 94,42 50,96 6,42', 12: '50,4 94,36 78,92 22,92 6,36', 20: '50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5',
};
export function DieIcon({ sides, color = '#e8b84a' }) {
  return <svg viewBox="0 0 100 100" className="die-ico"><polygon points={DIE_SHAPES[sides]} fill="none" stroke={color} strokeWidth="10" strokeLinejoin="round" /></svg>;
}
export function D20({ value, state = '', className = '' }) {
  return (
    <svg viewBox="0 0 100 100" className={`d20 ${state} ${className}`}>
      <defs>
        <linearGradient id="d20g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#8a52d8" /><stop offset="100%" stopColor="#3a1878" /></linearGradient>
      </defs>
      <polygon className="d20-outer" points="50,3 91,26.5 91,73.5 50,97 9,73.5 9,26.5" />
      <polygon className="d20-face" points="50,22 77,68 23,68" />
      <polyline className="d20-edge" points="50,3 50,22 91,26.5 77,68 91,73.5 50,97 23,68 9,73.5 23,68 9,26.5 50,22" />
      <line className="d20-edge" x1="77" y1="68" x2="50" y2="97" /><line className="d20-edge" x1="23" y1="68" x2="50" y2="97" />
      <text x="50" y="58" className="d20-num">{value}</text>
    </svg>
  );
}
