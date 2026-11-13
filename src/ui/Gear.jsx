import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  equip, unequip, salvage, salvageBelow, setAutoSalvage, upgradeItem, toggleLock, invCap, relic,
  RARITIES, SLOTS, itemPower, upgradeCost, upgradeDC, salvageValue, luck, critBonus, speedMul, bossTime,
} from '../engine/engine.js';
import { STATS, affixValue, uniqueInfo } from '../engine/loot.js';
import { ItemIcon, SlotIcon, Icon, D20 } from '../art/Icons.jsx';
import { useGame, fmt, openModal, closeModal, vibrate } from './util.js';

export function ItemCard({ item, big, compare }) {
  const rar = RARITIES[item.rar];
  const u = uniqueInfo(item);
  const pw = itemPower(item);
  const cmp = compare ? itemPower(compare) : null;
  return (
    <div className={`item-card${big ? ' big' : ''}`} style={{ '--r': rar.color }}>
      <div className="ic-head">
        <div className={`tile r${item.rar}`}><ItemIcon item={item} />{item.plus > 0 && <span className="plus">+{item.plus}</span>}</div>
        <div className="ic-title">
          <div className="ic-name">{item.name}{item.plus > 0 ? ` +${item.plus}` : ''}</div>
          <div className="ic-meta"><span style={{ color: rar.color }}>{rar.name}</span> · {SLOTS.find(s => s.id === item.slot).name} · ур. {item.ilvl}</div>
          <div className="ic-power">Мощь <b>{fmt(pw)}</b>
            {cmp !== null && <span className={pw >= cmp ? 'up' : 'down'}> {pw >= cmp ? '▲' : '▼'} {fmt(Math.abs(pw - cmp))}</span>}
          </div>
        </div>
      </div>
      <ul className="affixes">
        {item.affixes.map((a, i) => <li key={i} className={i === 0 ? 'main' : ''}>{STATS[a.k].label(affixValue(item, a), a)}</li>)}
      </ul>
      {u && <div className="unique"><b>✦ {u.name}:</b> {u.desc}</div>}
    </div>
  );
}

function ItemTile({ item, onClick, empty, slot }) {
  if (!item) return (
    <button className="tile empty" onClick={onClick}><SlotIcon slot={slot} /><span className="slot-name">{SLOTS.find(s => s.id === slot).name}</span></button>
  );
  return (
    <motion.button layout className={`tile r${item.rar}`} onClick={onClick} style={{ '--r': RARITIES[item.rar].color }}
      initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
      <ItemIcon item={item} />
      {item.plus > 0 && <span className="plus">+{item.plus}</span>}
      {item.locked && <span className="lockmark"><Icon name="lock" /></span>}
      {item.heir && <span className="heir-mark">★</span>}
      <span className="ilvl">{item.ilvl}</span>
    </motion.button>
  );
}

