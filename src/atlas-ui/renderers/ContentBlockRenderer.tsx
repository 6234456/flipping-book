import { Square, FileText } from 'lucide-react';
import type { ContentBlock } from '../../atlas-core/types/content';
import type { BookRegistry } from '../../atlas-core/registry';
import { RichTextRenderer } from './RichTextRenderer';
import { Callout, Icon } from '../primitives';

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
        1: 'text-3xl font-bold font-serif',
        2: 'text-2xl font-semibold font-serif',
        3: 'text-xl font-semibold',
        4: 'text-lg font-medium',
      }[block.level];
      return (
        <Tag className={`${sizeClass} mt-6 mb-2 text-text`}>
          <RichTextRenderer nodes={block.text} registry={registry} bookSlug={bookSlug} />
        </Tag>
      );
    }

    case 'paragraph':
      return (
        <p className="my-2 text-text-2 leading-relaxed">
          <RichTextRenderer nodes={block.text} registry={registry} bookSlug={bookSlug} />
        </p>
      );

    case 'callout':
      return (
        <Callout
          variant={block.variant as 'info' | 'warning' | 'risk' | 'legal' | 'evidence'}
          title={
            block.title ? (
              <RichTextRenderer nodes={block.title} registry={registry} bookSlug={bookSlug} />
            ) : undefined
          }
        >
          <RichTextRenderer nodes={block.body} registry={registry} bookSlug={bookSlug} />
        </Callout>
      );

    case 'checklist':
      return (
        <div className="my-3">
          {block.title && (
            <div className="font-semibold text-text mb-2">
              <RichTextRenderer nodes={block.title} registry={registry} bookSlug={bookSlug} />
            </div>
          )}
          <ul className="space-y-1">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-text-2">
                <span className="text-text-muted mt-1"><Icon icon={Square} size={14} /></span>
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
                    className="border border-border px-3 py-2 text-left text-text bg-surface-2"
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
                    <td key={col.columnId} className="border border-border px-3 py-2 text-text-2">
                      {row.cells[col.columnId] && (
                        <RichTextRenderer
                          nodes={row.cells[col.columnId]}
                          registry={registry}
                          bookSlug={bookSlug}
                        />
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
        <div className="my-3 p-4 bg-surface-2 rounded-md text-text-2 border border-border">
          <span className="text-text-muted text-xs">场景摘要: {block.scenarioId}</span>
        </div>
      );

    case 'decisionFlow':
      return (
        <div className="my-3 p-4 bg-surface-2 rounded-md text-text-2 border border-border">
          <span className="text-text-muted text-xs">判断流程: {block.scenarioId}</span>
        </div>
      );

    case 'glossary':
      return (
        <div className="my-3 p-4 bg-surface-2 rounded-md text-text-2 border border-border">
          <span className="text-text-muted text-xs">术语块: {block.termIds.join(', ')}</span>
        </div>
      );

    case 'imageCaption':
      return (
        <div className="my-1 text-sm text-text-2 italic">
          <RichTextRenderer nodes={block.caption} registry={registry} bookSlug={bookSlug} />
        </div>
      );

    case 'notesPlaceholder':
      return (
        <div className="my-2 text-xs text-text-muted flex items-center gap-1.5">
          <Icon icon={FileText} size={12} />
          笔记: {block.noteIds.join(', ')}
        </div>
      );

    default:
      return null;
  }
}
