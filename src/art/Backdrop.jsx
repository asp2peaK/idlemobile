import { memo, useMemo } from 'react';
import { rng } from '../engine/monsters.js';

const PAL = {
  dungeon: { sky: ['#140e0a', '#2a1e14'], far: '#1e160f', near: '#0e0a07', floor: '#1a130d', light: '#ff9a3a' },
  forest:  { sky: ['#0a1410', '#1e3020'], far: '#14241a', near: '#08120c', floor: '#101c12', light: '#9ad070' },
  crypt:   { sky: ['#0c0a16', '#221c34'], far: '#1a1628', near: '#0a0812', floor: '#16121e', light: '#9a7aff' },
  swamp:   { sky: ['#0e140a', '#2a3418'], far: '#1c2412', near: '#0c1006', floor: '#1a2210', light: '#c0e060' },
  lava:    { sky: ['#1a0604', '#4a1408'], far: '#2a0c06', near: '#120402', floor: '#2a0a04', light: '#ff5a1a' },
  ice:     { sky: ['#0a1824', '#2a5070'], far: '#4a7090', near: '#1a3448', floor: '#a0c8e0', light: '#bfefff' },
  ruins:   { sky: ['#2a1a0a', '#7a4a20'], far: '#5a3418', near: '#2a1a0c', floor: '#8a6030', light: '#ffc04a' },
  sky:     { sky: ['#1a2a5a', '#b08a60'], far: '#d0c0a0', near: '#5a4a6a', floor: '#e8e0d0', light: '#fff0a0' },
  abyss:   { sky: ['#0a0210', '#2a0a3a'], far: '#1e0a2a', near: '#0a0410', floor: '#14061e', light: '#d040ff' },
  astral:  { sky: ['#02030a', '#101a3a'], far: '#1a2a5a', near: '#060a1a', floor: '#0a1030', light: '#60f0ff' },
};

