import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, ChevronDown, List, Pin } from 'lucide-react';
import type { BookRegistry } from '../../../atlas-core/registry';
import { useTocFolds } from '../../../atlas-core/reader/useTocFolds';
import { EmptyState, Icon } from '../../primitives';
import { groupPages, findGroupKey, type TocGroup } from './tocGrouping';

export type TocTabProps = {
  registry: BookRegistry;
  currentPageId: string | null;
  onNavigate: (pageId: string) => void;
};

export function TocTab({ registry, currentPageId, onNavigate }: TocTabProps) {
  const groups: TocGroup[] = useMemo(() => groupPages(registry.manifest.pages), [registry]);
  const currentGroupKey = useMemo(
    () => (currentPageId ? findGroupKey(groups, currentPageId) : null),
    [groups, currentPageId],
  );
  const folds = useTocFolds(
    registry.manifest.bookId,
    groups.map((g) => g.key),
    currentGroupKey,
  );

  const currentRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [currentPageId]);

  if (groups.length === 0) {
    return <EmptyState icon={List} title="暂无目录" description="此书未配置 readingOrder。" />;
  }

  // Build flat numbered list across all pages
  const pageNumbers = new Map<string, number>();
  let n = 0;
  for (const g of groups) {
    if (g.header.kind === 'real') pageNumbers.set(g.header.page.pageId, ++n);
    for (const c of g.children) pageNumbers.set(c.pageId, ++n);
  }

  // Sticky band
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentGroupHeaderRef = useRef<HTMLElement | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const root = scrollContainerRef.current;
    const target = currentGroupHeaderRef.current;
    if (!root || !target || typeof IntersectionObserver === 'undefined') return;

    const obs = new IntersectionObserver(
      (entries) => {
        const ent = entries[0];
        setStickyVisible(!ent.isIntersecting);
      },
      { root, threshold: 0 },
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, [currentGroupKey, currentPageId]);

  const currentGroup = groups.find((g) => g.key === currentGroupKey) ?? null;
  const stickyLabel = currentGroup
    ? currentGroup.header.kind === 'real'
      ? currentGroup.header.label
      : `${currentGroup.key} · ${currentGroup.header.label}`
    : '';

  function handleStickyClick() {
    currentRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }

  return (
    <div className="h-full flex flex-col">
      {stickyVisible && stickyLabel && (
        <button
          type="button"
          onClick={handleStickyClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent-bg text-accent font-medium border-b border-border w-full text-left hover:bg-accent-bg-2 shrink-0"
          data-testid="toc-sticky"
        >
          <Icon icon={Pin} size={12} className="shrink-0" />
          <span>当前位置 · {stickyLabel}</span>
        </button>
      )}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-2" data-testid="toc-scroll">
        {groups.map((g) => {
          const expanded = folds.isExpanded(g.key);
          const singlePage = g.children.length === 0 && g.header.kind === 'real';
          const isCurrentGroup = g.key === currentGroupKey;

          if (singlePage) {
            const pg = g.header.kind === 'real' ? g.header.page : null;
            if (!pg) return null;
            const num = pageNumbers.get(pg.pageId) ?? 0;
            const isCurrent = pg.pageId === currentPageId;
            return (
              <button
                key={g.key}
                ref={isCurrent ? currentRef : null}
                type="button"
                data-toc-current={isCurrent ? 'true' : 'false'}
                onClick={() => onNavigate(pg.pageId)}
                className={[
                  'w-full text-left flex items-baseline gap-3 px-4 py-2 text-sm transition-colors',
                  isCurrent ? 'bg-accent-bg text-accent font-medium' : 'text-text hover:bg-surface-2',
                ].join(' ')}
              >
                <span className="text-text-muted text-xs w-6 text-right shrink-0 tabular-nums">{num}</span>
                <span className="flex-1 truncate">{pg.title?.['zh-CN'] ?? pg.pageId}</span>
              </button>
            );
          }

          // Multi-page group
          return (
            <div key={g.key} data-toc-group={g.key}>
              <div
                ref={isCurrentGroup ? (el) => { currentGroupHeaderRef.current = el; } : undefined}
                className={[
                  'flex items-baseline gap-2 px-3 py-1.5 text-sm',
                  isCurrentGroup ? 'text-accent font-semibold' : 'text-text-2 font-medium',
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() => folds.toggle(g.key)}
                  className="shrink-0 text-text-muted hover:text-text"
                  aria-label={`${expanded ? '折叠' : '展开'}${g.header.label}`}
                  aria-expanded={expanded}
                  data-toc-chevron={g.key}
                >
                  <Icon icon={expanded ? ChevronDown : ChevronRight} size={14} />
                </button>
                {g.header.kind === 'real' ? (
                  <button
                    ref={g.header.page.pageId === currentPageId ? currentRef : null}
                    type="button"
                    data-toc-current={g.header.page.pageId === currentPageId ? 'true' : 'false'}
                    onClick={() => onNavigate(g.header.kind === 'real' ? g.header.page.pageId : '')}
                    className="flex-1 text-left flex items-baseline gap-2 hover:underline"
                  >
                    <span className="text-text-muted text-xs w-6 text-right shrink-0 tabular-nums">
                      {pageNumbers.get(g.header.page.pageId) ?? ''}
                    </span>
                    <span className="truncate">{g.header.label}</span>
                  </button>
                ) : (
                  <span className="flex-1 flex items-baseline gap-2">
                    <span className="text-text-muted text-xs uppercase tracking-wider shrink-0">{g.key}</span>
                    <span className="truncate">{g.header.label}({g.children.length})</span>
                  </span>
                )}
              </div>
              {expanded && (
                <div>
                  {g.children.map((c) => {
                    const isCurrent = c.pageId === currentPageId;
                    const num = pageNumbers.get(c.pageId) ?? 0;
                    return (
                      <button
                        key={c.pageId}
                        ref={isCurrent ? currentRef : null}
                        type="button"
                        data-toc-current={isCurrent ? 'true' : 'false'}
                        onClick={() => onNavigate(c.pageId)}
                        className={[
                          'w-full text-left flex items-baseline gap-3 pl-10 pr-4 py-1.5 text-sm transition-colors',
                          isCurrent ? 'bg-accent-bg text-accent font-medium' : 'text-text-2 hover:bg-surface-2 hover:text-text',
                        ].join(' ')}
                      >
                        <span className="text-text-muted text-xs w-6 text-right shrink-0 tabular-nums">{num}</span>
                        <span className="flex-1 truncate">{c.title?.['zh-CN'] ?? c.pageId}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
