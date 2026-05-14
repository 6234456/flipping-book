import { useReaderState, useKeyboardNavigation } from '../../atlas-core/reader';
import type { BookRegistry } from '../../atlas-core/registry';
import { ReaderShell } from './ReaderShell';

type MagazineReaderProps = {
  registry: BookRegistry;
  initialPageId?: string;
};

export function MagazineReader({ registry, initialPageId }: MagazineReaderProps) {
  const readerState = useReaderState(registry, initialPageId);
  useKeyboardNavigation(readerState, registry.manifest.reader.enableKeyboardNavigation);

  return <ReaderShell registry={registry} readerState={readerState} />;
}
