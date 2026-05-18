import { useCallback, useEffect, useState } from 'react';

export type RailTab = 'comments' | 'notes' | 'toc';

export type RailState = {
  open: boolean;
  tab: RailTab;
  width: number;
  setOpen: (open: boolean) => void;
  setTab: (tab: RailTab) => void;
  toggleTab: (tab: RailTab) => void;
  collapse: () => void;
  expand: (toTab?: RailTab) => void;
};

const DEFAULT_WIDTH_RATIO = 0.32;
const MIN_WIDTH = 280;
const MAX_WIDTH = 480;
const VALID_TABS: readonly RailTab[] = ['comments', 'notes', 'toc'];

function defaultWidth(): number {
  if (typeof window === 'undefined') return MIN_WIDTH;
  return clamp(Math.round(window.innerWidth * DEFAULT_WIDTH_RATIO));
}

function clamp(n: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, n));
}

function storageKey(bookId: string): string {
  return `atlas-rail-${bookId}`;
}

type Stored = { open?: boolean; tab?: string; width?: number };

function loadStored(bookId: string): Stored {
  try {
    const raw = localStorage.getItem(storageKey(bookId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed != null ? parsed : {};
  } catch {
    return {};
  }
}

function isValidTab(t: unknown): t is RailTab {
  return typeof t === 'string' && VALID_TABS.includes(t as RailTab);
}

export function useRailState(bookId: string): RailState {
  const [open, setOpenInternal] = useState<boolean>(() => {
    const stored = loadStored(bookId);
    return typeof stored.open === 'boolean' ? stored.open : true;
  });
  const [tab, setTabInternal] = useState<RailTab>(() => {
    const stored = loadStored(bookId);
    return isValidTab(stored.tab) ? stored.tab : 'comments';
  });
  const [width] = useState<number>(() => {
    const stored = loadStored(bookId);
    return typeof stored.width === 'number' ? clamp(stored.width) : defaultWidth();
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey(bookId),
        JSON.stringify({ open, tab, width }),
      );
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [bookId, open, tab, width]);

  const setOpen = useCallback((next: boolean) => setOpenInternal(next), []);
  const setTab = useCallback((next: RailTab) => setTabInternal(next), []);
  const collapse = useCallback(() => setOpenInternal(false), []);
  const expand = useCallback((toTab?: RailTab) => {
    setOpenInternal(true);
    if (toTab) setTabInternal(toTab);
  }, []);
  const toggleTab = useCallback(
    (next: RailTab) => {
      setOpenInternal((curOpen) => {
        if (curOpen && tab === next) return false;
        return true;
      });
      setTabInternal(next);
    },
    [tab],
  );

  return { open, tab, width, setOpen, setTab, toggleTab, collapse, expand };
}
