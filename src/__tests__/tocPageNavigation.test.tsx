import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TOCPageTemplate } from '../atlas-ui/renderers/TOCPageTemplate';
import type { PageManifest } from '../atlas-core/types/page';

const tocPage = {
  pageId: 'toc',
  type: 'toc',
  title: { 'zh-CN': '目录' },
  layout: { mode: 'single' },
} as unknown as PageManifest;

function buildPage(id: string, num: number): PageManifest {
  return {
    pageId: id,
    type: 'imageOverlay',
    title: { 'zh-CN': `Page ${num}` },
    layout: { mode: 'single' },
    pageNumber: num,
  } as unknown as PageManifest;
}

describe('TOCPageTemplate', () => {
  it('generates full /book/<slug>/page/<id> links (regression: was missing slug)', () => {
    const order = ['p-1', 'p-2'];
    const getPage = (id: string) => buildPage(id, Number(id.replace('p-', '')));

    render(
      <MemoryRouter>
        <TOCPageTemplate
          page={tocPage}
          locale="zh-CN"
          readingOrder={order}
          getPage={getPage}
          bookSlug="de-eu-vat"
        />
      </MemoryRouter>,
    );

    const link1 = screen.getByRole('link', { name: /Page 1/ });
    expect(link1.getAttribute('href')).toBe('/book/de-eu-vat/page/p-1');
    const link2 = screen.getByRole('link', { name: /Page 2/ });
    expect(link2.getAttribute('href')).toBe('/book/de-eu-vat/page/p-2');
  });
});
