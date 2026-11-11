import { useId, memo } from 'react';
import { rng } from '../engine/monsters.js';

const hsl = (h, s, l, a = 1) => `hsla(${h}, ${s}%, ${Math.max(0, Math.min(100, l))}%, ${a})`;

function Eye({ x, y, r, iris = '#ffd23a', slit, glow, sclera = '#f4ecd8' }) {
  return (
    <g className="blink">
      {glow && <circle cx={x} cy={y} r={r * 1.9} fill={iris} opacity=".25" />}
      <circle cx={x} cy={y} r={r} fill={sclera} stroke="#1a0e08" strokeWidth={r * 0.22} />
      <circle cx={x} cy={y} r={r * 0.62} fill={iris} />
      {slit ? <ellipse cx={x} cy={y} rx={r * 0.16} ry={r * 0.55} fill="#120806" />
            : <circle cx={x} cy={y} r={r * 0.3} fill="#120806" />}
      <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.18} fill="#fff" opacity=".9" />
    </g>
  );
}
function GlowEye({ x, y, r, c }) {
  return (
    <g className="blink">
      <circle cx={x} cy={y} r={r * 2.2} fill={c} opacity=".22" />
      <ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill={c} />
      <ellipse cx={x} cy={y} rx={r * 0.45} ry={r * 0.35} fill="#fff" />
    </g>
  );
}
function Fangs({ x1, x2, y, n = 4, h = 10, c = '#f6efdc' }) {
  const w = (x2 - x1) / n;
  let dd = '';
  for (let i = 0; i < n; i++) dd += `M${x1 + i * w},${y} L${x1 + i * w + w / 2},${y + h * (i % 2 ? 0.7 : 1)} L${x1 + (i + 1) * w},${y} Z `;
  return <path d={dd} fill={c} stroke="#2a1a10" strokeWidth="1.2" strokeLinejoin="round" />;
}
function Horns({ cx, y, spread = 34, size = 30, c = '#e8dcc0', curl = 1 }) {
  return (
    <g fill={c} stroke="#2a1a10" strokeWidth="2.5" strokeLinejoin="round">
      <path d={`M${cx - spread},${y} Q${cx - spread - size * 0.9},${y - size * 0.3} ${cx - spread - size * 0.5 * curl},${y - size * 1.25} Q${cx - spread - size * 0.1},${y - size * 0.55} ${cx - spread + 12},${y - 4} Z`} />
      <path d={`M${cx + spread},${y} Q${cx + spread + size * 0.9},${y - size * 0.3} ${cx + spread + size * 0.5 * curl},${y - size * 1.25} Q${cx + spread + size * 0.1},${y - size * 0.55} ${cx + spread - 12},${y - 4} Z`} />
    </g>
  );
}
function Crown({ cx, y, w = 56 }) {
  const x = cx - w / 2;
  return (
    <g>
      <path d={`M${x},${y} L${x},${y - 22} L${x + w * 0.2},${y - 10} L${x + w * 0.5},${y - 32} L${x + w * 0.8},${y - 10} L${x + w},${y - 22} L${x + w},${y} Z`}
        fill="url(#gold)" stroke="#5a3a08" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={cx} cy={y - 10} r="5" fill="#e0203a" stroke="#5a0a10" strokeWidth="1.5" />
      <circle cx={x + w * 0.2} cy={y - 6} r="3" fill="#30a0ff" /><circle cx={x + w * 0.8} cy={y - 6} r="3" fill="#30a0ff" />
    </g>
  );
}
function Spikes({ cx, y, n = 5, w = 90, h = 16, c }) {
  let dd = '';
  const step = w / n;
  for (let i = 0; i < n; i++) {
    const x = cx - w / 2 + i * step;
    dd += `M${x},${y} L${x + step / 2},${y - h - (i === Math.floor(n / 2) ? 6 : 0)} L${x + step},${y} Z `;
  }
  return <path d={dd} fill={c} stroke="#1a0e08" strokeWidth="2" strokeLinejoin="round" />;
}

