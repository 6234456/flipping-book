import type { BookRegistry } from '../../atlas-core/registry';
import type { GlossaryCategory, GlossaryEntry } from '../../atlas-core/types/glossary';
import { Term } from '../glossary/Term';

const CATEGORY_LABELS: Record<GlossaryCategory, string> = {
  "vat-basic": "VAT 基础概念",
  goods: "货物供应",
  services: "服务给付",
  invoice: "发票与凭证",
  reporting: "申报与报告",
  legal: "法规与条文",
  customs: "海关",
  "reader-ui": "阅读器界面",
};

type GlossaryPageTemplateProps = {
  registry: BookRegistry;
};

export function GlossaryPageTemplate({ registry }: GlossaryPageTemplateProps) {
  const terms = Array.from(registry.glossary.values());

  // Group by category
  const grouped = new Map<GlossaryCategory, GlossaryEntry[]>();
  for (const term of terms) {
    const list = grouped.get(term.category) ?? [];
    list.push(term);
    grouped.set(term.category, list);
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-8 text-stone-200 overflow-auto max-h-full">
      <h1 className="text-3xl font-bold mb-8">术语表</h1>

      {Array.from(grouped.entries()).map(([category, categoryTerms]) => (
        <section key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-stone-300 border-b border-stone-700 pb-2">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <div className="space-y-4">
            {categoryTerms.map((entry) => (
              <div key={entry.termId} id={entry.termId} className="scroll-mt-16">
                <div className="flex items-baseline gap-2">
                  <Term entry={entry} bookSlug={registry.manifest.slug} first />
                </div>
                <p className="text-stone-400 text-sm mt-1 ml-1">
                  {entry.shortDefinition}
                </p>
                {entry.relatedTermIds && entry.relatedTermIds.length > 0 && (
                  <p className="text-stone-500 text-xs mt-1 ml-1">
                    相关术语: {entry.relatedTermIds.map(id => {
                      const related = registry.getTerm(id);
                      return related ? `${related.zh}(${related.original})` : id;
                    }).join('、')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
