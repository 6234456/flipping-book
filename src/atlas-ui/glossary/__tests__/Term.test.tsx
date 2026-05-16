import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Term } from '../Term';
import { TooltipProvider } from '../../primitives';
import type { GlossaryEntry } from '../../../atlas-core/types/glossary';

const testEntry: GlossaryEntry = {
  termId: "leistung",
  zh: "给付",
  original: "Leistung",
  category: "vat-basic",
  shortDefinition: "VAT 判断的基本对象",
  firstMentionFormat: "给付（Leistung）",
};

const entryWithAbbr: GlossaryEntry = {
  termId: "ust-idnr",
  zh: "增值税识别号",
  original: "Umsatzsteuer-Identifikationsnummer",
  abbreviation: "USt-IdNr.",
  category: "invoice",
  shortDefinition: "欧盟内增值税识别号",
  firstMentionFormat: "增值税识别号（Umsatzsteuer-Identifikationsnummer, USt-IdNr.）",
};

describe('Term', () => {
  function renderTerm(entry: GlossaryEntry, first = false) {
    return render(
      <MemoryRouter>
        <TooltipProvider>
          <Term entry={entry} bookSlug="de-eu-vat" first={first} />
        </TooltipProvider>
      </MemoryRouter>
    );
  }

  it('renders dotted underline class', () => {
    renderTerm(testEntry);
    const span = screen.getByText('Leistung');
    expect(span.className).toContain('term');
  });

  it('shows firstMentionFormat when first=true', () => {
    renderTerm(testEntry, true);
    expect(screen.getByText('给付（Leistung）')).toBeInTheDocument();
  });

  it('shows original when first=false', () => {
    renderTerm(testEntry, false);
    expect(screen.getByText('Leistung')).toBeInTheDocument();
  });

  it('shows abbreviation instead of original when available and not first', () => {
    renderTerm(entryWithAbbr, false);
    expect(screen.getByText('USt-IdNr.')).toBeInTheDocument();
  });

  it('shows firstMentionFormat when first=true (with abbr)', () => {
    renderTerm(entryWithAbbr, true);
    expect(screen.getByText(entryWithAbbr.firstMentionFormat)).toBeInTheDocument();
  });
});
