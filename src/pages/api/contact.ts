export const prerender = false;

import type { APIRoute } from "astro";
import { Resend } from "resend";
import { CONTACT_LIMITS } from "../../lib/contact-limits";

interface ContactPayload {
  firstName: string;
  lastName: string;
  company?: string;
  email: string;
  country: string;
  phone: string;
  subject?: string;
  destination: "sales" | "support" | "admin";
  message: string;
  turnstileToken: string;
}

const DESTINATION_MAP: Record<string, string> = {
  sales: "sales@forestal-mt.com",
  support: "support@forestal-mt.com",
  admin: "admin@forestal-mt.com",
};

const DESTINATION_LABELS: Record<string, string> = {
  sales: "Sales / Wholesale Inquiries",
  support: "Customer Support",
  admin: "General / Administration",
};

const FIELD_LIMITS = {
  ...CONTACT_LIMITS,
  phone: CONTACT_LIMITS.phoneFull,
};

// RFC 5322 simplified — catches obvious invalid emails missed by includes("@")
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function verifyTurnstile(token: string, secretKey: string, ip?: string): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const form = new FormData();
  form.append("secret", secretKey);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

function buildEmailHtml(data: ContactPayload): string {
  const destinationLabel = DESTINATION_LABELS[data.destination] ?? data.destination;
  const rows: [string, string][] = [
    ["Name", `${data.firstName} ${data.lastName}`],
    ["Company", data.company || "—"],
    ["Email", data.email],
    ["Country", data.country],
    ["Phone", data.phone || "—"],
    ["Subject", data.subject || "—"],
    ["Department", destinationLabel],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 16px;background:#f5f5f5;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#666;white-space:nowrap;border-bottom:1px solid #e5e5e5;">${label}</td>
        <td style="padding:8px 16px;font-size:14px;color:#333;border-bottom:1px solid #e5e5e5;">${value}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e5e5;border-radius:4px;overflow:hidden;max-width:600px;width:100%;">
        <tr>
          <td style="background:#206D03;padding:24px 32px;">
            <p style="margin:0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.7);">Forestal MT</p>
            <h1 style="margin:4px 0 0;font-size:20px;color:#fff;font-weight:600;">New Contact Form Submission</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${tableRows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#666;">Message</p>
            <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:4px;padding:16px;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap;">${data.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #e5e5e5;">
            <p style="margin:0;font-size:11px;color:#999;">Sent via forestal-mt.com contact form · ${new Date().toUTCString()}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function validatePayload(body: unknown): ContactPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  if (
    typeof b.firstName !== "string" ||
    !b.firstName.trim() ||
    b.firstName.trim().length > FIELD_LIMITS.firstName ||
    typeof b.lastName !== "string" ||
    !b.lastName.trim() ||
    b.lastName.trim().length > FIELD_LIMITS.lastName ||
    typeof b.email !== "string" ||
    !EMAIL_REGEX.test(b.email.trim()) ||
    b.email.trim().length > FIELD_LIMITS.email ||
    typeof b.country !== "string" ||
    !b.country.trim() ||
    b.country.trim().length > FIELD_LIMITS.country ||
    typeof b.phone !== "string" ||
    !b.phone.trim() ||
    b.phone.trim().length > FIELD_LIMITS.phone ||
    typeof b.destination !== "string" ||
    !DESTINATION_MAP[b.destination] ||
    typeof b.message !== "string" ||
    !b.message.trim() ||
    b.message.trim().length > FIELD_LIMITS.message ||
    typeof b.turnstileToken !== "string" ||
    !b.turnstileToken
  ) {
    return null;
  }

  const company =
    typeof b.company === "string" && b.company.trim().length <= FIELD_LIMITS.company
      ? b.company.trim()
      : undefined;

  const subject =
    typeof b.subject === "string" && b.subject.trim().length <= FIELD_LIMITS.subject
      ? b.subject.trim()
      : undefined;

  return {
    firstName: b.firstName.trim(),
    lastName: b.lastName.trim(),
    company,
    email: b.email.trim(),
    country: b.country.trim(),
    phone: b.phone.trim(),
    subject,
    destination: b.destination as ContactPayload["destination"],
    message: b.message.trim(),
    turnstileToken: b.turnstileToken,
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid request body." }, 400);
  }

  const data = validatePayload(body);
  if (!data) {
    return json({ success: false, error: "Missing or invalid required fields." }, 422);
  }

  // Turnstile verification — first gate, before any downstream calls
  const turnstileSecret =
    (locals as { runtime?: { env?: { TURNSTILE_SECRET_KEY?: string } } }).runtime?.env
      ?.TURNSTILE_SECRET_KEY ?? import.meta.env.TURNSTILE_SECRET_KEY;

  if (!turnstileSecret) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    return json({ success: false, error: "Service configuration error." }, 500);
  }

  const remoteIp = request.headers.get("CF-Connecting-IP") ?? undefined;
  const turnstileOk = await verifyTurnstile(data.turnstileToken, turnstileSecret, remoteIp);
  if (!turnstileOk) {
    return json({ success: false, error: "Security verification failed. Please try again." }, 403);
  }

  const apiKey =
    (locals as { runtime?: { env?: { RESEND_API_KEY?: string } } }).runtime?.env?.RESEND_API_KEY ??
    import.meta.env.RESEND_API_KEY;

  if (!apiKey) {
    return json({ success: false, error: "Service configuration error." }, 500);
  }

  const resend = new Resend(apiKey);
  const toAddress = DESTINATION_MAP[data.destination];
  const subjectLine = data.subject
    ? `[${data.destination.toUpperCase()}] ${data.subject}`
    : `[${data.destination.toUpperCase()}] New inquiry from ${data.firstName} ${data.lastName}`;

  const { error } = await resend.emails.send({
    from: `Forestal MT <${toAddress}>`,
    to: [toAddress],
    replyTo: data.email,
    subject: subjectLine,
    html: buildEmailHtml(data),
  });

  if (error) {
    console.error("Resend error:", error);
    return json({ success: false, error: "Failed to send message. Please try again." }, 502);
  }

  return json({ success: true });
};
