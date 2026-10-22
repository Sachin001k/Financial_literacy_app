import { ASSETS } from '@/lib/content/market';
import { requireUser } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';

export const GET = handle(async (req: Request) => {
  await requireUser(req);
  return ok({ assets: ASSETS.map(({ mu: _mu, sigma: _sigma, ...a }) => a) });
});

export const dynamic = 'force-dynamic';
