import { cache } from 'react';

import { headers } from 'next/headers';

import { auth } from '.';

export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));
