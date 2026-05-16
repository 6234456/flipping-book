import { Link } from 'react-router-dom';
import type { PageManifest } from '../../atlas-core/types/page';

type TOCPageTemplateProps = {
  page: PageManifest;
  locale: string;
  readingOrder?: string[];
  getPage?: (pageId: string) => PageManifest | undefined;
  bookSlug: string;
};

export function TOCPageTemplate({
  page,
  locale,
  readingOrder,
  getPage,
  bookSlug,
}: TOCPageTemplateProps) {
  const items = readingOrder
    ?.map((pageId) => getPage?.(pageId))
    .filter((p): p is PageManifest => p != null);

  return (
    <div className="w-[1000px] min-h-[800px] bg-page text-text p-16">
      <h1 className="text-3xl font-bold font-serif mb-8">
        {page.title?.[locale] ?? '目录'}
      </h1>

      {items && items.length > 0 ? (
        <ol className="space-y-2">
          {items.map((p, i) => (
            <li key={p.pageId} className="flex items-baseline gap-4">
              <span className="text-text-muted text-sm w-8 text-right shrink-0 tabular-nums">
                {p.pageNumber ?? i + 1}
              </span>
              <Link
                to={`/book/${bookSlug}/page/${p.pageId}`}
                className="text-text hover:text-accent hover:underline text-lg"
              >
                {p.title?.[locale] ?? p.pageId}
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-text-2">目录内容将通过 readingOrder 动态生成</p>
      )}
    </div>
  );
}
