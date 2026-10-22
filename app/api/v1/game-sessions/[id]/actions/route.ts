import { z } from 'zod';
import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { GameSessionService } from '@/lib/server/session-service';

const Body = z.object({ turn: z.number().int().min(0), type: z.string().min(1).max(40), payload: z.record(z.unknown()).optional() });

export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser(req);
  rateLimit(`actions:${user.id}`, 60);
  const body = Body.parse(await req.json());
  return ok(await new GameSessionService().act(params.id, user.id, body));
});
