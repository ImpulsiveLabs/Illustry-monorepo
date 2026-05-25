import NewProjectPage from '@/app/(data)/projects/new/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  })
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock
}));

describe('NewProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to the projects create modal state', () => {
    expect(() => NewProjectPage()).toThrow('NEXT_REDIRECT:/projects?modal=new');
    expect(redirectMock).toHaveBeenCalledWith('/projects?modal=new');
  });
});
