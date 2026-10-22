import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { homeFor } from '@/lib/server/home';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request) => {
  const user = await requireUser(req);
  return ok(await homeFor(user.id, user.email ?? null));
});
