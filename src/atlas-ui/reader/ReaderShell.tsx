import type { BookRegistry } from '../../atlas-core/registry';
import type { ReaderState } from '../../atlas-core/reader';
import { ReaderTopBar } from './ReaderTopBar';
import { ReaderBottomBar } from './ReaderBottomBar';
import { PageViewport } from './PageViewport';

type ReaderShellProps = {
  registry: BookRegistry;
  readerState: ReaderState;
};

export function ReaderShell({ registry, readerState }: ReaderShellProps) {
  const { manifest } = registry;
  const { currentPage, interactionMode } = readerState;

  return (
    <div className="flex flex-col h-dvh bg-stone-900">
      {manifest.navigation?.showTopBar && (
        <ReaderTopBar
          title={manifest.title}
          pageTitle={currentPage?.title}
          pageNumber={currentPage?.pageNumber}
          totalPages={readerState.totalPages}
          interactionMode={interactionMode}
        />
      )}

      <PageViewport registry={registry} readerState={readerState} />

      {manifest.navigation?.showBottomBar && (
        <ReaderBottomBar
          currentIndex={readerState.currentPageIndex}
          totalPages={readerState.totalPages}
          canGoNext={readerState.canGoNext}
          canGoPrevious={readerState.canGoPrevious}
          onNext={readerState.goNext}
          onPrevious={readerState.goPrevious}
        />
      )}
    </div>
  );
}
