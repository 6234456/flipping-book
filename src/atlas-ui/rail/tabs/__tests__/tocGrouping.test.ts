import { describe, it, expect } from 'vitest';
import { groupPages } from '../tocGrouping';
import type { PageManifest } from '../../../../atlas-core/types/page';

function p(sectionCode: string, pageId: string, title: string): PageManifest {
  return { sectionCode, pageId, title: { 'zh-CN': title } } as unknown as PageManifest;
}

describe('groupPages', () => {
  it('splits readingOrder into groups by sectionCode prefix', () => {
    const pages = [
      p('TOC', 'toc', 'TOC'),
      p('01', '01-fw', 'Framework'),
      p('09', '09', 'Chapter 9'),
      p('09-01', '09-01', '9.1'),
      p('09-02', '09-02', '9.2'),
      p('SC-01A', 'sc-01a', 'SC 1A'),
      p('SC-02', 'sc-02', 'SC 2'),
      p('G', 'glossary', 'Glossary'),
      p('APP-A', 'app-a', 'App A'),
    ];
    const groups = groupPages(pages);
    expect(groups.map((g) => g.key)).toEqual(['TOC', '01', '09', 'SC', 'G', 'APP']);
  });

  it('multi-page group with first page sectionCode == groupKey → real header', () => {
    const pages = [
      p('09', '09', 'Chapter 9'),
      p('09-01', '09-01', '9.1'),
    ];
    const groups = groupPages(pages);
    expect(groups[0].header.kind).toBe('real');
    expect(groups[0].header.page?.pageId).toBe('09');
    expect(groups[0].children).toHaveLength(1);
    expect(groups[0].children[0].pageId).toBe('09-01');
  });

  it('multi-page group without matching first page sectionCode → virtual header', () => {
    const pages = [
      p('SC-01A', 'sc-01a', 'SC 1A'),
      p('SC-02', 'sc-02', 'SC 2'),
    ];
    const groups = groupPages(pages);
    expect(groups[0].header.kind).toBe('virtual');
    expect(groups[0].header.label).toBe('场景');
    expect(groups[0].children).toHaveLength(2);
  });

  it('single-page group has no children', () => {
    const pages = [p('TOC', 'toc', 'TOC')];
    const groups = groupPages(pages);
    expect(groups[0].header.kind).toBe('real');
    expect(groups[0].header.page?.pageId).toBe('toc');
    expect(groups[0].children).toHaveLength(0);
  });

  it('groupKey unrecognized → label falls back to groupKey itself', () => {
    const pages = [
      p('XYZ-1', 'xyz-1', 'X1'),
      p('XYZ-2', 'xyz-2', 'X2'),
    ];
    const groups = groupPages(pages);
    expect(groups[0].header.label).toBe('XYZ');
  });

  it('find a group key by pageId', () => {
    const pages = [
      p('09', '09', 'Chapter 9'),
      p('09-01', '09-01', '9.1'),
      p('SC-01A', 'sc-01a', 'SC 1A'),
    ];
    const groups = groupPages(pages);
    const found = groups.find((g) => g.header.page?.pageId === '09-01' || g.children.some((c) => c.pageId === '09-01'));
    expect(found?.key).toBe('09');
  });
});