// ---------------- Архетипы ----------------
function Slime({ p, g }) {
  return (
    <g>
      <path d="M28,176 C24,104 58,52 100,52 C142,52 176,104 172,176 Q154,188 138,176 Q120,190 100,178 Q80,190 62,176 Q46,188 28,176Z"
        fill={`url(#${g}b)`} stroke={p.dark} strokeWidth="4" opacity=".95" />
      <path d="M55,150 Q60,168 52,182" stroke={p.light} strokeWidth="6" fill="none" strokeLinecap="round" opacity=".5" />
      <circle cx="140" cy="150" r="7" fill={p.light} opacity=".4" /><circle cx="128" cy="128" r="4" fill={p.light} opacity=".4" />
      <ellipse cx="72" cy="84" rx="16" ry="9" fill="#fff" opacity=".45" transform="rotate(-25 72 84)" />
      {p.eyes === 1 ? <Eye x={100} y={112} r={20} iris={p.iris} /> :
        p.eyes === 2 ? <><Eye x={80} y={112} r={13} iris={p.iris} /><Eye x={120} y={112} r={13} iris={p.iris} /></> :
        <><Eye x={74} y={116} r={11} iris={p.iris} /><Eye x={100} y={98} r={13} iris={p.iris} /><Eye x={126} y={116} r={11} iris={p.iris} /></>}
      <path d="M78,146 Q100,164 122,146" stroke={p.dark} strokeWidth="5" fill="none" strokeLinecap="round" />
      {p.horns && <Horns cx={100} y={70} spread={26} size={22} c={p.bone} />}
    </g>
  );
}

function Goblin({ p, g }) {
  return (
    <g>
      <path d="M36,200 Q44,150 100,148 Q156,150 164,200Z" fill={p.cloth} stroke="#1a0e08" strokeWidth="3" />
      <path d="M78,150 L100,175 L122,150" fill="none" stroke="#1a0e08" strokeWidth="3" opacity=".5" />
      <path d="M62,100 L6,64 L18,92 L58,126Z" fill={p.base} stroke={p.dark} strokeWidth="3" strokeLinejoin="round" />
      <path d="M138,100 L194,64 L182,92 L142,126Z" fill={p.base} stroke={p.dark} strokeWidth="3" strokeLinejoin="round" />
      <path d="M22,76 L52,104" stroke={p.dark} strokeWidth="3" opacity=".5" /><path d="M178,76 L148,104" stroke={p.dark} strokeWidth="3" opacity=".5" />
      <ellipse cx="100" cy="106" rx="48" ry="52" fill={`url(#${g}b)`} stroke={p.dark} strokeWidth="3.5" />
      <path d="M64,86 L94,94" stroke={p.dark} strokeWidth="6" strokeLinecap="round" />
      <path d="M136,86 L106,94" stroke={p.dark} strokeWidth="6" strokeLinecap="round" />
      {p.eyes === 1 ? <Eye x={100} y={102} r={13} iris={p.iris} slit /> :
        <><Eye x={80} y={102} r={10} iris={p.iris} slit /><Eye x={120} y={102} r={10} iris={p.iris} slit /></>}
      {p.eyes === 3 && <Eye x={100} y={76} r={7} iris={p.iris} slit />}
      <path d="M100,104 Q88,128 92,132 Q100,136 108,132 Q112,128 100,104Z" fill={p.dark} opacity=".7" />
      <path d="M68,138 Q100,166 132,138 Q100,152 68,138Z" fill="#2a0e0a" stroke={p.dark} strokeWidth="2.5" />
      <Fangs x1={74} x2={126} y={141} n={6} h={8} />
      {p.scar && <path d="M118,74 L134,118 M120,86 L130,84 M124,98 L134,96" stroke="#6a1a10" strokeWidth="3" strokeLinecap="round" />}
      {p.horns && !p.crown && <Horns cx={100} y={70} spread={22} size={20} c={p.bone} />}
      {p.crown && <Crown cx={100} y={62} w={60} />}
    </g>
  );
}

