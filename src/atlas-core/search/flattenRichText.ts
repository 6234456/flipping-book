import type { RichTextNode } from '../types/content';

/**
 * Recursively collect plain text from a RichTextNode tree.
 * Reference nodes (term / legalRef / scenarioLink / pageLink) emit empty
 * string — their target entities are indexed separately.
 */
export function flattenRichText(nodes: RichTextNode[]): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return n.value;
      if (n.type === 'strong' || n.type === 'em') return flattenRichText(n.children);
      return '';
    })
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
