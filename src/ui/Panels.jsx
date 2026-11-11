import { motion } from 'motion/react';
import {
  buyHero, heroCost, heroBuyK, heroDps, heroHit, heroCritMin, heroInterval, heroUnlocked, nextMilestone, setBuyMode,
  PLAYER_UPGRADES, upgradeK, buyUpgrade, tapAvg, partyDps, hitChance, playerHit, dmgMul, floorAC,
  pendingShards, prestige, wipe, relicCost, buyRelic, relic, goldPerSec,
} from '../engine/engine.js';
import { HEROES, RELICS, BIOMES, PRESTIGE_FLOOR, FLOORS_PER_BIOME } from '../engine/data.js';
import { UNIQUES, RARITIES } from '../engine/loot.js';
import { HeroIcon, Icon, DieIcon } from '../art/Icons.jsx';
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
        <span>Урон отряда <b>{fmt(partyDps())}</b>/с</span>
        <span>Золото <b>{fmt(goldPerSec())}</b>/с</span>
      </div>
      {HEROES.map((h, i) => {
        const lvl = S.heroes[h.id];
        const prevHired = i === 0 || S.heroes[HEROES[i - 1].id] > 0;
        if (!lvl && !prevHired) return null;
        const unlocked = heroUnlocked(h);
        if (!unlocked) {
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
              <div className="h-last">{lr ? (lr.miss ? <>d20 <b>{lr.r}</b> · промах</> :
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
  return (
    <div className="panel">
      <div className="panel-head"><h2>Твой персонаж</h2><BuyMode /></div>
      <div className="stats">
        <div className="stat"><div className="k">Средний урон тапа</div><div className="v">{fmt(tapAvg())}</div></div>
        <div className="stat"><div className="k">Урон отряда / сек</div><div className="v">{fmt(partyDps())}</div></div>
        <div className="stat"><div className="k">Шанс попасть (КД {ac})</div><div className="v">{Math.round(hitChance(playerHit(), ac, false) * 100)}%</div></div>
        <div className="stat"><div className="k">Общий множитель урона</div><div className="v">×{fmt(dmgMul())}</div></div>
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

// ================= Реликвии =================
export function Relics() {
  const { S } = useGame();
  const gain = pendingShards();
  return (
    <div className="panel">
      <div className="panel-head"><h2>Реликвии</h2><div className="shards-big"><Icon name="gem" />{fmt(S.shards)}</div></div>
      <div className="glory">
        <div className="glory-ico"><Icon name="gem" /></div>
        <p>Распусти отряд и начни <b>новую кампанию</b> с первого этажа. Заберёшь <b>Осколки Судьбы</b> — на них покупаются вечные реликвии.</p>
        <p className="sub">Экипировка, пыль и реликвии остаются навсегда.</p>
        <div className="gain">+{gain} <Icon name="gem" className="inl" /></div>
        <p className="sub">{S.maxFloor < PRESTIGE_FLOOR ? `Доступно с этажа ${PRESTIGE_FLOOR}` : `Чем глубже — тем больше. Этаж ${S.maxFloor + 5} даст ещё больше.`}</p>
        <button className="btn-big purple" disabled={gain < 1} onClick={() => openModal(() => (
          <div className="modal-inner">
            <h3>Новая кампания?</h3>
            <p>Герои, золото и этажи сбросятся. Ты получишь <b>+{gain}</b> осколков.</p>
            <button className="btn-big purple" onClick={() => { closeModal(); prestige(); }}>Начать заново</button>
            <button className="btn-ghost" onClick={closeModal}>Отмена</button>
          </div>))}>Новая кампания</button>
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

// ================= Кодекс =================
export function Codex() {
  const { S } = useGame();
  const allU = Object.entries(UNIQUES).flatMap(([slot, us]) => us.map(u => ({ ...u, slot })));
  const nextBiomeFloor = Math.ceil(S.stats.bestFloor / FLOORS_PER_BIOME) * FLOORS_PER_BIOME + 1;
  const st = S.stats;
  return (
    <div className="panel">
      <div className="panel-head"><h2>Кодекс</h2></div>
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
      <p className="sub center">После 100-го этажа земли повторяются на новом Круге — монстры злее, имена страшнее. Конца нет.<br />
        Следующие земли: этаж {nextBiomeFloor}</p>

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
          ['Найдено вещей', fmt(st.items)], ['Легендарок', fmt(st.legendaries)], ['Удачных заточек', fmt(st.upgrades)],
          ['Всего золота', fmt(st.gold)], ['Осколков за всё время', fmt(S.shardsTotal)], ['В пути', fmtTime((Date.now() - S.started) / 1000)],
        ].map(([k, v]) => <div key={k} className="stat"><div className="k">{k}</div><div className="v">{v}</div></div>)}
      </div>
      <div className="center"><button className="btn-ghost" onClick={() => openModal(() => (
        <div className="modal-inner"><h3>Стереть всё?</h3><p>Весь прогресс, предметы и реликвии будут удалены навсегда.</p>
          <button className="btn-big red" onClick={() => { closeModal(); wipe(); }}>Стереть</button>
          <button className="btn-ghost" onClick={closeModal}>Отмена</button></div>))}>Стереть сохранение</button></div>
    </div>
  );
}