function Skull({ p }) {
  return (
    <g>
      {p.horns && <Horns cx={100} y={80} spread={40} size={40} c={p.dark} curl={1.4} />}
      <path d="M44,104 C40,40 160,40 156,104 C156,128 144,138 138,144 L138,158 L62,158 L62,144 C56,138 44,128 44,104Z"
        fill="url(#bone)" stroke="#2a2218" strokeWidth="4" />
      <path d="M62,52 Q80,44 96,48" stroke="#fff" strokeWidth="5" fill="none" opacity=".5" strokeLinecap="round" />
      <ellipse cx="76" cy="106" rx="17" ry="19" fill="#120c0a" />
      <ellipse cx="124" cy="106" rx="17" ry="19" fill="#120c0a" />
      <GlowEye x={76} y={108} r={6} c={p.glow} /><GlowEye x={124} y={108} r={6} c={p.glow} />
      <path d="M100,124 L90,140 L110,140Z" fill="#120c0a" />
      <rect x="66" y="156" width="68" height="26" rx="8" fill="url(#bone)" stroke="#2a2218" strokeWidth="4" />
      <path d="M66,166 H134 M78,156 V182 M90,156 V182 M100,156 V182 M110,156 V182 M122,156 V182" stroke="#2a2218" strokeWidth="2.5" />
      {(p.scar || true) && <path d="M120,52 L112,70 L122,78 L114,92" stroke="#2a2218" strokeWidth="2.5" fill="none" />}
      {p.crown && <Crown cx={100} y={56} w={64} />}
    </g>
  );
}

function Beast({ p, g }) {
  return (
    <g>
      <path d="M50,26 L80,82 L36,94Z" fill={p.dark} stroke="#1a0e08" strokeWidth="3" strokeLinejoin="round" />
      <path d="M150,26 L120,82 L164,94Z" fill={p.dark} stroke="#1a0e08" strokeWidth="3" strokeLinejoin="round" />
      <path d="M54,40 L72,78 L46,86Z" fill={p.light} opacity=".5" /><path d="M146,40 L128,78 L154,86Z" fill={p.light} opacity=".5" />
      <path d="M30,110 L18,128 L40,130 L30,150 L56,146 Z M170,110 L182,128 L160,130 L170,150 L144,146Z" fill={p.dark} stroke="#1a0e08" strokeWidth="2.5" />
      <path d="M100,52 C150,52 172,96 158,136 C148,164 124,178 100,178 C76,178 52,164 42,136 C28,96 50,52 100,52Z" fill={`url(#${g}b)`} stroke="#1a0e08" strokeWidth="3.5" />
      <path d="M100,108 C126,108 136,130 132,150 C126,170 74,170 68,150 C64,130 74,108 100,108Z" fill={p.light} stroke={p.dark} strokeWidth="2" />
      <path d="M64,96 L90,104" stroke="#1a0e08" strokeWidth="5" strokeLinecap="round" /><path d="M136,96 L110,104" stroke="#1a0e08" strokeWidth="5" strokeLinecap="round" />
      <Eye x={78} y={110} r={9} iris={p.iris} slit glow /><Eye x={122} y={110} r={9} iris={p.iris} slit glow />
      <path d="M86,124 Q100,116 114,124 Q108,136 100,136 Q92,136 86,124Z" fill="#140a08" />
      <path d="M80,152 Q100,168 120,152" fill="#2a0e0a" stroke="#1a0e08" strokeWidth="2.5" />
      <path d="M84,152 L88,166 L92,153 M116,152 L112,166 L108,153" fill="#f6efdc" stroke="#2a1a10" strokeWidth="1.2" />
      {p.scar && <path d="M60,80 L84,132" stroke="#6a1a10" strokeWidth="3.5" strokeLinecap="round" />}
      {p.horns && <Horns cx={100} y={62} spread={20} size={26} c={p.bone} />}
      {p.crown && <Crown cx={100} y={58} w={54} />}
    </g>
  );
}

