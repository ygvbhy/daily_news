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

export async function fetchNaverNews(keyword: string, display = 20) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return [] as NaverArticle[];
  }

  const params = new URLSearchParams({
    query: keyword,
    display: String(display),
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
  return (data.items || []).map((item) => ({
    ...item,
    title: stripTags(item.title),
    description: stripTags(item.description)
  }));
}
