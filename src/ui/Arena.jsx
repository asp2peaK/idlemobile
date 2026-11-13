import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  G, playerAttack, useAbility, goFloor, chest, openChest, claimChest, killsPerFloor, abilOn,
  partyHP, partyMaxHP, partyAC, blockAttack, hitWeak, blockDC, blockBonus,
} from '../engine/engine.js';
import { ABILITIES, HEROES, TRAITS } from '../engine/data.js';
import { RARITIES } from '../engine/loot.js';
import MonsterArt from '../art/Monster.jsx';
import Backdrop from '../art/Backdrop.jsx';
import { HeroIcon, Icon, D20, ItemIcon } from '../art/Icons.jsx';
import { useGame, useEvents, fmt, openModal, closeModal, vibrate } from './util.js';
import { ItemCard } from './Gear.jsx';

const HERO_BY_ID = Object.fromEntries(HEROES.map(h => [h.id, h]));
let floatId = 0;

export default function Arena() {
  const { S, M, tapRoll } = useGame();
  const [floats, setFloats] = useState([]);
  const [drops, setDrops] = useState([]);
  const [pfl, setPfl] = useState([]);
  const [hurt, setHurt] = useState(0);
  const monRef = useRef(null);
  const arenaRef = useRef(null);

  const addFloat = useCallback(f => {
    const id = ++floatId;
    setFloats(fs => (fs.length > 18 ? fs.slice(-18) : fs).concat({ id, ...f }));
    setTimeout(() => setFloats(fs => fs.filter(x => x.id !== id)), 1150);
  }, []);

  useEvents((type, d) => {
    if (type === 'hit') {
      const tap = d.src === 'tap';
      const h = HERO_BY_ID[d.src];
      const x = tap ? (Math.random() * 80 - 40) : ((d.idx % 2 ? 1 : -1) * (40 + Math.random() * 60));
      const y = tap ? 0 : Math.random() * 50 - 10;
      if (d.miss) addFloat({ text: d.ghost ? 'сквозь' : tap ? (d.fumble ? 'ПРОВАЛ' : 'мимо') : 'мимо', cls: 'miss', x, y, hero: h });
      else {
        addFloat({ text: fmt(d.amount), cls: (d.crit ? 'crit ' : '') + (tap ? 'tap' : ''), x, y, hero: h });
        monRef.current?.animate(
          [{ transform: 'translate(0,0)', filter: 'brightness(2.4) saturate(3) hue-rotate(-30deg)' },
           { transform: `translate(${d.crit ? -10 : -5}px, 2px) rotate(-3deg)` },
           { transform: `translate(${d.crit ? 8 : 4}px, -2px) rotate(2deg)` }, { transform: 'none', filter: 'none' }],
          { duration: d.crit ? 280 : 180 });
        if (d.crit && tap) {
          arenaRef.current?.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-7px,4px)' }, { transform: 'translate(6px,-5px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'none' }], { duration: 300 });
        }
      }
    }
    if (type === 'mhit') {
      const id = ++floatId;
      setPfl(l => l.slice(-4).concat({ id, ...d }));
      setTimeout(() => setPfl(l => l.filter(x => x.id !== id)), 1100);
      if (d.heavy && !d.halved) {
        vibrate([40, 30, 60]);
        arenaRef.current?.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-10px,6px)' }, { transform: 'translate(9px,-6px)' }, { transform: 'translate(-5px,3px)' }, { transform: 'none' }], { duration: 380 });
      }
      if (!d.miss) setHurt(h => h + 1);
    }
    if (type === 'kill') addFloat({ text: '+' + fmt(d.gold), cls: 'gold', x: 0, y: 40, coin: true });
    if (type === 'loot') {
      const id = ++floatId;
      setDrops(ds => ds.slice(-1).concat({ id, ...d }));
      setTimeout(() => setDrops(ds => ds.filter(x => x.id !== id)), 2600);
      if (d.item.rar >= 4 && !d.salvaged) {
        vibrate([30, 40, 60]);
        openModal(() => <LegendaryModal item={d.item} roll={d.roll} />);
      }
    }
  }, [addFloat]);

  const onTap = e => {
    e.preventDefault();
    playerAttack();
    vibrate(G.tapRoll.r === 20 ? [20, 30, 40] : 6);
  };

  if (!M) return null;
  const hpP = Math.max(0, M.hp / M.maxHp);
  const bossLeft = M.tier ? Math.max(0, (M.bossEnd - Date.now()) / 1000) : 0;
  const need = M.tier ? 1 : killsPerFloor();
  const done = S.floor < S.maxFloor ? need : Math.min(S.kills, need);
  const now = Date.now();
  const charge = M.charge && !M.dead ? M.charge : null;
  const chargeP = charge ? Math.min(1, (now - charge.start) / charge.dur) : 0;
  const resting = G.restUntil > now;
  const stunned = M.stunUntil > now;
  const php = partyHP(), pmax = partyMaxHP();

  return (
    <section className={`arena tier${M.tier}`} ref={arenaRef}>
      <Backdrop biome={M.biome} seed={Math.floor((S.floor - 1) / 10) + 1} />
      <div className="vignette" />
      {abilOn('rage') && <div className="rage-overlay" />}

      <div className="floor-bar">
        <button className="floor-nav" disabled={S.floor <= 1} onClick={() => goFloor(-1)}>‹</button>
        <div className="floor-info">
          <div className="biome-name">{M.biome.name}{M.circle ? ` · Круг ${M.circle + 1}` : ''}</div>
          <div className="floor-label">Этаж <b>{S.floor}</b></div>
          <div className="pips">
            {Array.from({ length: need }, (_, i) => <i key={i} className={`pip${M.tier ? ' boss' : ''}${i < done ? ' on' : ''}`} />)}
          </div>
        </div>
        <button className={`floor-nav${S.floor < S.maxFloor && !S.auto ? ' blink-nav' : ''}`} disabled={S.floor >= S.maxFloor} onClick={() => goFloor(1)}>›</button>
      </div>

      <div className="monster-zone" onPointerDown={onTap}>
        <AnimatePresence mode="popLayout">
          <motion.div key={M.uid} className="monster-holder"
            initial={{ opacity: 0, scale: 0.4, y: 40 }}
            animate={M.dead ? { opacity: 0, scale: 0.75, y: 24, rotate: -8, filter: 'brightness(3)' } : { opacity: 1, scale: 1, y: 0, rotate: 0, filter: 'brightness(1)' }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}>
            <div ref={monRef} className={`monster tier${M.tier}${charge ? ' charging' : ''}${stunned ? ' stunned' : ''}`}><MonsterArt spec={M.spec} /></div>
          </motion.div>
        </AnimatePresence>
        {charge && (
          <div className="charge">
            <div className="charge-ico">!</div>
            <div className="charge-bar"><div style={{ transform: `scaleX(${chargeP})` }} /></div>
            <div className="charge-txt">{charge.tried ? 'Блок провален!' : 'Мощный удар!'}</div>
          </div>
        )}
        {stunned && <div className="stun-txt">Оглушён</div>}
        {G.weak && (
          <button key={G.weak.id} className="weak" style={{ left: G.weak.x + '%', top: G.weak.y + '%' }}
            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); hitWeak(); vibrate([15, 20, 30]); }}>
            <Icon name="rune" />
          </button>
        )}
        <div className="floats">
          {floats.map(f => (
            <div key={f.id} className={`fl ${f.cls}`} style={{ marginLeft: f.x, marginTop: f.y }}>
              {f.hero && <span className="fl-hero" style={{ '--c': f.hero.c }}><HeroIcon id={f.hero.id} c={f.hero.c} /></span>}
              {f.coin && <span className="coin sm" />}
              {f.text}
            </div>
          ))}
        </div>
        <div className="drops">
          <AnimatePresence>
            {drops.map(dr => (
              <motion.div key={dr.id} className="drop" style={{ '--r': RARITIES[dr.item.rar].color }}
                initial={{ opacity: 0, y: 30, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20 }}>
                <div className="drop-ico"><ItemIcon item={dr.item} /></div>
                <div>
                  <div className="drop-roll">🎲 {dr.roll.roll}{dr.roll.confirm ? ` → ${dr.roll.confirm}` : ''} · {RARITIES[dr.item.rar].name}</div>
                  <div className="drop-name">{dr.salvaged ? `Разобрано: +${dr.salvaged} пыли${dr.full ? ' (сумка полна)' : ''}` : dr.item.name}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="monster-card">
          {M.tier > 0 && (
          <div className="boss-timer">
            <div className="bt-fill" style={{ transform: `scaleX(${bossLeft / M.bossDur})` }} />
            <span>{bossLeft.toFixed(1)} с</span>
          </div>
        )}
        <div className={`m-name tier${M.tier}`}>
          <span>{M.name}</span>
          <span className="ac" title="Класс доспеха"><small>КД</small><b>{M.ac}</b></span>
        </div>
        {M.traits.length > 0 && (
          <div className="traits">
            {M.traits.map(t => { const tr = TRAITS.find(x => x.id === t); return <span key={t} className="trait" style={{ '--c': tr.color }} title={tr.desc}>{tr.name}</span>; })}
          </div>
        )}
        <div className="hp">
          <div className="hp-lag" style={{ transform: `scaleX(${hpP})` }} />
          <div className="hp-fill" style={{ transform: `scaleX(${hpP})` }} />
          <div className="hp-text">{fmt(Math.max(0, Math.ceil(M.hp)))} / {fmt(M.maxHp)}</div>
        </div>
      </div>

      <div className="party-bar">
        <span className="pb-ico"><Icon name="heart" /></span>
        <div className={`pb-hp${php / pmax < 0.3 ? ' low' : ''}`}>
          <motion.div key={hurt} className="pb-flash" initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }} />
          <div className="pb-fill" style={{ transform: `scaleX(${php / pmax})` }} />
          <span>{resting ? 'Отдых…' : `${fmt(php)} / ${fmt(pmax)}`}</span>
        </div>
        <span className="pb-ac" title="КД отряда"><Icon name="shield" /><b>{partyAC()}</b></span>
        <div className="pfl">
          {pfl.map(f => <div key={f.id} className={`pf${f.miss ? ' miss' : ''}${f.heavy ? ' heavy' : ''}`}>{f.miss ? `${f.r} — мимо` : (f.thorns ? 'шипы ' : '') + '−' + fmt(f.dmg)}</div>)}
        </div>
      </div>

      <div className="arena-bottom">
        <Abilities />
        {charge && !charge.tried && (
          <motion.button className="block-btn" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onPointerDown={e => { e.preventDefault(); blockAttack(); vibrate(20); }}>
            <Icon name="shield" />
            <span>БЛОК</span>
            <small>d20+{blockBonus()} ≥ {blockDC()}</small>
          </motion.button>
        )}
        <button className="d20-btn" onPointerDown={onTap} aria-label="Атаковать">
          <motion.div key={tapRoll.n} className="d20-wrap"
            initial={tapRoll.n ? { rotate: -220, scale: 0.7 } : false} animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 16 }}>
            <D20 value={tapRoll.r} state={tapRoll.n ? (tapRoll.r === 20 ? 'nat20' : tapRoll.r === 1 ? 'nat1' : '') : ''} />
          </motion.div>
          <span className="roll-caption">{tapRoll.text}</span>
        </button>
      </div>

      {resting && <div className="rest-overlay"><b>Отряд пал</b><span>Отдых и перевязка ран…</span></div>}
      {chest.visible && <button className="chest" onClick={() => openChestModal()}><Icon name="chest" /></button>}
    </section>
  );
}

