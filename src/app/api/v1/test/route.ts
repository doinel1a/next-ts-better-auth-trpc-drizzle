import { NextResponse } from 'next/server';

import { withAuth } from '@/server/auth/with-auth';

export const GET = withAuth(() => {
  return NextResponse.json({ message: 'You are authed!' }, { status: 200 });
});
