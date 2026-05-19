import { describe, it, expect } from 'vitest';
import { flattenRichText } from '../flattenRichText';
import type { RichTextNode } from '../../types/content';

describe('flattenRichText', () => {
  it('returns empty string for empty array', () => {
    expect(flattenRichText([])).toBe('');
  });

  it('extracts plain text nodes', () => {
    const nodes: RichTextNode[] = [
      { type: 'text', value: 'Hello' },
      { type: 'text', value: 'World' },
    ];
    expect(flattenRichText(nodes)).toBe('Hello World');
  });

  it('recurses into strong and em children', () => {
    const nodes: RichTextNode[] = [
      { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
      { type: 'em', children: [{ type: 'text', value: 'italic' }] },
    ];
    expect(flattenRichText(nodes)).toBe('bold italic');
  });

  it('ignores term/legalRef/scenarioLink/pageLink', () => {
    const nodes: RichTextNode[] = [
      { type: 'text', value: 'See ' },
      { type: 'term', termId: 'werklieferung' },
      { type: 'text', value: ' and ' },
      { type: 'legalRef', legalRefId: '§ 25b UStG' },
      { type: 'text', value: '.' },
    ];
    expect(flattenRichText(nodes)).toBe('See and .');
  });

  it('handles nested strong inside em', () => {
    const nodes: RichTextNode[] = [
      { type: 'em', children: [{ type: 'strong', children: [{ type: 'text', value: 'deep' }] }] },
    ];
    expect(flattenRichText(nodes)).toBe('deep');
  });
});
