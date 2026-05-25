import NewVisualizationPage from '@/app/(data)/visualizations/new/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  })
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock
}));

describe('NewVisualizationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to the visualizations create modal state', () => {
    expect(() => NewVisualizationPage()).toThrow('NEXT_REDIRECT:/visualizations?modal=new');
    expect(redirectMock).toHaveBeenCalledWith('/visualizations?modal=new');
  });
});
