import { barsFor } from '@/lib/content/market';
import { requireUser } from '@/lib/server/auth';
import { ApiError, handle, ok } from '@/lib/server/http';

export const GET = handle(async (req: Request, { params }: { params: { symbol: string } }) => {
  await requireUser(req);
  const url = new URL(req.url);
  const bars = barsFor(params.symbol.toUpperCase(), url.searchParams.get('from') ?? undefined, url.searchParams.get('to') ?? undefined);
  if (!bars) throw new ApiError(404, 'ASSET_NOT_FOUND', 'Unknown symbol.');
  return ok({ symbol: params.symbol.toUpperCase(), bars });
});
