import type { Env } from './types';

export async function sendEmailNotification(
  env: Env,
  { to, subject, body }: { to: string; subject: string; body: string }
): Promise<void> {
  if (env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChristianMegle <noreply@christianmegle.com>',
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email send failed: ${response.status}`);
    }
  } else {
    console.log(`[Email Notification] To: ${to}, Subject: ${subject}\n${body}`);
  }
}