function Abilities() {
  const { S } = useGame();
  const t = Date.now();
  return (
    <div className="abilities">
      {ABILITIES.map(a => {
        const st = S.abil[a.id] || {};
        const locked = S.maxFloor < a.unlock;
        const active = (st.until || 0) > t;
        const left = ((st.ready || 0) - t) / 1000;
        return (
          <button key={a.id} className={`abil${locked ? ' locked' : ''}${active ? ' active' : ''}`} onClick={() => useAbility(a)}>
            <Icon name={a.icon} />
            {!locked && !active && left > 0 && <><div className="cd" style={{ transform: `scaleY(${left / a.cd})` }} /><div className="cdt">{Math.ceil(left)}</div></>}
            {active && <div className="cdt act">{Math.ceil((st.until - t) / 1000)}</div>}
            {locked && <div className="lock">эт. {a.unlock}</div>}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Сундук ----------
function openChestModal() {
  const res = openChest();
  openModal(() => <ChestModal res={res} />, { noClose: true });
}
function ChestModal({ res }) {
  const [shown, setShown] = useState(false);
  const [spin, setSpin] = useState(1 + Math.floor(Math.random() * 20));
  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setSpin(1 + Math.floor(Math.random() * 20));
      if (++i > 14) { clearInterval(iv); setShown(true); vibrate(res.r === 20 ? [30, 40, 80] : 15); }
    }, 55);
    return () => clearInterval(iv);
  }, [res]);
  const r = res.r;
  return (
    <div className="modal-inner">
      <h3>Сундук!</h3>
      <p>Проверка Удачи — бросок d20</p>
      <motion.div className="bigdie" animate={shown ? { rotate: 0, scale: [1.3, 1] } : { rotate: [0, 360] }}
        transition={shown ? { duration: 0.3 } : { repeat: Infinity, duration: 0.5, ease: 'linear' }}>
        <D20 value={shown ? r : spin} state={shown ? (r === 20 ? 'nat20' : r === 1 ? 'nat1' : '') : ''} />
      </motion.div>
      {shown && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {r === 1 ? <p><b className="bad">Это МИМИК!</b> Убей его — внутри гора золота и вещь.</p>
            : <>
              <p>{r === 20 ? <b className="leg">НАТУРАЛЬНАЯ 20! Сокровища дракона!</b> : r >= 17 ? 'Отличная находка!' : r >= 10 ? 'Хороший улов!' : 'Немного монет.'}</p>
              <div className="reward"><span className="coin" /> +{fmt(res.gold)}</div>
              {res.item && <p className="sub">…и предмет экипировки!</p>}
            </>}
          <button className="btn-big" onClick={() => { closeModal(); claimChest(res); }}>{r === 1 ? 'В бой!' : 'Забрать'}</button>
        </motion.div>
      )}
    </div>
  );
}

function LegendaryModal({ item, roll }) {
  return (
    <div className="modal-inner legendary" style={{ '--r': RARITIES[item.rar].color }}>
      <div className="rays" />
      <h3 style={{ color: RARITIES[item.rar].color }}>{RARITIES[item.rar].name} предмет!</h3>
      <p className="sub">Бросок {roll.roll}{roll.confirm ? `, подтверждение ${roll.confirm}` : ''}</p>
      <ItemCard item={item} big />
      <button className="btn-big" onClick={closeModal}>Великолепно</button>
    </div>
  );
}
