type LarkPayload = {
  title: string;
  text: string;
};

function buildLarkText(title: string, text: string) {
  const maxLength = Number(process.env.LARK_MAX_TEXT_LENGTH || 3500);
  const body = text.length > maxLength ? `${text.slice(0, maxLength)}\n...` : text;
  return `${title}\n\n${body}`;
}

export async function sendLarkMessage(payload: LarkPayload) {
  const webhookUrl = process.env.LARK_WEBHOOK_URL;

  if (!webhookUrl) {
    return { ok: false, reason: "missing_env" } as const;
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      msg_type: "text",
      content: {
        text: buildLarkText(payload.title, payload.text)
      }
    })
  });

  if (!res.ok) {
    return { ok: false, reason: `http_${res.status}` } as const;
  }

  const json = (await res.json().catch(() => null)) as
    | { code?: number; msg?: string }
    | null;

  if (json && typeof json.code === "number" && json.code !== 0) {
    return { ok: false, reason: `lark_${json.code}` } as const;
  }

  return { ok: true } as const;
}
