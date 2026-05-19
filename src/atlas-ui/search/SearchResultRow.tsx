import type { IndexedItem, IndexCategory } from '../../atlas-core/search';

const CATEGORY_LABEL: Record<IndexCategory, string> = {
  page: '页面', glossary: '术语', legal: '法条',
  scenario: '场景', note: '笔记', content: '内容',
};

export type SearchResultRowProps = {
  item: IndexedItem;
  query: string;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
};

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-accent-bg text-accent-strong px-0 rounded">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SearchResultRow({ item, query, active, onClick, onMouseEnter }: SearchResultRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={active}
      data-active={active ? 'true' : 'false'}
      className={[
        'w-full flex items-baseline gap-2 px-3 py-1.5 text-sm text-left rounded-md transition-colors',
        active ? 'bg-accent-bg-faint' : 'hover:bg-surface-2',
      ].join(' ')}
    >
      <span className="text-[10px] font-medium text-accent bg-accent-bg px-1.5 py-0.5 rounded-full shrink-0">
        {CATEGORY_LABEL[item.category]}
      </span>
      <span className="text-text truncate">{highlight(item.display.primary, query)}</span>
      {item.display.secondary && (
        <span className="text-text-muted text-xs truncate ml-auto">
          {highlight(item.display.secondary, query)}
        </span>
      )}
    </button>
  );
}
