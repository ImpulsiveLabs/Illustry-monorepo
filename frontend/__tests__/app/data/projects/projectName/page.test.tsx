import UpdateProjectPage, { type UpdateProjectPageProps } from '@/app/(data)/projects/[projectName]/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  })
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock
}));

describe('UpdateProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to the projects edit modal state', async () => {
    const params: UpdateProjectPageProps['params'] = Promise.resolve({
      projectName: 'Project Test'
    });

    await expect(UpdateProjectPage({ params })).rejects.toThrow('NEXT_REDIRECT:/projects?edit=Project%20Test');
    expect(redirectMock).toHaveBeenCalledWith('/projects?edit=Project%20Test');
  });
});
