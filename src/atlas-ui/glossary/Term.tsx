import { Tooltip } from './Tooltip';
import type { GlossaryEntry } from '../../atlas-core/types/glossary';
import { Link } from 'react-router-dom';

type TermProps = {
  entry: GlossaryEntry;
  bookSlug: string;
  /** If true, shows firstMentionFormat (zh + original); otherwise shows abbreviation or short form */
  first?: boolean;
};

export function Term({ entry, bookSlug, first }: TermProps) {
  const displayText = first
    ? entry.firstMentionFormat
    : (entry.abbreviation ?? entry.original);

  const tooltipContent = (
    <span className="flex flex-col gap-1">
      <span className="font-semibold">{entry.zh}</span>
      <span className="text-stone-300 text-xs">
        {entry.original}
        {entry.abbreviation ? ` (${entry.abbreviation})` : ''}
      </span>
      <span className="text-stone-400 text-xs mt-1 max-w-48 line-clamp-3">
        {entry.shortDefinition}
      </span>
      <Link
        to={`/book/${bookSlug}/glossary#${entry.termId}`}
        className="text-blue-400 text-xs hover:underline mt-1"
      >
        查看完整术语 →
      </Link>
    </span>
  );

  return (
    <Tooltip content={tooltipContent}>
      <span className="term cursor-help" tabIndex={0} role="button">
        {displayText}
      </span>
    </Tooltip>
  );
}
