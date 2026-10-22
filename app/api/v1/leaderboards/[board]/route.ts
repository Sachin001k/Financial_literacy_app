import { getRequestUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { leaderboard } from '@/lib/server/leaderboard';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request, { params }: { params: { board: string } }) => {
  const user = await getRequestUser(req);
  return ok(await leaderboard(params.board, user?.id ?? null));
});
