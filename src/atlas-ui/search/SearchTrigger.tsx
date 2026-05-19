import { Search as SearchIcon } from 'lucide-react';
import { Icon } from '../primitives';

export type SearchTriggerProps = {
  onClick: () => void;
};

export function SearchTrigger({ onClick }: SearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="搜索(快捷键 ⌘K)"
      className="flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.14] text-divider text-xs rounded-md h-7 px-2.5 transition-colors min-w-[180px] max-md:min-w-0 max-md:w-7 max-md:justify-center"
    >
      <Icon icon={SearchIcon} size={14} className="shrink-0" />
      <span className="flex-1 text-left max-md:hidden">搜索…</span>
      <span className="text-[10px] font-mono bg-white/[0.08] rounded px-1 max-md:hidden">⌘K</span>
    </button>
  );
}
