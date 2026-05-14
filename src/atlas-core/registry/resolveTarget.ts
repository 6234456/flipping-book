import type { HotspotTarget } from '../types/overlay';

export function resolveTargetRoute(target: HotspotTarget, bookSlug: string): string | null {
  switch (target.kind) {
    case 'page':
      return `/book/${bookSlug}/page/${target.pageId}`;
    case 'scenario':
      return `/book/${bookSlug}/scenario/${target.scenarioId}`;
    case 'legalRef':
      return `/book/${bookSlug}/legal/${target.legalRefId}`;
    case 'glossary':
      return `/book/${bookSlug}/glossary${target.termId ? `#${target.termId}` : ''}`;
    case 'external':
      return target.href;
    case 'commentAnchor':
      return null;
    default:
      return null;
  }
}
