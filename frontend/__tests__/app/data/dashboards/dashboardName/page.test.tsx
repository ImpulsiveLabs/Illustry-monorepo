import UpdateDashboardPage, { type UpdateDashboardPageProps } from '@/app/(data)/dashboards/[dashboardName]/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  })
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock
}));

describe('UpdateDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to the dashboards edit modal state', async () => {
    const params: UpdateDashboardPageProps['params'] = Promise.resolve({
      dashboardName: 'Sales Dashboard'
    });

    await expect(UpdateDashboardPage({ params })).rejects.toThrow(
      'NEXT_REDIRECT:/dashboards?edit=Sales%20Dashboard'
    );
    expect(redirectMock).toHaveBeenCalledWith('/dashboards?edit=Sales%20Dashboard');
  });
});
