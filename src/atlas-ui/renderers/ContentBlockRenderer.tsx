import type { ContentBlock } from '../../atlas-core/types/content';
import type { BookRegistry } from '../../atlas-core/registry';
import { RichTextRenderer } from './RichTextRenderer';

type ContentBlockRendererProps = {
  block: ContentBlock;
  registry: BookRegistry;
  bookSlug: string;
};

export function ContentBlockRenderer({ block, registry, bookSlug }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'heading': {
      const Tag = `h${block.level}` as const;
      const sizeClass = {
        1: 'text-3xl font-bold',
        2: 'text-2xl font-semibold',
        3: 'text-xl font-medium',
        4: 'text-lg font-medium',
      }[block.level];
      return (
        <Tag className={`${sizeClass} mt-6 mb-2 text-stone-100`}>
          <RichTextRenderer nodes={block.text} registry={registry} bookSlug={bookSlug} />
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p className="my-2 text-stone-300 leading-relaxed">
          <RichTextRenderer nodes={block.text} registry={registry} bookSlug={bookSlug} />
        </p>
      );

    case 'callout': {
      const variantStyles: Record<string, string> = {
        info: 'border-blue-500 bg-blue-500/10',
        warning: 'border-yellow-500 bg-yellow-500/10',
        risk: 'border-red-500 bg-red-500/10',
        legal: 'border-purple-500 bg-purple-500/10',
        evidence: 'border-green-500 bg-green-500/10',
      };
      return (
        <div className={`border-l-4 p-4 my-3 rounded-r ${variantStyles[block.variant] ?? ''}`}>
          {block.title && (
            <div className="font-semibold text-stone-200 mb-1">
              <RichTextRenderer nodes={block.title} registry={registry} bookSlug={bookSlug} />
            </div>
          )}
          <div className="text-stone-300">
            <RichTextRenderer nodes={block.body} registry={registry} bookSlug={bookSlug} />
          </div>
        </div>
      );
    }

    case 'checklist':
      return (
        <div className="my-3">
          {block.title && (
            <div className="font-semibold text-stone-200 mb-2">
              <RichTextRenderer nodes={block.title} registry={registry} bookSlug={bookSlug} />
            </div>
          )}
          <ul className="space-y-1">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-stone-300">
                <span className="text-stone-400 mt-1">☐</span>
                <span>
                  <RichTextRenderer nodes={item} registry={registry} bookSlug={bookSlug} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      );

    case 'comparisonTable':
      return (
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.columns.map((col) => (
                  <th
                    key={col.columnId}
                    className="border border-stone-600 px-3 py-2 text-left text-stone-200 bg-stone-800"
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <RichTextRenderer nodes={col.header} registry={registry} bookSlug={bookSlug} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.rowId}>
                  {block.columns.map((col) => (
                    <td key={col.columnId} className="border border-stone-600 px-3 py-2 text-stone-300">
                      {row.cells[col.columnId] && (
                        <RichTextRenderer nodes={row.cells[col.columnId]} registry={registry} bookSlug={bookSlug} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'scenarioSummary':
      return (
        <div className="my-3 p-4 bg-stone-800 rounded text-stone-300">
          <span className="text-stone-400 text-xs">场景摘要: {block.scenarioId}</span>
        </div>
      );

    case 'decisionFlow':
      return (
        <div className="my-3 p-4 bg-stone-800 rounded text-stone-300">
          <span className="text-stone-400 text-xs">判断流程: {block.scenarioId}</span>
        </div>
      );

    case 'glossary':
      return (
        <div className="my-3 p-4 bg-stone-800 rounded text-stone-300">
          <span className="text-stone-400 text-xs">术语块: {block.termIds.join(', ')}</span>
        </div>
      );

    case 'imageCaption':
      return (
        <div className="my-1 text-sm text-stone-400 italic">
          <RichTextRenderer nodes={block.caption} registry={registry} bookSlug={bookSlug} />
        </div>
      );

    case 'notesPlaceholder':
      return (
        <div className="my-2 text-xs text-stone-500">
          📝 笔记: {block.noteIds.join(', ')}
        </div>
      );

    default:
      return null;
  }
}
