import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';
import { GameSessionService } from '@/lib/server/session-service';

export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser(req);
  rateLimit(`finish:${user.id}`, 20);
  return ok(await new GameSessionService().finish(params.id, user.id));
});
