import { Link } from 'react-router-dom';
import type { GlossaryEntry } from '../../atlas-core/types/glossary';
import { Tooltip } from '../primitives';

type TermProps = {
  entry: GlossaryEntry;
  bookSlug: string;
  first?: boolean;
};

export function Term({ entry, bookSlug, first }: TermProps) {
  const displayText = first
    ? entry.firstMentionFormat
    : (entry.abbreviation ?? entry.original);

  const tooltipContent = (
    <span className="flex flex-col gap-1">
      <span className="font-semibold text-page">{entry.zh}</span>
      <span className="text-divider text-[11px]">
        {entry.original}
        {entry.abbreviation ? ` (${entry.abbreviation})` : ''}
      </span>
      <span className="text-divider text-[11px] mt-1 leading-relaxed">
        {entry.shortDefinition}
      </span>
      <Link
        to={`/book/${bookSlug}/glossary#${entry.termId}`}
        className="text-accent-2 text-[11px] hover:underline mt-1"
      >
        查看完整术语 →
      </Link>
    </span>
  );

  return (
    <Tooltip content={tooltipContent}>
      <span className="term" tabIndex={0} role="button">
        {displayText}
      </span>
    </Tooltip>
  );
}
