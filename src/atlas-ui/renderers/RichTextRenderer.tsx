import { Link } from 'react-router-dom';
import type { RichTextNode } from '../../atlas-core/types/content';
import type { BookRegistry } from '../../atlas-core/registry';
import { Term } from '../glossary/Term';
import { Fragment } from 'react';

type RichTextRendererProps = {
  nodes: RichTextNode[];
  registry: BookRegistry;
  bookSlug: string;
};

function RichTextNodeRenderer({ node, registry, bookSlug }: {
  node: RichTextNode;
  registry: BookRegistry;
  bookSlug: string;
}) {
  switch (node.type) {
    case 'text':
      return <>{node.value}</>;

    case 'strong':
      return (
        <strong>
          <RichTextChildren nodes={node.children} registry={registry} bookSlug={bookSlug} />
        </strong>
      );

    case 'em':
      return (
        <em>
          <RichTextChildren nodes={node.children} registry={registry} bookSlug={bookSlug} />
        </em>
      );

    case 'term': {
      const entry = registry.getTerm(node.termId);
      if (!entry) return <>{node.termId}</>;
      return <Term entry={entry} bookSlug={bookSlug} first={node.first} />;
    }

    case 'legalRef':
      return (
        <Link
          to={`/book/${bookSlug}/legal/${node.legalRefId}`}
          className="text-blue-400 hover:underline"
        >
          {node.legalRefId}
        </Link>
      );

    case 'scenarioLink':
      return (
        <Link
          to={`/book/${bookSlug}/scenario/${node.scenarioId}`}
          className="text-blue-400 hover:underline"
        >
          {node.label ?? node.scenarioId}
        </Link>
      );

    case 'pageLink': {
      const page = registry.getPage(node.pageId);
      const label = node.label ?? page?.title?.['zh-CN'] ?? node.pageId;
      return (
        <Link
          to={`/book/${bookSlug}/page/${node.pageId}`}
          className="text-blue-400 hover:underline"
        >
          {label}
        </Link>
      );
    }

    default:
      return null;
  }
}

function RichTextChildren({ nodes, registry, bookSlug }: RichTextRendererProps) {
  return (
    <>
      {nodes.map((node, i) => (
        <RichTextNodeRenderer
          key={i}
          node={node}
          registry={registry}
          bookSlug={bookSlug}
        />
      ))}
    </>
  );
}

export function RichTextRenderer({ nodes, registry, bookSlug }: RichTextRendererProps) {
  return <RichTextChildren nodes={nodes} registry={registry} bookSlug={bookSlug} />;
}
