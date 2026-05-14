import type { PageManifest } from '../../atlas-core/types/page';

type TOCPageTemplateProps = {
  page: PageManifest;
  locale: string;
};

export function TOCPageTemplate({ page, locale }: TOCPageTemplateProps) {
  return (
    <div className="w-[1000px] min-h-[800px] bg-stone-900 text-stone-200 p-16">
      <h1 className="text-3xl font-bold mb-8">
        {page.title?.[locale] ?? '目录'}
      </h1>
      <p className="text-stone-400">目录内容将通过 readingOrder 动态生成</p>
    </div>
  );
}
