import { z } from 'zod';
import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { GameSessionService } from '@/lib/server/session-service';

const Body = z.object({ daily: z.boolean().optional(), fresh: z.boolean().optional() }).default({});

/** Start (or resume the active) session → { sessionId, state, availableActions }. */
export const POST = handle(async (req: Request, { params }: { params: { slug: string } }) => {
  const user = await requireUser(req);
  rateLimit(`start:${user.id}`, 20);
  const text = await req.text();
  const body = Body.parse(text ? JSON.parse(text) : {});
  return ok(await new GameSessionService().start(user.id, params.slug, body));
});
