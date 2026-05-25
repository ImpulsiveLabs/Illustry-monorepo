import NewDashboardPage from '@/app/(data)/dashboards/new/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  })
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock
}));

describe('NewDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to the dashboards create modal state', () => {
    expect(() => NewDashboardPage()).toThrow('NEXT_REDIRECT:/dashboards?modal=new');
    expect(redirectMock).toHaveBeenCalledWith('/dashboards?modal=new');
  });
});
