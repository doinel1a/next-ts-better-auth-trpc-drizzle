import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import createLogger from '@/lib/utils/logger';

// `console` is the logger's only output, so it is the one boundary replaced in these tests
const consoleError = vi.spyOn(console, 'error').mockReturnValue(undefined);
const consoleWarn = vi.spyOn(console, 'warn').mockReturnValue(undefined);
const consoleLog = vi.spyOn(console, 'log').mockReturnValue(undefined);

beforeEach(() => {
  consoleError.mockClear();
  consoleWarn.mockClear();
  consoleLog.mockClear();
});

afterAll(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
  consoleLog.mockRestore();
});

describe('createLogger', () => {
  describe('output format', () => {
    it.each([
      ['SERVER', 'SERVER ERROR | Query failed'],
      ['CLIENT', 'CLIENT ERROR | Query failed']
    ] as const)('error on %s writes to console.error with the context prefix', (context, line) => {
      createLogger(context, 'development').error('Query failed');

      expect(consoleError).toHaveBeenCalledExactlyOnceWith(line);
    });

    it.each([
      ['SERVER', 'SERVER WARN | Slow query'],
      ['CLIENT', 'CLIENT WARN | Slow query']
    ] as const)('warn on %s writes to console.warn with the context prefix', (context, line) => {
      createLogger(context, 'development').warn('Slow query');

      expect(consoleWarn).toHaveBeenCalledExactlyOnceWith(line);
    });

    it.each([
      ['SERVER', 'SERVER INFO | Started'],
      ['CLIENT', 'CLIENT INFO | Started']
    ] as const)('info on %s writes to console.log with the context prefix', (context, line) => {
      createLogger(context, 'development').info('Started');

      expect(consoleLog).toHaveBeenCalledExactlyOnceWith(line);
    });
  });

  describe('extra arguments', () => {
    it('passes the error to console.error untouched', () => {
      const error = new Error('boom');

      createLogger('SERVER', 'development').error('Sign in', error);

      expect(consoleError).toHaveBeenCalledExactlyOnceWith('SERVER ERROR | Sign in', error);
    });

    it('passes every extra argument to console.warn in order', () => {
      createLogger('SERVER', 'development').warn('Retrying', { attempt: 2 }, 'timeout');

      expect(consoleWarn).toHaveBeenCalledExactlyOnceWith(
        'SERVER WARN | Retrying',
        { attempt: 2 },
        'timeout'
      );
    });

    it('passes every extra argument to console.log in order', () => {
      createLogger('CLIENT', 'development').info('Loaded', 1, null, ['a']);

      expect(consoleLog).toHaveBeenCalledExactlyOnceWith('CLIENT INFO | Loaded', 1, null, ['a']);
    });
  });

  describe('where each level writes', () => {
    it('error writes only to console.error', () => {
      createLogger('SERVER', 'development').error('x');

      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it('warn writes only to console.warn', () => {
      createLogger('SERVER', 'development').warn('x');

      expect(consoleError).not.toHaveBeenCalled();
      expect(consoleLog).not.toHaveBeenCalled();
    });

    it('info writes only to console.log', () => {
      createLogger('SERVER', 'development').info('x');

      expect(consoleError).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
    });
  });

  describe('which contexts and environments log', () => {
    it.each([
      ['SERVER', 'development'],
      ['SERVER', 'test'],
      ['SERVER', 'production'],
      ['CLIENT', 'development'],
      ['CLIENT', 'test']
    ] as const)('%s logs in %s', (context, environment) => {
      const logger = createLogger(context, environment);

      logger.error('e');
      logger.warn('w');
      logger.info('i');

      expect(consoleError).toHaveBeenCalledOnce();
      expect(consoleWarn).toHaveBeenCalledOnce();
      expect(consoleLog).toHaveBeenCalledOnce();
    });

    it('CLIENT stays silent in production', () => {
      const logger = createLogger('CLIENT', 'production');

      logger.error('e', new Error('boom'));
      logger.warn('w');
      logger.info('i');

      expect(consoleError).not.toHaveBeenCalled();
      expect(consoleWarn).not.toHaveBeenCalled();
      expect(consoleLog).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('keeps the prefix when the message is empty', () => {
      createLogger('SERVER', 'development').error('');

      expect(consoleError).toHaveBeenCalledExactlyOnceWith('SERVER ERROR | ');
    });

    it('does not mix the output of two loggers', () => {
      const server = createLogger('SERVER', 'production');
      const client = createLogger('CLIENT', 'production');

      client.error('from the client');
      server.error('from the server');

      expect(consoleError).toHaveBeenCalledExactlyOnceWith('SERVER ERROR | from the server');
    });
  });
});
