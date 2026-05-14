import type { LocalizedText } from '../../atlas-core/types/primitives';
import type { ReaderInteractionMode } from '../../atlas-core/types/primitives';

type ReaderTopBarProps = {
  title: LocalizedText;
  pageTitle?: LocalizedText;
  pageNumber?: number;
  totalPages: number;
  interactionMode: ReaderInteractionMode;
};

export function ReaderTopBar({
  title,
  pageTitle,
  pageNumber,
  totalPages,
  interactionMode,
}: ReaderTopBarProps) {
  const displayTitle = pageTitle?.['zh-CN'] ?? title['zh-CN'] ?? '';

  return (
    <header className="flex items-center justify-between px-4 py-2 bg-stone-950 text-stone-200 text-sm shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-semibold truncate">{displayTitle}</span>
      </div>
      <div className="flex items-center gap-2 text-stone-400 shrink-0">
        {pageNumber != null && (
          <span>{pageNumber} / {totalPages}</span>
        )}
        {interactionMode === 'debugOverlay' && (
          <span className="text-orange-400 text-xs font-mono">DEBUG</span>
        )}
      </div>
    </header>
  );
}