function Scene({ kind, p, seed }) {
  const r = rng(seed);
  switch (kind) {
    case 'dungeon': case 'crypt':
      return <>
        {[40, 160, 280, 400].map((x, i) => <g key={i} fill={p.far}>
          <rect x={x - 70} y="40" width="26" height="220" /><path d={`M${x - 70},60 Q${x - 10},-10 ${x + 50},60 L${x + 50},40 L${x - 70},40Z`} />
        </g>)}
        <path d="M0,40 H400 V0 H0Z" fill={p.far} />
        {kind === 'crypt' && [30, 110, 290, 360].map((x, i) =>
          <path key={i} d={`M${x - 14},250 V214 Q${x},196 ${x + 14},214 V250Z M${x - 3},206 V190 M${x - 10},197 H${x + 4}`} fill={p.near} stroke={p.near} strokeWidth="4" />)}
        {kind === 'dungeon' && <path d="M0,110 L18,110 L18,250 L0,250Z M382,110 L400,110 L400,250 L382,250Z" fill={p.near} />}
        {kind === 'dungeon' && <path d="M60,0 L60,40 M60,40 a6,6 0 1 0 0.1,0 M340,0 L340,50 M340,50 a6,6 0 1 0 0.1,0" stroke="#2a1e14" strokeWidth="3" fill="none" />}
      </>;
    case 'forest': case 'swamp':
      return <>
        {Array.from({ length: 9 }, (_, i) => {
          const x = i * 50 - 10 + r() * 20, h = 120 + r() * 80;
          return kind === 'forest'
            ? <path key={i} d={`M${x},250 L${x},${250 - h * 0.3} L${x - 28},${250 - h * 0.3} L${x},${250 - h} L${x + 28},${250 - h * 0.3} L${x},${250 - h * 0.3}Z`} fill={p.far} />
            : <path key={i} d={`M${x},250 L${x + 4},${250 - h} M${x + 3},${250 - h * 0.7} L${x - 20},${250 - h * 0.9} M${x + 2},${250 - h * 0.5} L${x + 24},${250 - h * 0.65}`} stroke={p.far} strokeWidth={6} strokeLinecap="round" />;
        })}
        {Array.from({ length: 5 }, (_, i) => {
          const x = i * 100 + r() * 30 - 20, h = 180 + r() * 60;
          return kind === 'forest'
            ? <path key={'n' + i} d={`M${x},260 L${x - 40},${260 - h * 0.35} L${x - 14},${260 - h * 0.4} L${x - 30},${260 - h * 0.65} L${x},${260 - h} L${x + 30},${260 - h * 0.65} L${x + 14},${260 - h * 0.4} L${x + 40},${260 - h * 0.35}Z`} fill={p.near} opacity={i === 2 ? 0 : 1} />
            : <path key={'n' + i} d={`M${x},260 Q${x + 6},${260 - h * 0.5} ${x - 4},${260 - h * 0.8} M${x},${260 - h * 0.55} Q${x - 26},${260 - h * 0.7} ${x - 36},${260 - h * 0.6}`} stroke={p.near} strokeWidth={9} fill="none" strokeLinecap="round" opacity={i === 2 ? 0 : 1} />;
        })}
        {kind === 'swamp' && <ellipse cx="200" cy="262" rx="220" ry="18" fill="#2a3a14" opacity=".6" />}
      </>;
    case 'lava':
      return <>
        <path d="M0,0 H400 V20 L370,60 L350,24 L320,80 L300,20 L260,50 L230,16 L190,70 L160,18 L120,56 L90,14 L60,74 L30,22 L0,50Z" fill={p.near} />
        <path d="M0,250 Q40,180 80,200 Q120,150 170,190 Q230,140 280,190 Q330,160 400,200 V260 H0Z" fill={p.far} />
        <path d="M0,262 Q100,250 200,262 T400,262 V300 H0Z" fill="#ff5a1a" opacity=".55" className="lava-flow" />
      </>;
    case 'ice':
      return <>
        <path d="M0,220 L60,110 L100,170 L160,70 L220,160 L280,90 L340,170 L400,120 V260 H0Z" fill={p.far} />
        <path d="M160,70 L178,100 L168,98 L160,110 L150,96 L144,98Z M280,90 L294,114 L280,108 L268,114Z" fill="#e8f8ff" />
        <path d="M0,250 L40,190 L70,230 L110,200 L140,250Z M260,250 L300,180 L330,230 L370,190 L400,230 V250Z" fill={p.near} />
      </>;
    case 'ruins':
      return <>
        <circle cx="300" cy="80" r="40" fill="#ffd080" opacity=".35" />
        <path d="M0,230 Q100,200 200,220 T400,210 V260 H0Z" fill={p.far} />
        {[50, 120, 300, 360].map((x, i) => <g key={i} fill={p.near}>
          <rect x={x - 12} y={110 + (i % 2) * 30} width="24" height={150 - (i % 2) * 30} />
          <rect x={x - 18} y={102 + (i % 2) * 30} width="36" height="10" />
        </g>)}
        <path d="M108,140 L170,140 L170,150 L108,150Z" fill={p.near} />
      </>;
    case 'sky':
      return <>
        {[60, 200, 340].map((x, i) => <g key={i} fill={p.near}>
          <rect x={x - 14} y={70 + i * 10} width="28" height="160" /><path d={`M${x - 20},${74 + i * 10} L${x},${30 + i * 10} L${x + 20},${74 + i * 10}Z`} />
        </g>)}
        {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx={i * 80 + r() * 30} cy={220 + r() * 30} rx={70} ry={22} fill="#fff" opacity=".55" className="cloud" style={{ animationDelay: `${i * -3}s` }} />)}
      </>;
    case 'abyss': case 'astral':
      return <>
        {Array.from({ length: kind === 'astral' ? 60 : 25 }, (_, i) => <circle key={i} cx={r() * 400} cy={r() * 220} r={r() * 1.6 + 0.3} fill="#fff" opacity={r() * 0.7 + 0.2} className="twinkle" style={{ animationDelay: `${r() * 3}s` }} />)}
        {kind === 'astral' && <><circle cx="80" cy="70" r="30" fill="#7a5aff" opacity=".25" /><circle cx="320" cy="60" r="16" fill="#60f0ff" opacity=".3" /></>}
        {[[60, 180, 50], [330, 150, 40], [200, 80, 22]].map(([x, y, w], i) =>
          <path key={i} d={`M${x - w},${y} L${x + w},${y} L${x + w * 0.5},${y + w * 0.8} L${x},${y + w * 1.3} L${x - w * 0.6},${y + w * 0.7}Z`} fill={p.far} className="float-y" style={{ animationDelay: `${i}s` }} />)}
      </>;
    default: return null;
  }
}

function Particles({ type, color }) {
  const items = useMemo(() => {
    const r = rng(type.length * 31);
    return Array.from({ length: 18 }, () => ({ x: r() * 100, d: 4 + r() * 6, delay: -r() * 10, s: 2 + r() * 3 }));
  }, [type]);
  return (
    <div className={`particles p-${type}`}>
      {items.map((it, i) => <i key={i} style={{ left: it.x + '%', animationDuration: it.d + 's', animationDelay: it.delay + 's', width: it.s, height: it.s, background: color }} />)}
    </div>
  );
}

function Backdrop({ biome, seed }) {
  const p = PAL[biome.kind] || PAL.dungeon;
  return (
    <div className="backdrop">
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={p.sky[0]} /><stop offset="100%" stopColor={p.sky[1]} /></linearGradient>
          <radialGradient id="lightg" cx="50%" cy="55%" r="50%"><stop offset="0%" stopColor={p.light} stopOpacity=".32" /><stop offset="100%" stopColor={p.light} stopOpacity="0" /></radialGradient>
          <linearGradient id="floorg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={p.floor} /><stop offset="100%" stopColor="#000" /></linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#skyg)" />
        <Scene kind={biome.kind} p={p} seed={seed} />
        <path d="M0,252 Q200,238 400,252 V300 H0Z" fill="url(#floorg)" />
        <rect width="400" height="300" fill="url(#lightg)" />
      </svg>
      <Particles type={biome.particles} color={biome.glow} />
    </div>
  );
}

export default memo(Backdrop);
