import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { GameRuleError } from '@/lib/game/types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Wraps a route handler so thrown errors become `{ error: { code, message } }`. */
export function handle<Args extends unknown[]>(fn: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.code, err.message);
      if (err instanceof GameRuleError) return fail(400, err.code, err.message);
      if (err instanceof ZodError) return fail(400, 'VALIDATION', err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
      console.error(err);
      return fail(500, 'INTERNAL', 'Something went wrong.');
    }
  };
}
