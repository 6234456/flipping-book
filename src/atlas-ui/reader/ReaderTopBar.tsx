import { BookOpen } from 'lucide-react';
import { Icon } from '../primitives';
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
  const brand = title['zh-CN'] ?? '';
  const sub = pageTitle?.['zh-CN'];

  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-chrome text-page text-sm shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-accent-2"><Icon icon={BookOpen} size={18} /></span>
        <span className="font-semibold truncate">{brand}</span>
        {sub ? (
          <>
            <span className="text-text-muted">·</span>
            <span className="text-divider truncate">{sub}</span>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-divider shrink-0">
        {pageNumber != null ? (
          <span className="tabular-nums">
            {pageNumber} / {totalPages}
          </span>
        ) : null}
        {interactionMode === 'debugOverlay' ? (
          <span className="text-accent-2 text-xs font-mono">DEBUG</span>
        ) : null}
      </div>
    </header>
  );
}
