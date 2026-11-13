import { useState } from 'react';
import { motion } from 'motion/react';
import {
  buyHero, heroCost, heroBuyK, heroDps, heroHit, heroCritMin, heroInterval, heroUnlocked, nextMilestone, setBuyMode,
  PLAYER_UPGRADES, upgradeK, buyUpgrade, tapAvg, partyDps, hitChance, playerHit, dmgMul, floorAC,
  pendingShards, prestige, wipe, relicCost, buyRelic, relic, goldPerSec, partyMaxHP, partyAC,
  xpNeed, talentPoints, learnTalent, respecTalents, tal, claimContract, rerollContract, rerollCost,
  heirSlots, curseMul, RARITIES,
} from '../engine/engine.js';
import { HEROES, RELICS, BIOMES, PRESTIGE_FLOOR, FLOORS_PER_BIOME, TALENT_TREES, CONTRACTS, CURSES, TRAITS } from '../engine/data.js';
import { UNIQUES } from '../engine/loot.js';
import { HeroIcon, Icon, DieIcon, ItemIcon } from '../art/Icons.jsx';
import { useGame, fmt, fmtTime, openModal, closeModal } from './util.js';

const RING = 2 * Math.PI * 30;

function BuyMode() {
  const { buyMode } = useGame();
  return (
    <div className="seg">
      {[1, 10, 'max'].map(m => <button key={m} className={buyMode === m ? 'on' : ''} onClick={() => setBuyMode(m)}>{m === 'max' ? 'Макс' : '×' + m}</button>)}
    </div>
  );
}

