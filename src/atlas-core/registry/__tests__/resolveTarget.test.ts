import { describe, it, expect } from 'vitest';
import { resolveTargetRoute } from '../resolveTarget';

describe('resolveTargetRoute', () => {
  const slug = 'de-eu-vat';

  it('resolves page target', () => {
    expect(resolveTargetRoute({ kind: 'page', pageId: 'cover' }, slug))
      .toBe('/book/de-eu-vat/page/cover');
  });

  it('resolves scenario target', () => {
    expect(resolveTargetRoute({ kind: 'scenario', scenarioId: 'sc-01' }, slug))
      .toBe('/book/de-eu-vat/scenario/sc-01');
  });

  it('resolves legalRef target', () => {
    expect(resolveTargetRoute({ kind: 'legalRef', legalRefId: 'ustg-1' }, slug))
      .toBe('/book/de-eu-vat/legal/ustg-1');
  });

  it('resolves glossary target without termId', () => {
    expect(resolveTargetRoute({ kind: 'glossary' }, slug))
      .toBe('/book/de-eu-vat/glossary');
  });

  it('resolves glossary target with termId', () => {
    expect(resolveTargetRoute({ kind: 'glossary', termId: 'leistung' }, slug))
      .toBe('/book/de-eu-vat/glossary#leistung');
  });

  it('returns external href directly', () => {
    expect(resolveTargetRoute({ kind: 'external', href: 'https://example.com' }, slug))
      .toBe('https://example.com');
  });

  it('returns null for commentAnchor target', () => {
    expect(resolveTargetRoute({ kind: 'commentAnchor', threadId: 'thread-1' }, slug))
      .toBeNull();
  });
});
