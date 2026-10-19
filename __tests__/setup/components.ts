import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

import { navigation, resetNavigation } from './helpers/navigation';

/**
  The real router only works inside the Next.js app router, so components get this one. Tests set
  `navigation.searchParams` and look at `navigation.replace` / `navigation.refresh`.
*/
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace, refresh: navigation.refresh }),
  useSearchParams: () => navigation.searchParams
}));

beforeEach(() => {
  resetNavigation();
});

afterEach(() => {
  cleanup();
});