// ================= Отряд =================
export function Party() {
  const { S, M, timers, lastRolls } = useGame();
  let shownLocked = 0;
  return (
    <div className="panel">
      <div className="panel-head"><h2>Отряд</h2><BuyMode /></div>
      <div className="party-sum">
        <span>Урон <b>{fmt(partyDps())}</b>/с</span>
        <span>ХП <b>{fmt(partyMaxHP())}</b> · КД <b>{partyAC()}</b></span>
        <span>Золото <b>{fmt(goldPerSec())}</b>/с</span>
      </div>
      {HEROES.map((h, i) => {
        const lvl = S.heroes[h.id];
        const prevHired = i === 0 || S.heroes[HEROES[i - 1].id] > 0;
        if (!lvl && !prevHired) return null;
        if (!heroUnlocked(h)) {
          if (shownLocked++) return null;
          return (
            <div key={h.id} className="hcard secret">
              <div className="portrait mystery">?</div>
              <div className="h-info"><div className="h-name">Тайный герой</div><div className="h-stat">Откроется, когда отряд дойдёт до этажа <b>{h.unlock}</b></div></div>
            </div>
          );
        }
        const k = heroBuyK(h), cost = heroCost(h, k);
        const lr = lastRolls[h.id];
        return (
          <motion.div layout key={h.id} className={`hcard${lvl ? '' : ' new'}`} style={{ '--c': h.c }}>
            <div className="portrait">
              <svg className="ring" viewBox="0 0 66 66"><circle className="bg" cx="33" cy="33" r="30" />
                <circle className="fg" cx="33" cy="33" r="30" strokeDasharray={RING} strokeDashoffset={RING * (1 - (timers[h.id] || 0))} /></svg>
              <div className="pface"><HeroIcon id={h.id} c={h.c} /></div>
              <span className="lvl">{lvl ? 'Ур. ' + lvl : 'Новый'}</span>
            </div>
            <div className="h-info">
              <div className="h-name">{h.name}</div>
              <div className="h-tags">
                <span className="tag"><DieIcon sides={h.die} color={h.c} />{h.n}d{h.die}</span>
                <span className="tag">{h.auto ? '✦ авто' : `+${heroHit(h)} атк`}</span>
                {!h.auto && heroCritMin(h) < 20 && <span className="tag">крит {heroCritMin(h)}+</span>}
                <span className="tag">⏱{heroInterval(h).toFixed(2)}с</span>
              </div>
              {lvl ? <div className="h-stat"><b>{fmt(heroDps(h, M?.ac ?? floorAC(S.floor)))}</b> урона/с <span className="ms">· ×2 на ур. {nextMilestone(lvl)}</span></div>
                : <div className="h-stat perk">{h.perk}</div>}
              <div className="h-last">{lr ? (lr.miss ? <>d20 <b>{lr.r}</b> · {lr.ghost ? 'сквозь призрака' : 'промах'}</> :
                <>{lr.auto ? '' : <>d20 <b>{lr.r}</b> · </>}{h.n}d{h.die}: <b>{lr.sum}</b> → <span className={lr.crit ? 'crit-t' : ''}>{lr.crit ? 'КРИТ ' : ''}{fmt(lr.dmg)}</span></>) : (lvl ? h.perk : '')}</div>
            </div>
            <button className="btn-buy" disabled={S.gold < cost} onClick={() => buyHero(h)}>
              <span className="t">{lvl ? (k > 1 ? `+${k} ур.` : 'Уровень') : 'Нанять'}</span>
              <span className="c"><span className="coin sm" />{fmt(cost)}</span>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ================= Твой персонаж =================
export function Hero() {
  const { S, M } = useGame();
  const ac = M?.ac ?? floorAC(S.floor);
  const pts = talentPoints();
  return (
    <div className="panel">
      <div className="panel-head"><h2>Твой персонаж</h2><BuyMode /></div>
      <div className="xp">
        <div className="xp-top">
          <span className="xp-lvl">Уровень {S.lvl}</span>
          <span className={`xp-pts${pts > 0 ? ' has' : ''}`}>Очки талантов: {pts}</span>
        </div>
        <div className="xp-bar"><div style={{ transform: `scaleX(${Math.min(1, S.xp / xpNeed())})` }} /></div>
        <div className="sub">Опыт {fmt(S.xp)} / {fmt(xpNeed())} · таланты сбрасываются в новой кампании</div>
      </div>
      <div className="trees">
        {TALENT_TREES.map(tr => (
          <div key={tr.id} className="tree" style={{ '--c': tr.color }}>
            <h4>{tr.name}</h4>
            {tr.talents.map(t => {
              const r = tal(t.id), full = r >= t.max;
              return (
                <button key={t.id} className={`tal${!full && pts > 0 ? ' can' : ''}${full ? ' full' : ''}`} disabled={full || pts < 1} onClick={() => learnTalent(tr, t)}>
                  <b>{t.name}</b><i>{r}/{t.max}</i>
                  <span>{t.desc(Math.max(1, r))}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {S.lvl > 1 && <div className="center" style={{ marginTop: -6, marginBottom: 8 }}><button className="btn-ghost" onClick={respecTalents}>Сбросить таланты</button></div>}
      <div className="stats">
        <div className="stat"><div className="k">Средний урон тапа</div><div className="v">{fmt(tapAvg())}</div></div>
        <div className="stat"><div className="k">Урон отряда / сек</div><div className="v">{fmt(partyDps())}</div></div>
        <div className="stat"><div className="k">Шанс попасть (КД {ac})</div><div className="v">{Math.round(hitChance(playerHit(), ac, false) * 100)}%</div></div>
        <div className="stat"><div className="k">Множитель урона</div><div className="v">×{fmt(dmgMul())}</div></div>
      </div>
      {PLAYER_UPGRADES.map(u => {
        const maxed = u.lvl() >= u.max;
        const k = upgradeK(u);
        const cost = maxed ? Infinity : u.cost(k);
        return (
          <div key={u.id} className="hcard" style={{ '--c': u.c }}>
            <div className="portrait"><div className="pface"><Icon name={u.icon} /></div><span className="lvl">{u.lvl()}</span></div>
            <div className="h-info"><div className="h-name">{u.name}</div><div className="h-stat">{u.info()}</div></div>
            <button className="btn-buy" disabled={maxed || S.gold < cost} onClick={() => buyUpgrade(u)}>
              <span className="t">{maxed ? 'Максимум' : k > 1 ? `+${k}` : 'Улучшить'}</span>
              <span className="c">{maxed ? '—' : <><span className="coin sm" />{fmt(cost)}</>}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ================= Таверна: контракты + кодекс =================
const REWARD_TEXT = r => r.kind === 'shards' ? <><Icon name="gem" className="inl" />{r.amount} оск.</>
  : r.kind === 'dust' ? <><Icon name="dust" className="inl" />{fmt(r.amount)} пыли</>
  : r.kind === 'item' ? <span style={{ color: RARITIES[r.rar].color }}>{RARITIES[r.rar].name}+ предмет</span>
  : <><span className="coin sm" />золото за {r.secs / 60} мин</>;

export function Tavern() {
  const { S } = useGame();
  return (
    <div className="panel">
      <div className="panel-head"><h2>Таверна</h2><span className="sub">Выполнено: {S.contractsDone}</span></div>
      <h3 className="sec">Доска контрактов</h3>
      {S.contracts.map(c => {
        const def = CONTRACTS.find(x => x.id === c.id);
        const done = c.prog >= c.target;
        return (
          <div key={c.uid} className={`contract${done ? ' done' : ''}`}>
            <div className="ct-top"><span className="ct-text">{def.text(c.target)}</span><span className="ct-rew">{REWARD_TEXT(c.reward)}</span></div>
            <div className="ct-bar"><div style={{ transform: `scaleX(${c.prog / c.target})` }} /></div>
            <div className="ct-row">
              <span>{fmt(c.prog)} / {fmt(c.target)}</span>
              {done
                ? <button className="btn-buy" onClick={() => claimContract(c.uid)}><span className="t">Награда</span><span className="c">Забрать</span></button>
                : <button className="btn-ghost" disabled={S.dust < rerollCost()} onClick={() => rerollContract(c.uid)}>Сменить · <Icon name="dust" className="inl" />{rerollCost()}</button>}
            </div>
          </div>
        );
      })}
      <Codex />
    </div>
  );
}

function Codex() {
  const { S } = useGame();
  const allU = Object.entries(UNIQUES).flatMap(([slot, us]) => us.map(u => ({ ...u, slot })));
  const nextBiomeFloor = Math.ceil(S.stats.bestFloor / FLOORS_PER_BIOME) * FLOORS_PER_BIOME + 1;
  const st = S.stats;
  return (
    <>
      <h3 className="sec">Атлас земель</h3>
      <div className="atlas">
        {BIOMES.map((b, i) => {
          const seen = S.seen.biomes.includes(i);
          return (
            <div key={b.name} className={`atlas-item${seen ? '' : ' unknown'}`} style={{ '--g': b.glow }}>
              <div className="atlas-floor">{i * 10 + 1}–{i * 10 + 10}</div>
              <div className="atlas-name">{seen ? b.name : '???'}</div>
            </div>
          );
        })}
      </div>
      <p className="sub center">После 100-го этажа земли повторяются на новом Круге — злее и страшнее. Конца нет.<br />Следующие земли: этаж {nextBiomeFloor}</p>

      <h3 className="sec">Бестиарий свойств <small>{S.seen.traits.length}/{TRAITS.length}</small></h3>
      <div className="codex-u">
        {TRAITS.map(t => {
          const seen = S.seen.traits.includes(t.id);
          return <div key={t.id} className={`cu${seen ? '' : ' unknown'}`}><b style={{ color: seen ? t.color : undefined }}>{seen ? t.name : '???'}</b><span>{seen ? t.desc : 'Встречается у элитных монстров'}</span></div>;
        })}
      </div>

      <h3 className="sec">Легендарные свойства <small>{S.seen.uniques.length}/{allU.length}</small></h3>
      <div className="codex-u">
        {allU.map(u => {
          const seen = S.seen.uniques.includes(u.id);
          return (
            <div key={u.id} className={`cu${seen ? '' : ' unknown'}`}>
              <b style={{ color: seen ? RARITIES[4].color : undefined }}>{seen ? u.name : '???'}</b>
              <span>{seen ? u.desc : 'Найди легендарный предмет, чтобы узнать'}</span>
            </div>
          );
        })}
      </div>

      <h3 className="sec">Хроника</h3>
      <div className="stats">
        {[
          ['Глубже всего', `Этаж ${st.bestFloor}`], ['Кампаний', S.campaigns], ['Бросков d20', fmt(st.rolls)],
          ['Нат. 20 / нат. 1', `${fmt(st.nat20)} / ${fmt(st.nat1)}`], ['Убито монстров', fmt(st.kills)], ['Повержено боссов', fmt(st.bosses)],
          ['Блоков', fmt(st.blocks)], ['Слабых мест', fmt(st.weak)], ['Поражений отряда', fmt(st.deaths)],
          ['Найдено вещей', fmt(st.items)], ['Легендарок', fmt(st.legendaries)], ['Удачных заточек', fmt(st.upgrades)],
          ['Всего золота', fmt(st.gold)], ['Осколков за всё время', fmt(S.shardsTotal)], ['В пути', fmtTime((Date.now() - S.started) / 1000)],
        ].map(([k, v]) => <div key={k} className="stat"><div className="k">{k}</div><div className="v">{v}</div></div>)}
      </div>
      <div className="center"><button className="btn-ghost" onClick={() => openModal(() => (
        <div className="modal-inner"><h3>Стереть всё?</h3><p>Весь прогресс, предметы и реликвии будут удалены навсегда.</p>
          <button className="btn-big red" onClick={() => { closeModal(); wipe(); }}>Стереть</button>
          <button className="btn-ghost" onClick={closeModal}>Отмена</button></div>))}>Стереть сохранение</button></div>
    </>
  );
}

// ================= Реликвии и новая кампания =================
export function Relics() {
  const { S } = useGame();
  const gain = pendingShards();
  return (
    <div className="panel">
      <div className="panel-head"><h2>Реликвии</h2><div className="shards-big"><Icon name="gem" />{fmt(S.shards)}</div></div>
      <div className="glory">
        <div className="glory-ico"><Icon name="gem" /></div>
        <p>Распусти отряд и начни <b>новую кампанию</b>. Получишь <b>Осколки Судьбы</b> на вечные реликвии.</p>
        <p className="sub">Снаряжение сгорит, кроме фамильных вещей ({heirSlots()} шт.). Пыль — наполовину. Таланты и уровень сбросятся.</p>
        {S.curses.length > 0 && <div className="cur-curses">{S.curses.map(id => <span key={id}>{CURSES.find(c => c.id === id).name}</span>)}</div>}
        <div className="gain">+{gain} <Icon name="gem" className="inl" /></div>
        <p className="sub">{S.maxFloor < PRESTIGE_FLOOR ? `Доступно с этажа ${PRESTIGE_FLOOR}` : `Проклятия этой кампании: ×${curseMul().toFixed(1)} осколков`}</p>
        <button className="btn-big purple" disabled={gain < 1} onClick={() => openModal(() => <PrestigeModal />, { noClose: true })}>Новая кампания</button>
      </div>
      {RELICS.map(r => {
        const l = relic(r.id), maxed = l >= r.max, cost = relicCost(r);
        return (
          <div key={r.id} className="hcard relic" style={{ '--c': '#b77cff' }}>
            <div className="portrait"><div className="pface"><Icon name={r.icon} /></div><span className="lvl">{l}{r.max !== Infinity ? '/' + r.max : ''}</span></div>
            <div className="h-info"><div className="h-name">{r.name}</div><div className="h-stat">{r.desc(l)}</div>
              {!maxed && <div className="h-last">След. ур.: {r.desc(l + 1)}</div>}</div>
            <button className="btn-buy purple" disabled={maxed || S.shards < cost} onClick={() => buyRelic(r)}>
              <span className="t">{maxed ? 'Максимум' : 'Улучшить'}</span>
              <span className="c">{maxed ? '—' : <><Icon name="gem" className="inl" />{fmt(cost)}</>}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function PrestigeModal() {
  const { S } = useGame();
  const [keep, setKeep] = useState([]);
  const [curses, setCurses] = useState([]);
  const items = [...Object.values(S.eq).filter(Boolean), ...S.inv].sort((a, b) => b.rar - a.rar || b.ilvl - a.ilvl).slice(0, 24);
  const slots = heirSlots();
  const toggleKeep = id => setKeep(k => k.includes(id) ? k.filter(x => x !== id) : k.length < slots ? [...k, id] : [...k.slice(1), id]);
  const toggleCurse = id => setCurses(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  return (
    <div className="modal-inner">
      <h3>Новая кампания</h3>
      <p>Сейчас получишь <b>+{pendingShards()}</b> осколков.</p>
      <h4 className="sec" style={{ fontSize: 16 }}>Фамильные вещи ({keep.length}/{slots})</h4>
      {items.length ? (
        <div className="heir-grid">
          {items.map(it => (
            <button key={it.id} className={`tile r${it.rar}${keep.includes(it.id) ? ' sel' : ''}`} style={{ '--r': RARITIES[it.rar].color }} onClick={() => toggleKeep(it.id)}>
              <ItemIcon item={it} />{it.plus > 0 && <span className="plus">+{it.plus}</span>}
            </button>
          ))}
        </div>
      ) : <p className="sub">Нечего сохранить.</p>}
      <h4 className="sec" style={{ fontSize: 16 }}>Проклятия следующей кампании</h4>
      <p className="sub">Чем больше проклятий — тем больше осколков в конце следующей кампании.</p>
      <div className="curses">
        {CURSES.map(c => (
          <button key={c.id} className={`curse${curses.includes(c.id) ? ' on' : ''}`} onClick={() => toggleCurse(c.id)}>
            <Icon name="skull" className="inl" />
            <div><b>{c.name}</b><span>{c.desc}</span></div>
            <span className="cb">+{Math.round(c.bonus * 100)}%</span>
          </button>
        ))}
      </div>
      <p className="sub">Множитель осколков: <b>×{curseMul(curses).toFixed(1)}</b></p>
      <button className="btn-big purple" onClick={() => { closeModal(); prestige(keep, curses); }}>Начать кампанию</button>
      <br /><button className="btn-ghost" onClick={closeModal}>Отмена</button>
    </div>
  );
}
