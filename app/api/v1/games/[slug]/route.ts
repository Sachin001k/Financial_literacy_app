import { getRequestUser } from '@/lib/server/auth';
import { ApiError, handle, ok } from '@/lib/server/http';
import { catalogueFor } from '@/lib/server/catalogue';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request, { params }: { params: { slug: string } }) => {
  const user = await getRequestUser(req);
  const { games } = await catalogueFor(user?.id ?? null);
  const game = games.find((g) => g.slug === params.slug);
  if (!game) throw new ApiError(404, 'GAME_NOT_FOUND', 'Game not found.');
  return ok({ game });
});
