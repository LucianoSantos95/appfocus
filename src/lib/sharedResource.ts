import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Lightweight in-memory cache with subscription for Supabase-style list hooks.
 * - Deduplicates concurrent fetches for the same key
 * - Serves cached data instantly for `staleTime` ms (default 5min)
 * - Notifies all subscribers when data changes (mutate)
 * - Automatically re-fetches when key changes (e.g. user switch)
 *
 * Public API keeps the same shape as legacy useState+useEffect hooks:
 *   const { data, isLoading, refetch, mutate } = useSharedResource(...)
 */

type Fetcher<T> = () => Promise<T>;

interface Entry<T> {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  fetchedAt: number;
  inflight: Promise<T> | null;
  listeners: Set<() => void>;
}

const STORE = new Map<string, Entry<any>>();

function getEntry<T>(key: string, initial: T): Entry<T> {
  let e = STORE.get(key) as Entry<T> | undefined;
  if (!e) {
    e = {
      data: initial,
      isLoading: false,
      error: null,
      fetchedAt: 0,
      inflight: null,
      listeners: new Set(),
    };
    STORE.set(key, e);
  }
  return e;
}

function notify(entry: Entry<any>) {
  entry.listeners.forEach((l) => l());
}

async function runFetch<T>(key: string, fetcher: Fetcher<T>, entry: Entry<T>) {
  if (entry.inflight) return entry.inflight;
  entry.isLoading = entry.data === undefined || entry.data === null || (Array.isArray(entry.data) && entry.data.length === 0);
  notify(entry);
  const p = (async () => {
    try {
      const data = await fetcher();
      entry.data = data;
      entry.error = null;
      entry.fetchedAt = Date.now();
      return data;
    } catch (err) {
      entry.error = err;
      throw err;
    } finally {
      entry.isLoading = false;
      entry.inflight = null;
      notify(entry);
    }
  })();
  entry.inflight = p;
  return p;
}

export function useSharedResource<T>(
  key: string | null,
  fetcher: Fetcher<T>,
  options: { initial?: T; staleTime?: number; enabled?: boolean } = {}
) {
  const { initial, staleTime = 5 * 60 * 1000, enabled = true } = options;
  const effectiveKey = enabled && key ? key : null;

  // Ensure the entry exists synchronously before subscribe (avoids first-paint flicker).
  if (effectiveKey && !STORE.has(effectiveKey)) {
    getEntry(effectiveKey, initial as T);
  }

  const subscribe = (cb: () => void) => {
    if (!effectiveKey) return () => {};
    const e = getEntry<T>(effectiveKey, initial as T);
    e.listeners.add(cb);
    return () => {
      e.listeners.delete(cb);
    };
  };

  const getSnapshot = () => (effectiveKey ? getEntry<T>(effectiveKey, initial as T) : null);

  // useSyncExternalStore so React re-renders on notify()
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!effectiveKey) return;
    const e = getEntry<T>(effectiveKey, initial as T);
    const stale = Date.now() - e.fetchedAt > staleTime;
    if (e.data === undefined || e.data === null || stale) {
      runFetch(effectiveKey, fetcher, e).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveKey]);

  const refetch = () => {
    if (!effectiveKey) return Promise.resolve(undefined as unknown as T);
    const e = getEntry<T>(effectiveKey, initial as T);
    return runFetch(effectiveKey, fetcher, e);
  };

  const mutate = (updater: (prev: T | undefined) => T) => {
    if (!effectiveKey) return;
    const e = getEntry<T>(effectiveKey, initial as T);
    e.data = updater(e.data);
    notify(e);
  };

  return {
    data: (snap?.data ?? initial) as T,
    isLoading: snap?.isLoading ?? false,
    error: snap?.error ?? null,
    refetch,
    mutate,
  };
}

/** Manually invalidate/refresh a key from outside a component. */
export function invalidateResource(key: string) {
  const e = STORE.get(key);
  if (!e) return;
  e.fetchedAt = 0;
  notify(e);
}

/** Clear all cached resources (call on logout). */
export function clearAllResources() {
  STORE.forEach((e) => {
    e.data = undefined;
    e.fetchedAt = 0;
    e.error = null;
    notify(e);
  });
  STORE.clear();
}
