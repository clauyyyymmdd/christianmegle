import { Matchmaker } from './matchmaker';
import { SignalingRoom } from './signaling';
import { Router } from './lib/router';
import { corsHeaders } from './lib/types';
import type { Env } from './lib/types';

import { getQuiz } from './features/quiz/getQuiz';
import { submitQuiz } from './features/quiz/submitQuiz';
import { getPriestStatus } from './features/priests/getPriestStatus';
import { listPriests } from './features/admin/listPriests';
import { updatePriestStatus } from './features/admin/updatePriestStatus';
import { getLeaderboard } from './features/leaderboard/getLeaderboard';
import { handleWebSocket } from './features/matchmaking/handler';
import { getIceConfig } from './features/ice/getIceConfig';
import { reportBug } from './features/email/reportBug';

export { SignalingRoom, Matchmaker };

const router = new Router();

router.all('/ws', handleWebSocket);
router.get('/api/quiz', getQuiz);
router.post('/api/quiz/submit', submitQuiz);
router.get('/api/priest/:id', getPriestStatus);
router.get('/api/admin/priests', listPriests);
router.post('/api/admin/priests/:id/:action', updatePriestStatus);
router.get('/api/leaderboard', getLeaderboard);
router.get('/api/ice-config', getIceConfig);
router.post('/api/report-bug', reportBug);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await router.handle(request, env);
    } catch (error) {
      console.error('Worker error', {
        method: request.method,
        url: request.url,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return Response.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders(request, env) }
      );
    }
  },
};
