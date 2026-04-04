import type { Env } from '../../lib/types';
import type { EmailPayload, EmailTemplate } from './types';
import { renderTemplate } from './templates';

const FROM_ADDRESS = 'ChristianMegle <onboarding@resend.dev>';

export async function sendEmail(env: Env, payload: EmailPayload): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[Email] No RESEND_API_KEY set. Would have sent:`);
    console.log(`  To: ${payload.to}`);
    console.log(`  Subject: ${payload.subject}`);
    console.log(`  Body: ${payload.body}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [payload.to],
      subject: payload.subject,
      text: payload.body,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }
}

export async function sendNotification(env: Env, template: EmailTemplate): Promise<void> {
  if (!env.NOTIFICATION_EMAIL) {
    console.warn('[Email] NOTIFICATION_EMAIL not set, skipping notification');
    return;
  }

  const payload = renderTemplate(template);
  payload.to = env.NOTIFICATION_EMAIL;
  await sendEmail(env, payload);
}
