import { parseRss } from "../rss";

export async function fetchGoogleNews(keyword: string, display = 20) {
  const hl = process.env.GOOGLE_NEWS_HL || "ko";
  const gl = process.env.GOOGLE_NEWS_GL || "KR";
  const ceid = process.env.GOOGLE_NEWS_CEID || "KR:ko";

  const params = new URLSearchParams({
    q: keyword,
    hl,
    gl,
    ceid
  });

  const url = `https://news.google.com/rss/search?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "DailyNewsCrawler/1.0"
    }
  });

  if (!res.ok) {
    throw new Error(`Google News RSS error: ${res.status}`);
  }

  const xml = await res.text();
  const items = parseRss(xml, "google");

  return items.slice(0, display).map((item) => ({
    title: item.title,
    link: item.link,
    pubDate: item.pubDate
  }));
}
