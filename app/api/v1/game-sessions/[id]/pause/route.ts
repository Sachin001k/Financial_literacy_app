import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { GameSessionService } from '@/lib/server/session-service';

export const POST = handle(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await requireUser(req);
  return ok(await new GameSessionService().pause(params.id, user.id));
});
