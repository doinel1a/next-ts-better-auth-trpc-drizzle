import 'server-only';

import { env } from '@/env';

import createLogger from '.';

export const serverLogger = createLogger('SERVER', env.NODE_ENV);

export default serverLogger;
