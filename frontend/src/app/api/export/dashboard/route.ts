import { NextResponse } from 'next/server';
import getBackendUrl from '@/lib/backend-url';
import { buildBackendHeaders } from '@/lib/auth-request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const forwardBundleResponse = async (response: Response) => {
  if (!response.ok) {
    const message = await response.text().catch(() => 'Unable to export dashboard.');
    return NextResponse.json({ error: message || 'Unable to export dashboard.' }, { status: response.status });
  }

  const headers = new Headers();
  const contentType = response.headers.get('content-type');
  const contentDisposition = response.headers.get('content-disposition');
  const bundled = response.headers.get('x-illustry-bundled');

  if (contentType) {
    headers.set('Content-Type', contentType);
  }
  if (contentDisposition) {
    headers.set('Content-Disposition', contentDisposition);
  }
  if (bundled) {
    headers.set('X-Illustry-Bundled', bundled);
  }

  return new Response(response.body, {
    status: response.status,
    headers
  });
};

const POST = async (request: Request) => {
  const BACKEND = getBackendUrl();
  if (!BACKEND) {
    return NextResponse.json({ error: 'Backend URL is not configured' }, { status: 500 });
  }

  const payload = await request.json().catch(() => null);
  const response = await fetch(`${BACKEND}/api/dashboard/export/bundle`, {
    method: 'POST',
    headers: await buildBackendHeaders({ asJson: true, withCsrf: true }),
    body: JSON.stringify(payload),
    cache: 'no-store'
  });

  return forwardBundleResponse(response);
};

export { POST };
