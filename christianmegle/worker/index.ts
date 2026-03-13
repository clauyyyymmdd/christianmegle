import { Matchmaker } from './matchmaker';
import { SignalingRoom } from './signaling';

export { SignalingRoom, Matchmaker };

interface Env {
  SIGNALING: DurableObjectNamespace;
  MATCHMAKER: DurableObjectNamespace;
  DB: D1Database;
  ADMIN_SECRET: string;
  TURN_SERVER_URL: string;
  TURN_USERNAME: string;
  TURN_CREDENTIAL: string;
  NOTIFICATION_EMAIL: string;
  RESEND_API_KEY?: string;
}

// Email notification using Resend API (or fallback to console log)
async function sendEmailNotification(
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
    // Fallback: just log if no email service configured
    console.log(`[Email Notification] To: ${to}, Subject: ${subject}\n${body}`);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // === WebSocket connection for video chat ===
      if (path === '/ws') {
        // Route to matchmaker, which handles waiting + pairing
        const matchmakerId = env.MATCHMAKER.idFromName('global');
        const matchmaker = env.MATCHMAKER.get(matchmakerId);
        return matchmaker.fetch(request);
      }

      // === Quiz endpoints ===
      if (path === '/api/quiz' && request.method === 'GET') {
        // Return random selection of questions (without answers)
        const questions = await env.DB.prepare(
          `SELECT id, question, option_a, option_b, option_c, option_d, category, difficulty 
           FROM quiz_questions ORDER BY RANDOM() LIMIT 10`
        ).all();

        const formatted = questions.results.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: { a: q.option_a, b: q.option_b, c: q.option_c, d: q.option_d },
          category: q.category,
          difficulty: q.difficulty,
        }));

        return Response.json(formatted, { headers: corsHeaders });
      }

      if (path === '/api/quiz/submit' && request.method === 'POST') {
        const body: { answers: Record<string, string>; displayName: string; email?: string; heavenResponse?: string } =
          await request.json();

        // Grade the quiz
        const questionIds = Object.keys(body.answers);
        if (questionIds.length === 0) {
          return Response.json({ error: 'No answers provided' }, { status: 400, headers: corsHeaders });
        }

        const placeholders = questionIds.map(() => '?').join(',');
        const questions = await env.DB.prepare(
          `SELECT id, correct_option FROM quiz_questions WHERE id IN (${placeholders})`
        )
          .bind(...questionIds.map(Number))
          .all();

        let score = 0;
        const corrections: Record<string, { yours: string; correct: string }> = {};

        questions.results.forEach((q: any) => {
          const userAnswer = body.answers[String(q.id)];
          if (userAnswer === q.correct_option) {
            score++;
          } else {
            corrections[String(q.id)] = { yours: userAnswer, correct: q.correct_option };
          }
        });

        const total = questions.results.length;
        const passed = score >= Math.ceil(total * 0.6); // 60% to pass

        // Create priest application
        const priestId = crypto.randomUUID().slice(0, 16);
        await env.DB.prepare(
          `INSERT INTO priests (id, display_name, email, quiz_score, quiz_total, status, heaven_response)
           VALUES (?, ?, ?, ?, ?, 'pending', ?)`
        )
          .bind(priestId, body.displayName, body.email || null, score, total, body.heavenResponse || null)
          .run();

        // Send email notification with heaven response
        if (body.heavenResponse && env.NOTIFICATION_EMAIL) {
          try {
            await sendEmailNotification(env, {
              to: env.NOTIFICATION_EMAIL,
              subject: `Priest Application: ${body.displayName}`,
              body: `New priest application received.\n\nName: ${body.displayName}\nQuiz Score: ${score}/${total}\nPassed: ${passed ? 'Yes' : 'No'}\n\n"Will you go to heaven? Why?"\n${body.heavenResponse}`,
            });
          } catch (e) {
            console.error('Failed to send email notification:', e);
          }
        }

        return Response.json(
          {
            priestId,
            score,
            total,
            passed,
            corrections,
            message: passed
              ? 'You have demonstrated sufficient knowledge. Your application is pending approval.'
              : 'You have not demonstrated sufficient knowledge of scripture. You may retake the quiz.',
          },
          { headers: corsHeaders }
        );
      }

      // === Priest status check ===
      if (path.startsWith('/api/priest/') && request.method === 'GET') {
        const priestId = path.split('/').pop();
        const priest = await env.DB.prepare('SELECT * FROM priests WHERE id = ?').bind(priestId).first() as any;

        if (!priest) {
          return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
        }

        // Auto-approve priests who passed the quiz after 1 minute
        if (priest.status === 'pending') {
          const createdAt = new Date(priest.created_at).getTime();
          const now = Date.now();
          const oneMinute = 60 * 1000;

          // Check if they passed (60% threshold) and 1 minute has elapsed
          const passed = priest.quiz_score >= Math.ceil(priest.quiz_total * 0.6);

          if (passed && (now - createdAt) >= oneMinute) {
            // Auto-approve
            await env.DB.prepare(
              `UPDATE priests SET status = 'approved', approved_at = datetime('now'), notes = 'Auto-approved after 1 minute' WHERE id = ?`
            ).bind(priestId).run();

            return Response.json(
              { id: priest.id, displayName: priest.display_name, status: 'approved' },
              { headers: corsHeaders }
            );
          }
        }

        return Response.json(
          { id: priest.id, displayName: priest.display_name, status: priest.status },
          { headers: corsHeaders }
        );
      }

      // === Admin endpoints (protected) ===
      if (path.startsWith('/api/admin')) {
        const auth = request.headers.get('Authorization');
        if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
          return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        // List pending applications
        if (path === '/api/admin/priests' && request.method === 'GET') {
          const status = url.searchParams.get('status') || 'pending';
          const priests = await env.DB.prepare(
            'SELECT * FROM priests WHERE status = ? ORDER BY created_at DESC'
          )
            .bind(status)
            .all();
          return Response.json(priests.results, { headers: corsHeaders });
        }

        // Approve or reject
        if (path.match(/\/api\/admin\/priests\/[^/]+\/(approve|reject)/) && request.method === 'POST') {
          const parts = path.split('/');
          const priestId = parts[parts.length - 2];
          const action = parts[parts.length - 1]; // approve or reject
          const bodyData: { notes?: string } = await request.json().catch(() => ({}));

          await env.DB.prepare(
            `UPDATE priests SET status = ?, approved_at = datetime('now'), notes = ? WHERE id = ?`
          )
            .bind(action === 'approve' ? 'approved' : 'rejected', bodyData.notes || null, priestId)
            .run();

          return Response.json({ success: true, action }, { headers: corsHeaders });
        }
      }

      // === ICE server config (returns TURN credentials) ===
      if (path === '/api/ice-config' && request.method === 'GET') {
        const config = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ] as any[],
        };

        if (env.TURN_SERVER_URL) {
          config.iceServers.push({
            urls: env.TURN_SERVER_URL,
            username: env.TURN_USERNAME,
            credential: env.TURN_CREDENTIAL,
          });
        }

        return Response.json(config, { headers: corsHeaders });
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (e) {
      console.error('Worker error:', e);
      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
