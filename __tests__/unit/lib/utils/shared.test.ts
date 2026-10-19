import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getAppBaseUrl } from '@/lib/utils/shared';

function stubBrowserOrigin(origin: string) {
  vi.stubGlobal('window', { location: { origin } });
}

beforeEach(() => {
  // Start from a clean slate so the developer's own environment never leaks into a test
  vi.stubEnv('VERCEL_URL', undefined);
  vi.stubEnv('PORT', undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('getAppBaseUrl', () => {
  describe('in the browser', () => {
    it('returns the origin of the current page', () => {
      stubBrowserOrigin('https://app.example.com');

      expect(getAppBaseUrl()).toBe('https://app.example.com');
    });
  });

  describe('on the server, deployed on Vercel', () => {
    it('adds https to the deployment host', () => {
      vi.stubEnv('VERCEL_URL', 'my-app-git-feature-team.vercel.app');

      expect(getAppBaseUrl()).toBe('https://my-app-git-feature-team.vercel.app');
    });
  });

  describe('on the server, running locally', () => {
    it('uses localhost on port 3000 by default', () => {
      expect(getAppBaseUrl()).toBe('http://localhost:3000');
    });

    it('uses the port from the environment', () => {
      vi.stubEnv('PORT', '4000');

      expect(getAppBaseUrl()).toBe('http://localhost:4000');
    });
  });

  describe('edge cases', () => {
    it('keeps the port of the current page in the browser', () => {
      stubBrowserOrigin('http://localhost:5173');

      expect(getAppBaseUrl()).toBe('http://localhost:5173');
    });

    it('prefers the browser origin over the server environment', () => {
      stubBrowserOrigin('https://app.example.com');
      vi.stubEnv('VERCEL_URL', 'my-app.vercel.app');
      vi.stubEnv('PORT', '4000');

      expect(getAppBaseUrl()).toBe('https://app.example.com');
    });

    it('prefers the Vercel host over the local port', () => {
      vi.stubEnv('VERCEL_URL', 'my-app.vercel.app');
      vi.stubEnv('PORT', '4000');

      expect(getAppBaseUrl()).toBe('https://my-app.vercel.app');
    });

    it('treats an empty Vercel host as not deployed', () => {
      vi.stubEnv('VERCEL_URL', '');

      expect(getAppBaseUrl()).toBe('http://localhost:3000');
    });

    it('treats an empty Vercel host as not deployed, keeping the custom port', () => {
      vi.stubEnv('VERCEL_URL', '');
      vi.stubEnv('PORT', '4000');

      expect(getAppBaseUrl()).toBe('http://localhost:4000');
    });
  });
});
