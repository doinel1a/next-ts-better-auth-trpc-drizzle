/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-empty-function */

const noopLogger = {
  error: () => {},
  warn: () => {},
  info: () => {}
};

type TLogContext = 'SERVER' | 'CLIENT';
type TEnvironment = 'development' | 'test' | 'production';

export default function createLogger(context: TLogContext, env: TEnvironment) {
  const isClient = context === 'CLIENT';
  const isProduction = env === 'production';
  if (isClient && isProduction) {
    return noopLogger;
  }

  return {
    error: (message: string, error?: unknown) => {
      console.error(`${context} ERROR | ${message}`, error);
    },
    warn: (message: string, data?: unknown) => {
      console.warn(`${context} WARN | ${message}`, data);
    },
    info: (message: string, data?: unknown) => {
      console.log(`${context} INFO | ${message}`, data);
    }
  };
}
