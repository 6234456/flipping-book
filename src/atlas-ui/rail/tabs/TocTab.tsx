import { useEffect, useRef } from 'react';
import { List } from 'lucide-react';
import type { BookRegistry } from '../../../atlas-core/registry';
import { EmptyState } from '../../primitives';

export type TocTabProps = {
  registry: BookRegistry;
  currentPageId: string | null;
  onNavigate: (pageId: string) => void;
};

export function TocTab({ registry, currentPageId, onNavigate }: TocTabProps) {
  const currentRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [currentPageId]);

  const order = registry.manifest.readingOrder ?? [];

  if (order.length === 0) {
    return <EmptyState icon={List} title="暂无目录" description="此书未配置 readingOrder。" />;
  }

  return (
    <div className="h-full overflow-y-auto py-2">
      <ol className="space-y-px">
        {order.map((pageId, i) => {
          const p = registry.getPage(pageId);
          if (!p) return null;
          const current = pageId === currentPageId;
          const title = p.title?.['zh-CN'] ?? pageId;
          return (
            <li key={pageId}>
              <button
                ref={current ? currentRef : null}
                type="button"
                data-toc-current={current ? 'true' : 'false'}
                onClick={() => onNavigate(pageId)}
                className={[
                  'w-full text-left flex items-baseline gap-3 px-4 py-2 text-sm transition-colors',
                  current
                    ? 'bg-accent-bg text-accent font-medium'
                    : 'text-text hover:bg-surface-2',
                ].join(' ')}
              >
                <span className="text-text-muted text-xs w-6 text-right shrink-0 tabular-nums">
                  {p.pageNumber ?? i + 1}
                </span>
                <span className="flex-1 truncate">{title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
