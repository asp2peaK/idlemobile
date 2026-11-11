import { useSyncExternalStore, useEffect } from 'react';
import { G, subscribe, onEvent } from '../engine/engine.js';

// Перерисовка компонента при каждом notify() движка
export function useGame() {
  useSyncExternalStore(subscribe, () => G.version);
  return G;
}
export function useEvents(fn, deps = []) {
  useEffect(() => onEvent(fn), deps); // eslint-disable-line react-hooks/exhaustive-deps
}

const SUF = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg'];
export function fmt(n) {
  if (n === Infinity) return '∞';
  if (!isFinite(n)) return '—';
  if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : Math.floor(n).toString();
  const t = Math.floor(Math.log10(n) / 3);
  if (t >= SUF.length) return n.toExponential(2).replace('+', '');
  const v = n / 1000 ** t;
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + SUF[t];
}
export function fmtTime(s) {
  s = Math.floor(s);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
  if (h) return `${h} ч ${m} мин`;
  if (m) return `${m} мин ${s % 60} с`;
  return `${s % 60} с`;
}

// ---------- Модалки ----------
let modal = null;
const mListeners = new Set();
export function openModal(render, opts = {}) { modal = { render, opts, key: Math.random() }; mListeners.forEach(f => f()); }
export function closeModal() { modal = null; mListeners.forEach(f => f()); }
export function useModal() {
  return useSyncExternalStore(fn => { mListeners.add(fn); return () => mListeners.delete(fn); }, () => modal);
}

export const vibrate = p => { try { navigator.vibrate?.(p); } catch { /* нет вибрации */ } };
