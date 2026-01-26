/**
 * Expands a dot-delimited category into a hierarchical list of topics.
 *
 * @example
 * topics('foo.bar.baz') // ['foo.bar.baz', 'foo.bar', 'foo']
 * topics('startup')     // ['startup']
 * topics('')            // []
 */
export function topics(category: string): string[] {
  if (!category) return [];

  const result: string[] = [];
  const segments = category.split('.');

  while (segments.length) {
    result.push(segments.join('.'));
    segments.pop();
  }

  return result;
}
