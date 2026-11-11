import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { G, pendingShards, goldPerSec } from './engine/engine.js';
import { RARITIES } from './engine/loot.js';
import Arena from './ui/Arena.jsx';
import Gear from './ui/Gear.jsx';
import { Party, Hero, Relics, Codex } from './ui/Panels.jsx';
import { Icon, ItemIcon } from './art/Icons.jsx';
import { useGame, useEvents, useModal, closeModal, openModal, fmt, fmtTime } from './ui/util.js';

const TABS = [
  { id: 'party', name: 'Отряд', icon: 'swords', C: Party },
  { id: 'hero', name: 'Герой', icon: 'hero', C: Hero },
  { id: 'gear', name: 'Вещи', icon: 'backpack', C: Gear },
  { id: 'relics', name: 'Реликвии', icon: 'gem', C: Relics },
  { id: 'codex', name: 'Кодекс', icon: 'tome', C: Codex },
];

export default function App() {
  const [tab, setTab] = useState(() => { try { return localStorage.getItem('dof-tab') || 'party'; } catch { return 'party'; } });
  useEffect(() => { try { localStorage.setItem('dof-tab', tab); } catch { /* */ } }, [tab]);
  const [newItems, setNewItems] = useState(0);
  useEvents((type, d) => {
    if (type === 'loot' && !d.salvaged) setNewItems(n => n + 1);
    if (type === 'offline') openModal(() => <OfflineModal data={d} />);
  });
  const T = TABS.find(t => t.id === tab) || TABS[0];
  return (
    <div className="app">
      <Hud />
      <Arena />
      <main className="panels"><T.C /></main>
      <nav className="tabbar">
        {TABS.map(t => (
          <button key={t.id} className={'tabb' + (t.id === tab ? ' on' : '')} onClick={() => { setTab(t.id); if (t.id === 'gear') setNewItems(0); }}>
            <Icon name={t.icon} />
            <span>{t.name}</span>
            {t.id === 'gear' && newItems > 0 && tab !== 'gear' && <i className="badge">{newItems}</i>}
            {t.id === 'relics' && <ShardBadge />}
          </button>
        ))}
      </nav>
      <Toasts />
      <ModalHost />
    </div>
  );
}

function ShardBadge() {
  useGame();
  const g = pendingShards();
  return g > 0 ? <i className="badge purple">+{g}</i> : null;
}

function Hud() {
  const { S } = useGame();
  return (
    <header className="hud">
      <div className="hud-gold">
        <span className="coin" />
        <div><div className="hud-num">{fmt(S.gold)}</div><div className="hud-sub">{fmt(goldPerSec())}/сек</div></div>
      </div>
      <div className="hud-title">Кости Судьбы</div>
      <div className="hud-right">
        <div className="hud-pill"><Icon name="gem" />{fmt(S.shards)}</div>
        <div className="hud-pill dust"><Icon name="dust" />{fmt(S.dust)}</div>
      </div>
    </header>
  );
}

let tid = 0;
function Toasts() {
  const [list, setList] = useState([]);
  useEvents((type, d) => {
    if (type !== 'toast') return;
    const id = ++tid;
    setList(l => l.slice(-2).concat({ id, ...d }));
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), 2800);
  });
  return (
    <div className="toasts">
      <AnimatePresence>
        {list.map(t => (
          <motion.div key={t.id} layout className={`toast ${t.kind || ''}`}
            initial={{ opacity: 0, y: 16, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ModalHost() {
  const m = useModal();
  return (
    <AnimatePresence>
      {m && (
        <motion.div key={m.key} className="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onPointerDown={e => { if (e.target === e.currentTarget && !m.opts.noClose) closeModal(); }}>
          <motion.div className="modal-box" initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
            <m.render />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OfflineModal({ data }) {
  const kept = data.items.filter(x => !x.salvaged);
  return (
    <div className="modal-inner">
      <h3>С возвращением!</h3>
      <p>Пока тебя не было ({fmtTime(data.away)}), отряд зачищал этаж {G.S.floor}:</p>
      <div className="reward"><span className="coin" /> +{fmt(data.gold)}</div>
      {data.items.length > 0 && <>
        <p className="sub">Найдено предметов: {data.items.length}{kept.length < data.items.length ? ` (разобрано ${data.items.length - kept.length})` : ''}</p>
        <div className="offline-items">
          {kept.slice(0, 12).map(({ item }) => <div key={item.id} className={`tile r${item.rar}`} style={{ '--r': RARITIES[item.rar].color }}><ItemIcon item={item} /></div>)}
        </div>
      </>}
      <button className="btn-big" onClick={closeModal}>В казну!</button>
    </div>
  );
}