export default function Gear() {
  const { S, gear } = useGame();
  const [filter, setFilter] = useState('all');
  const inv = S.inv.filter(it => filter === 'all' || it.slot === filter);
  const totals = [
    ['Урон', gear.dmg, '%'], ['Отряд', gear.party, '%'], ['Тап', gear.tap, '%'], ['Золото', gear.gold, '%'],
    ['Крит. урон', gear.critDmg, '%'], ['Скорость', (speedMul() - 1) * 100, '%'],
  ];
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Снаряжение</h2>
        <div className="dust"><Icon name="dust" /> {fmt(S.dust)}</div>
      </div>

      {S.curses.includes('naked') && <div className="warn">Проклятие Наготы: в этой кампании снаряжение не действует</div>}
      <div className="doll">
        <div className="doll-slots">
          {SLOTS.map(s => <ItemTile key={s.id} slot={s.id} item={S.eq[s.id]} onClick={() => S.eq[s.id] && openModal(() => <EquippedModal slot={s.id} />)} />)}
        </div>
        <div className="doll-stats">
          {totals.map(([k, v, u]) => <div key={k} className="ds"><span>{k}</span><b>+{fmt(v)}{u}</b></div>)}
          <div className="ds"><span>Попадание</span><b>+{gear.hit}</b></div>
          <div className="ds"><span>Удача</span><b>+{luck()}</b></div>
          <div className="ds"><span>Крит-диапазон</span><b>+{critBonus()}</b></div>
          <div className="ds"><span>Таймер босса</span><b>{bossTime()}с</b></div>
        </div>
        {gear.uniques.size > 0 && <div className="doll-uniques">{[...gear.uniques].length} легендарн. свойств активно</div>}
      </div>

      <div className="inv-head">
        <h3>Сумка <small>{S.inv.length}/{invCap()}</small></h3>
        <select value={S.autoSalvage} onChange={e => setAutoSalvage(+e.target.value)} className="sel">
          <option value={-1}>Авторазбор: выкл</option>
          <option value={0}>Авто: обычные</option>
          <option value={1}>Авто: ≤ необычных</option>
          <option value={2}>Авто: ≤ редких</option>
          <option value={3}>Авто: ≤ эпических</option>
        </select>
      </div>
      <div className="chips">
        {[['all', 'Все'], ...SLOTS.map(s => [s.id, s.name])].map(([id, n]) =>
          <button key={id} className={filter === id ? 'on' : ''} onClick={() => setFilter(id)}>{n}</button>)}
      </div>
      {S.inv.length === 0
        ? <div className="empty-note">Сумка пуста. Убивай монстров — с них падает лут.<br />Боссы всегда что-то роняют!</div>
        : <div className="inv-grid">{inv.map(it => <ItemTile key={it.id} item={it} onClick={() => openModal(() => <ItemModal id={it.id} />)} />)}</div>}
      {S.inv.length > 0 && (
        <div className="bulk-row">
          {[0, 1, 2].map(r => (
            <button key={r} className="btn-ghost" style={{ color: RARITIES[r].color }} onClick={() => {
              const res = salvageBelow(r);
              if (res.n) vibrate(10);
            }}>Разобрать ≤ {RARITIES[r].short}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemModal({ id }) {
  const { S } = useGame();
  const item = S.inv.find(x => x.id === id);
  if (!item) return null;
  const cur = S.eq[item.slot];
  return (
    <div className="modal-inner">
      <ItemCard item={item} big compare={cur} />
      {cur && <>
        <div className="vs">Сейчас надето</div>
        <ItemCard item={cur} />
      </>}
      <div className="btn-row">
        <button className="btn-big" onClick={() => { equip(item.id); closeModal(); vibrate(10); }}>Надеть</button>
        <button className="btn-big red" disabled={item.locked} onClick={() => { salvage(item.id); closeModal(); }}>
          Разобрать <small>+{salvageValue(item)}</small>
        </button>
      </div>
      <button className="btn-ghost" onClick={() => toggleLock(item.id)}>{item.locked ? 'Снять защиту' : 'Защитить от разбора'}</button>
    </div>
  );
}

function EquippedModal({ slot }) {
  const { S } = useGame();
  const item = S.eq[slot];
  const [roll, setRoll] = useState(null);
  const [spin, setSpin] = useState(null);
  useEffect(() => {
    if (!spin) return;
    let i = 0;
    const iv = setInterval(() => {
      setRoll({ spinning: true, r: 1 + Math.floor(Math.random() * 20) });
      if (++i > 9) { clearInterval(iv); setRoll(spin); setSpin(null); vibrate(spin.ok ? [20, 30, 50] : 40); }
    }, 50);
    return () => clearInterval(iv);
  }, [spin]);
  if (!item) return null;
  const cost = upgradeCost(item);
  const dc = upgradeDC(item, relic('forge'));
  const chance = Math.round(Math.min(0.95, Math.max(0.05, (21 - dc) / 20)) * 100);
  const doUpgrade = () => {
    if (spin) return;
    const res = upgradeItem(slot);
    if (res) setSpin(res);
  };
  return (
    <div className="modal-inner">
      <ItemCard item={item} big />
      <div className="forge">
        <div className="forge-die">
          <D20 value={roll ? roll.r : dc} state={roll && !roll.spinning ? (roll.ok ? 'nat20' : 'nat1') : ''} />
        </div>
        <div className="forge-info">
          <div className="forge-title">Заточка до +{item.plus + 1}</div>
          <div>Бросок d20 против Сложности <b>{dc}</b> · шанс {chance}%</div>
          <div className="sub">Успех: +8% ко всем растущим свойствам. Провал: пыль сгорит, предмет цел.</div>
          {roll && !roll.spinning && <div className={roll.ok ? 'ok' : 'bad'}>{roll.ok ? `Успех! Выпало ${roll.r}` : `Провал… выпало ${roll.r}`}</div>}
        </div>
      </div>
      <div className="btn-row">
        <button className="btn-big" disabled={S.dust < cost || !!spin} onClick={doUpgrade}>
          Заточить <small><Icon name="dust" className="inl" />{fmt(cost)}</small>
        </button>
        <button className="btn-ghost" onClick={() => { unequip(slot); closeModal(); }}>Снять</button>
      </div>
    </div>
  );
}
