/**
 * Debug Session Endpoint
 *
 * Development-only summary of the current session. Production returns 404.
 * Token values are never included.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await auth();

  return NextResponse.json(
    {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      user: session?.user,
      error: session?.error,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}
