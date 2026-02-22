import { stripTags } from "./utils";

type ArticleLike = {
  title: string;
  url: string;
};

function normalize(text: string) {
  return stripTags(text)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalize(text)
    .split(" ")
    .filter((token) => token.length > 1);
}

function jaccard(a: Set<string>, b: Set<string>) {
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function dedupeByTitle<T extends ArticleLike>(
  items: T[],
  threshold = 0.82
) {
  const kept: T[] = [];
  const tokenSets: Set<string>[] = [];

  for (const item of items) {
    const tokens = new Set(tokenize(item.title));
    let isDuplicate = false;

    for (let i = 0; i < tokenSets.length; i += 1) {
      const score = jaccard(tokens, tokenSets[i]);
      if (score >= threshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      kept.push(item);
      tokenSets.push(tokens);
    }
  }

  return kept;
}
