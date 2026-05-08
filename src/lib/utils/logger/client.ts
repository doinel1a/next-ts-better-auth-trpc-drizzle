'use client';

import { env } from '@/env';

import createLogger from '.';

const clientLogger = createLogger('CLIENT', env.NEXT_PUBLIC_NODE_ENV);

export default clientLogger;
