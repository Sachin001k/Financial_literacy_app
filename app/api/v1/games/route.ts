import { getRequestUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { catalogueFor } from '@/lib/server/catalogue';

export const dynamic = 'force-dynamic';

export const GET = handle(async (req: Request) => {
  const user = await getRequestUser(req);
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const difficulty = url.searchParams.get('difficulty');
  const { games, sections } = await catalogueFor(user?.id ?? null);
  const match = (g: { category: string; difficulty: string }) =>
    (!category || g.category === category) && (!difficulty || g.difficulty === difficulty);
  return ok({ games: games.filter(match), sections: sections.map((s) => ({ ...s, games: s.games.filter(match) })) });
});
