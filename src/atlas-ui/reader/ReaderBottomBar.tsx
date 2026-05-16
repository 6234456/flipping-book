import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../primitives';

type ReaderBottomBarProps = {
  currentIndex: number;
  totalPages: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
};

export function ReaderBottomBar({
  currentIndex,
  totalPages,
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
}: ReaderBottomBarProps) {
  const progress = totalPages > 1 ? (currentIndex / (totalPages - 1)) * 100 : 100;

  return (
    <footer className="flex flex-col shrink-0 bg-page border-t border-border">
      <div className="h-1 bg-border">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
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