function EyeTyrant({ p, g }) {
  const r = rng(p.seed);
  const tent = Array.from({ length: 6 }, (_, i) => {
    const x = 50 + i * 20, wob = (r() - 0.5) * 30;
    return `M${x},140 C${x + wob},165 ${x - wob},175 ${x + wob * 0.6},196`;
  });
  return (
    <g>
      {tent.map((dd, i) => <path key={i} d={dd} stroke={p.dark} strokeWidth="11" fill="none" strokeLinecap="round" className="sway" style={{ animationDelay: `${i * 0.2}s` }} />)}
      {tent.map((dd, i) => <path key={'l' + i} d={dd} stroke={p.base} strokeWidth="6" fill="none" strokeLinecap="round" className="sway" style={{ animationDelay: `${i * 0.2}s` }} />)}
      <circle cx="100" cy="94" r="64" fill={`url(#${g}b)`} stroke="#1a0e08" strokeWidth="4" />
      <ellipse cx="100" cy="96" rx="44" ry="40" fill="#f4ecd8" stroke={p.dark} strokeWidth="3" />
      <path d="M62,84 Q76,90 70,104 M138,82 Q124,92 132,106 M70,122 Q84,116 86,128" stroke="#c0303a" strokeWidth="1.8" fill="none" opacity=".7" />
      <g className="look">
        <circle cx="100" cy="98" r="24" fill={p.iris} stroke="#1a0e08" strokeWidth="2" />
        <circle cx="100" cy="98" r="24" fill={`url(#${g}iris)`} />
        <ellipse cx="100" cy="98" rx="6" ry="19" fill="#0a0604" />
        <circle cx="90" cy="88" r="5" fill="#fff" />
      </g>
      <path d="M52,74 Q100,32 148,74 Q100,58 52,74Z" fill={p.dark} stroke="#1a0e08" strokeWidth="2.5" />
      {p.spikes && <Spikes cx={100} y={36} n={5} w={80} h={14} c={p.dark} />}
      {p.crown && <Crown cx={100} y={34} w={56} />}
    </g>
  );
}

