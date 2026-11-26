import { NextRequest } from 'next/server';
import { attempt } from '../../../lib/server/attempt';
import { body, failure, gate, json, owner } from '../../../lib/server/http';

export const runtime = 'nodejs';
async function handle(request: NextRequest, action: Parameters<typeof attempt>[1]) {
  try {
    gate(request);
    const data = action === 'finish' || action === 'save' ? await body(request) : {};
    return json(attempt(owner(request), action, data));
  } catch (error) { return failure(error); }
}
export const GET = (r: NextRequest) => handle(r, 'read');
export const PUT = (r: NextRequest) => handle(r, 'start');
export const PATCH = (r: NextRequest) => handle(r, 'save');
export const POST = (r: NextRequest) => handle(r, 'finish');
