import { prisma } from "@daily-news/db";
import { getRiskTerms } from "./risk";

type ReportArticle = {
  title: string;
  source: string;
  publishedAt: Date;
  url: string;
  keyword?: string | null;
};

type ReportSummary = {
  total: number;
  windowHours: number;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function groupByKeyword(articles: ReportArticle[]) {
  const map = new Map<string, ReportArticle[]>();
  for (const article of articles) {
    const key = article.keyword || "기타";
    const list = map.get(key) || [];
    list.push(article);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
}

function detectRisk(article: ReportArticle) {
  const text = `${article.title} ${article.keyword ?? ""}`.toLowerCase();
  const terms = getRiskTerms();
  const hits = terms.filter((term) => text.includes(term.toLowerCase()));
  return hits.length > 0 ? hits : null;
}

export async function getReportArticles(windowHours: number, maxItems: number) {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      createdAt: {
        gte: since
      }
    },
    include: {
      keyword: true
    },
    orderBy: {
      publishedAt: "desc"
    },
    take: maxItems
  });

  return articles.map((article) => ({
    title: article.title,
    source: article.source,
    publishedAt: article.publishedAt,
    url: article.url,
    keyword: article.keyword?.term
  } satisfies ReportArticle));
}

export function buildReport(articles: ReportArticle[], summary: ReportSummary) {
  const headline = `Daily News Report (${summary.windowHours}h)`;
  const intro = `총 ${summary.total}건`;

  const groups = groupByKeyword(articles);

  const riskRows = articles
    .map((article) => ({
      article,
      hits: detectRisk(article)
    }))
    .filter((item) => item.hits);

  const riskHtml = riskRows.length
    ? `
      <section style="margin:16px 0;padding:12px;border:1px solid #fecaca;background:#fff1f2;border-radius:12px;">
        <h3 style="margin:0 0 8px 0;color:#9f1239;">리스크 기사 감지</h3>
        ${riskRows
          .map(({ article, hits }) => {
            const keyword = article.keyword ? ` · ${escapeHtml(article.keyword)}` : "";
            return `
              <div style="margin-bottom:10px;">
                <a href="${escapeHtml(article.url)}" style="color:#0f172a;text-decoration:none;">
                  ${escapeHtml(article.title)}
                </a>
                <div style="color:#64748b;font-size:12px;margin-top:4px;">
                  ${escapeHtml(article.source)}${keyword} · ${escapeHtml(formatDate(
                    article.publishedAt
                  ))}
                </div>
                <div style="font-size:12px;color:#be123c;">키워드: ${hits
                  ?.map(escapeHtml)
                  .join(", ")}</div>
              </div>
            `;
          })
          .join("")}
      </section>
    `
    : "";

  const groupsHtml = groups
    .map(([keyword, list]) => {
      const rows = list
        .map((article) => {
          return `
            <tr>
              <td style="padding:8px 0;">
                <a href="${escapeHtml(article.url)}" style="color:#0f172a;text-decoration:none;">
                  ${escapeHtml(article.title)}
                </a>
                <div style="color:#64748b;font-size:12px;margin-top:4px;">
                  ${escapeHtml(article.source)} · ${escapeHtml(formatDate(
                    article.publishedAt
                  ))}
                </div>
              </td>
            </tr>
          `;
        })
        .join("");

      return `
        <section style="margin:16px 0;">
          <h3 style="margin:0 0 8px 0;color:#0f172a;">${escapeHtml(
            keyword
          )} (${list.length})</h3>
          <table style="width:100%;border-collapse:collapse;">${rows}</table>
        </section>
      `;
    })
    .join("");

  const text = [
    headline,
    intro,
    "",
    riskRows.length ? "[리스크 기사]" : "",
    ...riskRows.map(({ article, hits }) => {
      const keyword = article.keyword ? ` / ${article.keyword}` : "";
      return `- ${article.title} (${article.source}${keyword}) ${formatDate(
        article.publishedAt
      )}\n  ${article.url}\n  키워드: ${hits?.join(", ")}`;
    }),
    "",
    ...groups.flatMap(([keyword, list]) => [
      `[${keyword}] (${list.length})`,
      ...list.map((article) => {
        return `- ${article.title} (${article.source}) ${formatDate(
          article.publishedAt
        )}\n  ${article.url}`;
      }),
      ""
    ])
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#0f172a;">
      <h2 style="margin:0 0 8px 0;">${headline}</h2>
      <p style="margin:0 0 16px 0;color:#475569;">${intro}</p>
      ${riskHtml}
      ${groupsHtml}
    </div>
  `;

  return { html, text };
}