function Spider({ p, g }) {
  const legs = [
    'M76,112 L36,78 L8,112', 'M74,122 L28,108 L6,148', 'M76,132 L32,142 L18,184', 'M82,140 L52,170 L46,198',
    'M124,112 L164,78 L192,112', 'M126,122 L172,108 L194,148', 'M124,132 L168,142 L182,184', 'M118,140 L148,170 L154,198',
  ];
  return (
    <g>
      <g className="legs">
        {legs.map((l, i) => <path key={i} d={l} stroke="#140a08" strokeWidth="9" fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
        {legs.map((l, i) => <path key={'c' + i} d={l} stroke={p.dark} strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
      </g>
      <ellipse cx="100" cy="150" rx="48" ry="36" fill={`url(#${g}b)`} stroke="#140a08" strokeWidth="4" />
      <path d="M92,134 L108,134 L100,150 L108,166 L92,166 L100,150Z" fill="#d0202a" stroke="#5a0a10" strokeWidth="2" />
      <ellipse cx="100" cy="106" rx="34" ry="30" fill={p.base} stroke="#140a08" strokeWidth="4" />
      <ellipse cx="90" cy="92" rx="10" ry="5" fill="#fff" opacity=".25" />
      {[[86, 100, 7], [114, 100, 7], [74, 90, 4.5], [126, 90, 4.5], [92, 86, 3.5], [108, 86, 3.5]].map(([x, y, r], i) =>
        <GlowEye key={i} x={x} y={y} r={r} c={p.glow2} />)}
      <path d="M88,124 Q82,140 92,142 M112,124 Q118,140 108,142" stroke="#f0e6d0" strokeWidth="5" fill="none" strokeLinecap="round" />
      {p.crown && <Crown cx={100} y={80} w={48} />}
    </g>
  );
}

function Ghost({ p, g }) {
  return (
    <g className="float-y">
      <path d="M44,192 L44,96 C44,36 156,36 156,96 L156,192 Q142,174 128,192 Q114,174 100,192 Q86,174 72,192 Q58,174 44,192Z"
        fill={`url(#${g}ghost)`} stroke={p.light} strokeWidth="3" opacity=".92" />
      <path d="M44,120 Q20,130 14,160 Q30,150 44,150 M156,120 Q180,130 186,160 Q170,150 156,150" fill={`url(#${g}ghost)`} stroke={p.light} strokeWidth="2.5" opacity=".8" />
      <ellipse cx="78" cy="96" rx="12" ry="19" fill="#0a0814" /><ellipse cx="122" cy="96" rx="12" ry="19" fill="#0a0814" />
      <GlowEye x={78} y={100} r={4} c={p.glow} /><GlowEye x={122} y={100} r={4} c={p.glow} />
      <ellipse cx="100" cy="142" rx="14" ry="20" fill="#0a0814" />
      <ellipse cx="72" cy="62" rx="14" ry="8" fill="#fff" opacity=".35" transform="rotate(-20 72 62)" />
      {p.crown && <Crown cx={100} y={48} w={56} />}
    </g>
  );
}

function Golem({ p, g }) {
  return (
    <g>
      <path d="M20,120 L44,92 L64,110 L56,170 L26,172Z" fill={`url(#${g}b)`} stroke="#140a08" strokeWidth="4" strokeLinejoin="round" />
      <path d="M180,120 L156,92 L136,110 L144,170 L174,172Z" fill={`url(#${g}b)`} stroke="#140a08" strokeWidth="4" strokeLinejoin="round" />
      <path d="M50,96 L70,70 L130,70 L150,96 L142,184 L58,184Z" fill={`url(#${g}b)`} stroke="#140a08" strokeWidth="4" strokeLinejoin="round" />
      <path d="M72,30 L128,30 L136,72 L64,72Z" fill={p.base} stroke="#140a08" strokeWidth="4" strokeLinejoin="round" />
      <path d="M78,50 H94 M106,50 H122" stroke={p.glow} strokeWidth="7" strokeLinecap="round" className="pulse-glow" />
      <path d="M86,64 H114" stroke="#140a08" strokeWidth="3" />
      <path d="M100,86 L90,112 L104,124 L94,150 M74,110 L86,122 M126,104 L114,128 L124,146" stroke={p.glow} strokeWidth="3.5" fill="none" strokeLinecap="round" className="pulse-glow" />
      <circle cx="100" cy="120" r="9" fill="none" stroke={p.glow} strokeWidth="3" className="pulse-glow" />
      <path d="M60,100 L80,96 M126,160 L138,150" stroke={p.light} strokeWidth="3" opacity=".4" />
      {p.spikes && <Spikes cx={100} y={72} n={4} w={50} h={12} c={p.dark} />}
      {p.crown && <Crown cx={100} y={30} w={56} />}
    </g>
  );
}

function Demon({ p, g }) {
  return (
    <g>
      <path d="M40,120 Q0,80 10,40 Q30,70 50,74 Q40,50 54,30 Q64,70 70,90Z M160,120 Q200,80 190,40 Q170,70 150,74 Q160,50 146,30 Q136,70 130,90Z"
        fill={p.dark} stroke="#140a08" strokeWidth="3" strokeLinejoin="round" opacity=".9" />
      <Horns cx={100} y={64} spread={30} size={46} c="#2a1a14" curl={1.6} />
      <path d="M100,46 C146,46 158,84 154,116 C150,150 126,180 100,182 C74,180 50,150 46,116 C42,84 54,46 100,46Z" fill={`url(#${g}b)`} stroke="#140a08" strokeWidth="4" />
      <path d="M62,92 L94,104" stroke="#140a08" strokeWidth="7" strokeLinecap="round" /><path d="M138,92 L106,104" stroke="#140a08" strokeWidth="7" strokeLinecap="round" />
      <GlowEye x={80} y={108} r={8} c="#ffe040" /><GlowEye x={120} y={108} r={8} c="#ffe040" />
      <path d="M90,128 L100,122 L110,128" stroke="#140a08" strokeWidth="3" fill="none" />
      <path d="M64,146 Q100,176 136,146 Q100,160 64,146Z" fill="#2a0408" stroke="#140a08" strokeWidth="3" />
      <Fangs x1={68} x2={132} y={148} n={8} h={9} />
      <path d="M100,182 Q96,196 100,200 Q104,196 100,182" fill={p.dark} />
      {p.scar && <path d="M126,60 L118,98" stroke="#300" strokeWidth="3" />}
      {p.crown && <Crown cx={100} y={46} w={50} />}
    </g>
  );
}

function Bat({ p, g }) {
  return (
    <g className="flap">
      <path d="M86,110 Q40,50 4,70 Q20,90 12,112 Q30,104 36,126 Q50,112 60,132 Q72,118 86,134Z" fill={p.dark} stroke="#140a08" strokeWidth="3" strokeLinejoin="round" />
      <path d="M114,110 Q160,50 196,70 Q180,90 188,112 Q170,104 164,126 Q150,112 140,132 Q128,118 114,134Z" fill={p.dark} stroke="#140a08" strokeWidth="3" strokeLinejoin="round" />
      <path d="M86,110 L36,126 M86,110 L12,112 M114,110 L164,126 M114,110 L188,112" stroke="#140a08" strokeWidth="2" opacity=".6" />
      <path d="M70,62 L80,100 L60,96Z M130,62 L120,100 L140,96Z" fill={p.base} stroke="#140a08" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="100" cy="122" rx="32" ry="38" fill={`url(#${g}b)`} stroke="#140a08" strokeWidth="3.5" />
      <GlowEye x={88} y={110} r={7} c="#ff3030" /><GlowEye x={112} y={110} r={7} c="#ff3030" />
      <path d="M94,122 L100,128 L106,122" fill={p.dark} stroke="#140a08" strokeWidth="2" />
      <path d="M90,136 Q100,142 110,136" stroke="#140a08" strokeWidth="2.5" fill="none" />
      <path d="M92,137 L95,147 L98,138 M108,137 L105,147 L102,138" fill="#fff" stroke="#2a1a10" strokeWidth="1" />
      {p.crown && <Crown cx={100} y={86} w={40} />}
    </g>
  );
}

function Dragon({ p, g }) {
  return (
    <g>
      <path d="M58,72 Q20,30 30,4 Q50,34 76,52Z M142,72 Q180,30 170,4 Q150,34 124,52Z" fill="#2a1e18" stroke="#140a08" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50,100 L18,86 L40,110 L14,118 L48,124Z M150,100 L182,86 L160,110 L186,118 L152,124Z" fill={p.dark} stroke="#140a08" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M100,40 C140,40 156,70 152,100 C150,120 136,128 132,140 L128,178 Q100,192 72,178 L68,140 C64,128 50,120 48,100 C44,70 60,40 100,40Z" fill={`url(#${g}b)`} stroke="#140a08" strokeWidth="4" />
      <path d="M100,48 L92,64 L100,60 L108,64Z M100,66 L94,78 L100,75 L106,78Z" fill={p.light} opacity=".6" />
      <path d="M58,90 L92,102" stroke="#140a08" strokeWidth="7" strokeLinecap="round" /><path d="M142,90 L108,102" stroke="#140a08" strokeWidth="7" strokeLinecap="round" />
      <Eye x={78} y={106} r={10} iris={p.iris} slit glow /><Eye x={122} y={106} r={10} iris={p.iris} slit glow />
      <path d="M76,130 C80,124 120,124 124,130 L126,172 Q100,184 74,172Z" fill={p.light} stroke={p.dark} strokeWidth="2.5" />
      <ellipse cx="88" cy="138" rx="5" ry="3" fill="#140a08" /><ellipse cx="112" cy="138" rx="5" ry="3" fill="#140a08" />
      <path d="M76,158 Q100,170 124,158" stroke="#140a08" strokeWidth="3" fill="none" />
      <Fangs x1={78} x2={122} y={158} n={6} h={10} />
      <g className="smoke"><circle cx="82" cy="128" r="5" fill="#ccc" opacity=".35" /><circle cx="118" cy="128" r="5" fill="#ccc" opacity=".35" /></g>
      {p.crown && <Crown cx={100} y={42} w={50} />}
    </g>
  );
}

function Mimic() {
  return (
    <g>
      <path d="M26,88 Q100,30 174,88 L170,112 L30,112Z" fill="#6b3b1d" stroke="#1a0c06" strokeWidth="4" className="lid" />
      <rect x="24" y="84" width="152" height="10" fill="#c9a24a" stroke="#1a0c06" strokeWidth="3" />
      <path d="M30,112 L170,112 L166,180 L34,180Z" fill="#83492a" stroke="#1a0c06" strokeWidth="4" />
      <path d="M34,112 Q100,150 166,112 L166,122 Q100,170 34,122Z" fill="#3a0608" />
      <Fangs x1={40} x2={160} y={112} n={12} h={14} />
      <path d="M40,124 L46,112 L52,126 M150,126 L154,112 L160,124" fill="#f6efdc" />
      <path d="M80,136 Q100,190 130,150" stroke="#d03a5a" strokeWidth="14" fill="none" strokeLinecap="round" className="sway" />
      <GlowEye x={70} y={66} r={8} c="#ffe040" /><GlowEye x={130} y={66} r={8} c="#ffe040" />
      <rect x="44" y="112" width="12" height="68" fill="#c9a24a" opacity=".85" /><rect x="144" y="112" width="12" height="68" fill="#c9a24a" opacity=".85" />
    </g>
  );
}

const ARCHES = { slime: Slime, goblin: Goblin, skull: Skull, beast: Beast, eye: EyeTyrant, spider: Spider, ghost: Ghost, golem: Golem, demon: Demon, bat: Bat, dragon: Dragon, mimic: Mimic };

function MonsterArt({ spec }) {
  const g = useId().replace(/:/g, '');
  const { hue, sat, light } = spec;
  const p = {
    ...spec,
    base: hsl(hue, sat, light),
    light: hsl(hue, sat, light + 16),
    dark: hsl(hue, sat + 5, light - 20),
    iris: hsl((hue + 180) % 360, 85, 55),
    bone: hsl(hue, 15, 82),
    cloth: hsl((hue + 200) % 360, 25, 24),
    glow2: '#ff3040',
  };
  const Arch = ARCHES[spec.arch] || Slime;
  return (
    <svg viewBox="0 0 200 200" className="monster-svg" overflow="visible">
      <defs>
        <radialGradient id={`${g}b`} cx="40%" cy="30%" r="75%">
          <stop offset="0%" stopColor={hsl(hue, sat, light + 22)} />
          <stop offset="55%" stopColor={p.base} />
          <stop offset="100%" stopColor={hsl(hue, sat + 5, light - 24)} />
        </radialGradient>
        <radialGradient id={`${g}iris`} cx="50%" cy="50%" r="50%">
          <stop offset="40%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity=".55" />
        </radialGradient>
        <linearGradient id={`${g}ghost`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hsl(hue, 40, 88)} /><stop offset="70%" stopColor={hsl(hue, 45, 70, 0.75)} /><stop offset="100%" stopColor={hsl(hue, 50, 60, 0.1)} />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff2a0" /><stop offset="50%" stopColor="#f0b830" /><stop offset="100%" stopColor="#9a6010" /></linearGradient>
        <linearGradient id="bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f4ecd8" /><stop offset="100%" stopColor="#b8a888" /></linearGradient>
      </defs>
      {spec.aura && <circle cx="100" cy="110" r="96" fill={spec.aura} opacity=".16" className="aura" />}
      <ellipse cx="100" cy="194" rx="62" ry="9" fill="#000" opacity=".45" />
      <Arch p={p} g={g} />
    </svg>
  );
}

export default memo(MonsterArt);
