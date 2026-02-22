export function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, "\"").trim();
}

export function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const k = key(item);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    result.push(item);
  }
  return result;
}
