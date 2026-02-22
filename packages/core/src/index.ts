import { prisma } from "@daily-news/db";
import { dedupeByTitle } from "./dedupe";
import { fetchGoogleNews } from "./sources/google";
import { fetchNaverNews } from "./sources/naver";
import { uniqueBy } from "./utils";

export type CrawlResult = {
  newArticles: number;
  scannedKeywords: number;
  perKeyword: Array<{
    term: string;
    fetched: number;
    inserted: number;
    deduped: number;
  }>;
};

type ArticleInput = {
  title: string;
  source: "naver" | "google";
  publishedAt: Date;
  url: string;
  keywordId: string | null;
};

function parseDate(value: string | Date | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function runDailyCrawl(): Promise<CrawlResult> {
  const keywords = await prisma.keyword.findMany({
    where: { active: true }
  });

  const perKeyword: CrawlResult["perKeyword"] = [];
  let totalNew = 0;

  for (const keyword of keywords) {
    const [naverItems, googleItems] = await Promise.all([
      fetchNaverNews(keyword.term).catch(() => []),
      fetchGoogleNews(keyword.term).catch(() => [])
    ]);

    const naverArticles: ArticleInput[] = naverItems
      .map((item) => {
        const publishedAt = parseDate(item.pubDate);
        const url = item.originallink || item.link;
        if (!publishedAt || !url) return null;
        return {
          title: item.title,
          source: "naver",
          publishedAt,
          url,
          keywordId: keyword.id
        };
      })
      .filter(Boolean) as ArticleInput[];

    const googleArticles: ArticleInput[] = googleItems
      .map((item) => {
        const publishedAt = parseDate(item.pubDate);
        if (!publishedAt || !item.link) return null;
        return {
          title: item.title,
          source: "google",
          publishedAt,
          url: item.link,
          keywordId: keyword.id
        };
      })
      .filter(Boolean) as ArticleInput[];

    const uniqueByUrl = uniqueBy(
      [...naverArticles, ...googleArticles],
      (item) => item.url
    );

    const threshold = Number(process.env.DEDUPE_TITLE_THRESHOLD || 0.82);
    const deduped = dedupeByTitle(uniqueByUrl, threshold);

    if (deduped.length === 0) {
      perKeyword.push({
        term: keyword.term,
        fetched: uniqueByUrl.length,
        inserted: 0,
        deduped: 0
      });
      continue;
    }

    const result = await prisma.article.createMany({
      data: deduped,
      skipDuplicates: true
    });

    totalNew += result.count;
    perKeyword.push({
      term: keyword.term,
      fetched: uniqueByUrl.length,
      inserted: result.count,
      deduped: deduped.length
    });
  }

  return {
    newArticles: totalNew,
    scannedKeywords: keywords.length,
    perKeyword
  };
}

export { runDailyReport } from "./reportRunner";
