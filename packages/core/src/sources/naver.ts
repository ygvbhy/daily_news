import { stripTags } from "../utils";

export type NaverArticle = {
  title: string;
  link: string;
  originallink?: string;
  pubDate: string;
  description: string;
};

type NaverResponse = {
  items: NaverArticle[];
};

function toInt(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export async function fetchNaverNews(keyword: string) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return [] as NaverArticle[];
  }

  const pageSize = Math.min(
    100,
    Math.max(10, toInt(process.env.NAVER_PAGE_SIZE, 100))
  );
  const maxFetch = Math.min(
    1000,
    Math.max(pageSize, toInt(process.env.NAVER_MAX_FETCH_PER_KEYWORD, 300))
  );

  const all: NaverArticle[] = [];
  let start = 1;

  while (all.length < maxFetch && start <= 1000) {
    const display = Math.min(pageSize, maxFetch - all.length);
    const params = new URLSearchParams({
      query: keyword,
      display: String(display),
      start: String(start),
      sort: "date"
    });

    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?${params.toString()}`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret
        }
      }
    );

    if (!res.ok) {
      throw new Error(`Naver API error: ${res.status}`);
    }

    const data = (await res.json()) as NaverResponse;
    const items = data.items || [];
    if (items.length === 0) break;

    all.push(
      ...items.map((item) => ({
        ...item,
        title: stripTags(item.title),
        description: stripTags(item.description)
      }))
    );

    if (items.length < display) break;
    start += display;
  }

  return all;
}
