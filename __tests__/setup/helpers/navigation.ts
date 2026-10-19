import { vi } from 'vitest';

export const navigation = {
  replace: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams()
};

export function resetNavigation() {
  navigation.replace.mockReset();
  navigation.refresh.mockReset();
  navigation.searchParams = new URLSearchParams();
}
