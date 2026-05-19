import { useCallback, useEffect, useState } from 'react';

type FoldState = 'expanded' | 'collapsed';
type FoldMap = Record<string, FoldState>;

function storageKey(bookId: string) {
  return `atlas-toc-folds-${bookId}`;
}

function loadStored(bookId: string): FoldMap {
  try {
    const raw = localStorage.getItem(storageKey(bookId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed as FoldMap;
  } catch {
    return {};
  }
}

export type UseTocFolds = {
  isExpanded: (groupKey: string) => boolean;
  toggle: (groupKey: string) => void;
};

export function useTocFolds(
  bookId: string,
  groupKeys: string[],
  currentGroupKey: string | null,
): UseTocFolds {
  const [userFolds, setUserFolds] = useState<FoldMap>(() => loadStored(bookId));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync localStorage to state on book change
    setUserFolds(loadStored(bookId));
  }, [bookId]);

  const isExpanded = useCallback(
    (groupKey: string) => {
      if (userFolds[groupKey] === 'expanded') return true;
      if (userFolds[groupKey] === 'collapsed') return false;
      return groupKey === currentGroupKey;
    },
    [userFolds, currentGroupKey],
  );

  const toggle = useCallback(
    (groupKey: string) => {
      setUserFolds((prev) => {
        const currentlyExpanded = prev[groupKey] === 'expanded' ||
          (prev[groupKey] === undefined && groupKey === currentGroupKey);
        const next: FoldMap = { ...prev, [groupKey]: currentlyExpanded ? 'collapsed' : 'expanded' };
        try { localStorage.setItem(storageKey(bookId), JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
    [bookId, currentGroupKey],
  );

  void groupKeys;

  return { isExpanded, toggle };
}
