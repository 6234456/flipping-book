import { useEffect, useMemo, useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search as SearchIcon, X } from 'lucide-react';
import type { BookRegistry } from '../../atlas-core/registry';
import { buildIndex, searchIndex } from '../../atlas-core/search';
import type { IndexedItem, IndexCategory, GroupedResults } from '../../atlas-core/search';
import { Icon } from '../primitives';
import { SearchResultRow } from './SearchResultRow';

const CATEGORY_LABEL: Record<IndexCategory, string> = {
  page: '页面', glossary: '术语', legal: '法条',
  scenario: '场景', note: '笔记', content: '内容',
};

export type SearchModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registry: BookRegistry;
  onSelectResult: (item: IndexedItem) => void;
};

function flatten(grouped: GroupedResults): IndexedItem[] {
  return [...grouped.page, ...grouped.glossary, ...grouped.legal,
          ...grouped.scenario, ...grouped.note, ...grouped.content];
}

export function SearchModal({ open, onOpenChange, registry, onSelectResult }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const items = useMemo(() => buildIndex(registry), [registry]);
  const grouped = useMemo(() => searchIndex(items, query), [items, query]);
  const flat = useMemo(() => flatten(grouped), [grouped]);
  const totalIndexed = useMemo(() => {
    return {
      pages: registry.manifest.pages.length,
      terms: registry.glossary.size,
    };
  }, [registry]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setQuery(''); setActiveIdx(0); }
  }, [open]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      if (flat[activeIdx]) {
        onSelectResult(flat[activeIdx]);
        onOpenChange(false);
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-chrome/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[22vh] -translate-x-1/2 z-50 w-[560px] max-w-[90vw] bg-page rounded-lg shadow-2xl border border-border overflow-hidden"
        >
          <Dialog.Title className="sr-only">搜索</Dialog.Title>
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Icon icon={SearchIcon} size={16} className="text-text-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`输入关键词搜索 ${totalIndexed.pages} 页 + ${totalIndexed.terms} 术语…`}
              className="flex-1 text-sm text-text bg-transparent outline-none placeholder:text-text-muted"
              data-testid="search-input"
            />
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-text-muted hover:text-text"
              aria-label="关闭"
            >
              <Icon icon={X} size={14} />
            </button>
          </div>
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
            {flat.length === 0 ? (
              <div className="text-text-muted text-sm text-center py-6">
                {query ? '无匹配结果' : '输入即可开始'}
              </div>
            ) : (
              (Object.keys(grouped) as IndexCategory[]).map((cat) => {
                const list = grouped[cat];
                if (list.length === 0) return null;
                return (
                  <div key={cat} role="group" aria-label={CATEGORY_LABEL[cat]} className="px-1 py-1">
                    <div className="text-[10px] uppercase text-text-muted font-medium px-2 py-1 tracking-wider">
                      {CATEGORY_LABEL[cat]} ({list.length})
                    </div>
                    {list.map((item) => {
                      const flatIdx = flat.indexOf(item);
                      return (
                        <SearchResultRow
                          key={`${item.category}-${item.id}`}
                          item={item}
                          query={query}
                          active={flatIdx === activeIdx}
                          onClick={() => { onSelectResult(item); onOpenChange(false); }}
                          onMouseEnter={() => setActiveIdx(flatIdx)}
                        />
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
