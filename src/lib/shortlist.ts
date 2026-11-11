"use client";

import { useSyncExternalStore } from "react";

/**
 * Favoritos y comparador del visitante, guardados en el navegador.
 * Sin registro: el cliente marca, compara y comparte sin fricción.
 */
type Key = "favorites" | "compare";

const STORAGE: Record<Key, string> = { favorites: "rb:favorites", compare: "rb:compare" };
export const COMPARE_MAX = 4;

const listeners = new Set<() => void>();
const snapshots: Record<Key, string[]> = { favorites: [], compare: [] };
let hydrated = false;

function read(key: Key): string[] {
  try {
    const raw = localStorage.getItem(STORAGE[key]);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  snapshots.favorites = read("favorites");
  snapshots.compare = read("compare");
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE.favorites) snapshots.favorites = read("favorites");
    else if (e.key === STORAGE.compare) snapshots.compare = read("compare");
    else return;
    listeners.forEach((l) => l());
  });
}

function write(key: Key, next: string[]) {
  snapshots[key] = next;
  try {
    localStorage.setItem(STORAGE[key], JSON.stringify(next));
  } catch {
    /* modo privado: se mantiene en memoria */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const EMPTY: string[] = [];

export function useList(key: Key): string[] {
  return useSyncExternalStore(
    subscribe,
    () => (hydrate(), snapshots[key]),
    () => EMPTY,
  );
}

export function toggle(key: Key, id: string): boolean {
  hydrate();
  const cur = snapshots[key];
  if (cur.includes(id)) {
    write(key, cur.filter((x) => x !== id));
    return false;
  }
  if (key === "compare" && cur.length >= COMPARE_MAX) {
    write(key, [...cur.slice(1), id]);
    return true;
  }
  write(key, [id, ...cur]);
  return true;
}

export function clear(key: Key) {
  write(key, []);
}

const noop = () => () => {};
/** true solo en el navegador, después de hidratar (evita parpadeos de "lista vacía"). */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
