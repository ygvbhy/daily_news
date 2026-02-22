import { buildReport, getReportArticles } from "./report";
import { sendEmail } from "./mailer";

export async function runDailyReport() {
  const windowHours = Number(process.env.REPORT_WINDOW_HOURS || 24);
  const maxItems = Number(process.env.REPORT_MAX_ARTICLES || 200);

  const articles = await getReportArticles(windowHours, maxItems);
  const { html, text } = buildReport(articles, {
    total: articles.length,
    windowHours
  });

  const subject = `Daily News Report (${articles.length})`;
  const result = await sendEmail({ subject, html, text });

  return {
    ok: result.ok,
    sent: result.ok,
    reason: result.ok ? null : result.reason,
    count: articles.length
  };
}
