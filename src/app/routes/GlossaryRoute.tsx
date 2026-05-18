import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { createBookRegistry } from '../../atlas-core/registry';
import { loadBook, type LoadedBook } from '../../atlas-core/loader';
import { GlossaryPageTemplate } from '../../atlas-ui/renderers/GlossaryPageTemplate';
import {
  EmptyState,
  ToastProvider,
  TooltipProvider,
} from '../../atlas-ui/primitives';
import type { BookRegistry } from '../../atlas-core/registry';
import type { OverlayConfig } from '../../atlas-core/types/overlay';

function buildRegistry(data: LoadedBook): BookRegistry {
  return createBookRegistry(
    data.manifest,
    data.images,
    data.overlays as unknown as OverlayConfig[],
    data.glossary,
    data.legalRefs,
    data.scenarios,
    data.notes,
    data.contents,
    [],
  );
}

export function GlossaryRoute() {
  const [registry, setRegistry] = useState<BookRegistry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadBook()
      .then((data) => {
        if (!cancelled) setRegistry(buildRegistry(data));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <TooltipProvider>
        <ToastProvider>
          <div className="h-dvh flex items-center justify-center bg-surface">
            <EmptyState icon={AlertTriangle} title="术语表加载失败" description={error} />
          </div>
        </ToastProvider>
      </TooltipProvider>
    );
  }

  if (!registry) {
    return (
      <TooltipProvider>
        <ToastProvider>
          <div className="h-dvh flex items-center justify-center bg-surface">
            <EmptyState icon={BookOpen} title="加载术语表中…" />
          </div>
        </ToastProvider>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <ToastProvider>
        <div className="h-dvh overflow-auto bg-surface">
          <GlossaryPageTemplate registry={registry} />
        </div>
      </ToastProvider>
    </TooltipProvider>
  );
}
