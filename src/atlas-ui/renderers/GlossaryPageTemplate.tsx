import type { BookRegistry } from '../../atlas-core/registry';
import type { GlossaryCategory, GlossaryEntry } from '../../atlas-core/types/glossary';
import { Term } from '../glossary/Term';
import { Chip } from '../primitives';

const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  'vat-basic': 'VAT 基础概念',
  goods: '货物供应',
  services: '服务给付',
  invoice: '发票与凭证',
  reporting: '申报与报告',
  legal: '法规与条文',
  customs: '海关',
  'reader-ui': '阅读器界面',
};

type GlossaryPageTemplateProps = {
  registry: BookRegistry;
};

export function GlossaryPageTemplate({ registry }: GlossaryPageTemplateProps) {
  const terms = Array.from(registry.glossary.values());
  const grouped = new Map<GlossaryCategory, GlossaryEntry[]>();
  for (const term of terms) {
    const list = grouped.get(term.category) ?? [];
    list.push(term);
    grouped.set(term.category, list);
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-8 text-text overflow-auto max-h-full bg-page">
      <h1 className="text-3xl font-bold font-serif mb-8 text-text">术语表</h1>

      {Array.from(grouped.entries()).map(([category, categoryTerms]) => (
        <section key={category} className="mb-8">
          <h2 className="text-xl font-semibold font-serif mb-4 text-text border-b border-border pb-2">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="space-y-4">
            {categoryTerms.map((entry) => (
              <div key={entry.termId} id={entry.termId} className="scroll-mt-16">
                <div className="flex items-baseline gap-2">
                  <Term entry={entry} bookSlug={registry.manifest.slug} first />
                </div>
                <p className="text-text-2 text-sm mt-1 ml-1 leading-relaxed">
                  {entry.shortDefinition}
                </p>
                {entry.relatedTermIds && entry.relatedTermIds.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 mt-1 ml-1">
                    <span className="text-text-muted text-[11px]">相关术语:</span>
                    {entry.relatedTermIds.map((id) => {
                      const related = registry.getTerm(id);
                      const label = related ? `${related.zh}(${related.original})` : id;
                      return <Chip key={id}>{label}</Chip>;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
