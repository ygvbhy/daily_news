import { Resend } from "resend";

type EmailPayload = {
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  const from = process.env.REPORT_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    return { ok: false, reason: "missing_env" } as const;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text
  });

  return { ok: true } as const;
}
