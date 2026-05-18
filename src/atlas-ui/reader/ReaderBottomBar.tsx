import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PageManifest } from '../../atlas-core/types/page';
import type { PageId } from '../../atlas-core/types/primitives';
import { Button } from '../primitives';

type ProgressBarProps = {
  currentIndex: number;
  totalPages: number;
  readingOrder: PageId[];
  getPage: (pageId: PageId) => PageManifest | undefined;
  onNavigateToPage: (pageId: PageId) => void;
};

function ProgressBar({
  currentIndex,
  totalPages,
  readingOrder,
  getPage,
  onNavigateToPage,
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  function indexAtClientX(clientX: number): number | null {
    const el = barRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.min(totalPages - 1, Math.floor(ratio * totalPages));
  }

  const progressPct =
    totalPages > 1 ? (currentIndex / (totalPages - 1)) * 100 : 100;
  const hoverPct =
    hoverIndex != null && totalPages > 1
      ? (hoverIndex / (totalPages - 1)) * 100
      : null;
  const hoverPageId = hoverIndex != null ? readingOrder[hoverIndex] : undefined;
  const hoverPage = hoverPageId ? getPage(hoverPageId) : undefined;

  return (
    <div
      className="relative py-2 cursor-pointer group"
      onMouseMove={(e) => {
        const idx = indexAtClientX(e.clientX);
        if (idx != null) setHoverIndex(idx);
      }}
      onMouseLeave={() => setHoverIndex(null)}
      onClick={(e) => {
        const idx = indexAtClientX(e.clientX);
        if (idx != null) {
          const pageId = readingOrder[idx];
          if (pageId) onNavigateToPage(pageId);
        }
      }}
      data-testid="progress-bar"
    >
      <div
        ref={barRef}
        className="h-1 bg-border rounded-full transition-[height] duration-100 group-hover:h-1.5"
      >
        <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      {hoverPct != null && hoverPage && (
        <div
          className="absolute -top-1 -translate-x-1/2 -translate-y-full bg-chrome text-page text-xs px-2 py-1 rounded shadow-[var(--shadow-2)] whitespace-nowrap pointer-events-none"
          style={{ left: `${hoverPct}%` }}
          data-testid="progress-tooltip"
        >
          <span className="font-mono text-text-muted text-[10px] mr-1.5">
            {hoverIndex! + 1}
          </span>
          {hoverPage.title?.['zh-CN'] ?? hoverPageId}
        </div>
      )}
    </div>
  );
}

type ReaderBottomBarProps = {
  currentIndex: number;
  totalPages: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  readingOrder: PageId[];
  getPage: (pageId: PageId) => PageManifest | undefined;
  onNavigateToPage: (pageId: PageId) => void;
};

export function ReaderBottomBar({
  currentIndex,
  totalPages,
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  readingOrder,
  getPage,
  onNavigateToPage,
}: ReaderBottomBarProps) {
  return (
    <footer className="flex flex-col shrink-0 bg-page border-t border-border">
      <ProgressBar
        currentIndex={currentIndex}
        totalPages={totalPages}
        readingOrder={readingOrder}
        getPage={getPage}
        onNavigateToPage={onNavigateToPage}
      />
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant="secondary"
          size="sm"
          leadingIcon={ChevronLeft}
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          上一页
        </Button>
        <span className="text-xs text-text-2 tabular-nums">
          {currentIndex + 1} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          trailingIcon={ChevronRight}
          onClick={onNext}
          disabled={!canGoNext}
        >
          下一页
        </Button>
      </div>
    </footer>
  );
}
