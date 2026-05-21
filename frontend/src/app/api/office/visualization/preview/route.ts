import { NextResponse } from 'next/server';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';

export const dynamic = 'force-dynamic';

const POST = async (request: Request) => {
  const BACKEND = getBackendUrl();
  if (!BACKEND) {
    return NextResponse.json({ error: 'Backend URL is not configured' }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  const response = await fetch(`${BACKEND}/api/office/visualization/preview`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  const data = await response.json().catch(() => ({ error: 'Unable to parse backend response' }));
  return NextResponse.json(data, { status: response.status });
};

export { POST };
