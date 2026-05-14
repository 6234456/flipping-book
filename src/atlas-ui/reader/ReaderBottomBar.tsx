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
    <footer className="flex flex-col shrink-0 bg-stone-950 text-stone-200">
      <div className="h-1 bg-stone-800">
        <div
          className="h-full bg-stone-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="px-3 py-1 rounded text-sm bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← 上一页
        </button>
        <span className="text-xs text-stone-400">
          {currentIndex + 1} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="px-3 py-1 rounded text-sm bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          下一页 →
        </button>
      </div>
    </footer>
  );
}
