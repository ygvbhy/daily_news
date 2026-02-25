import { buildReport, getReportArticles } from "./report";
import { sendEmail } from "./mailer";
import { sendLarkMessage } from "./lark";

async function loadReportPayload() {
  const windowHours = Number(process.env.REPORT_WINDOW_HOURS || 24);
  const maxItems = Number(process.env.REPORT_MAX_ARTICLES || 200);

  const articles = await getReportArticles(windowHours, maxItems);
  const { html, text } = buildReport(articles, {
    total: articles.length,
    windowHours
  });

  const subject = `Daily News Report (${articles.length})`;
  return {
    subject,
    html,
    text,
    count: articles.length
  };
}

export async function runDailyEmailReport() {
  const payload = await loadReportPayload();
  const email = await sendEmail({
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  });

  return {
    ok: email.ok,
    sent: email.ok,
    reason: email.ok ? null : email.reason,
    count: payload.count
  };
}

export async function runDailyLarkReport() {
  const payload = await loadReportPayload();
  const lark = await sendLarkMessage({
    title: payload.subject,
    text: payload.text
  });

  return {
    ok: lark.ok,
    sent: lark.ok,
    reason: lark.ok ? null : lark.reason,
    count: payload.count
  };
}

export async function runDailyReport() {
  const payload = await loadReportPayload();
  const email = await sendEmail({
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  });
  const lark = process.env.LARK_WEBHOOK_URL
    ? await sendLarkMessage({ title: payload.subject, text: payload.text })
    : null;

  return {
    ok: email.ok,
    sent: email.ok,
    reason: email.ok ? null : email.reason,
    larkSent: lark?.ok ?? false,
    larkReason: lark && !lark.ok ? lark.reason : null,
    count: payload.count
  };
}
