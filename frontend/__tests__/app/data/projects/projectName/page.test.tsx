import { render, screen } from '@testing-library/react';
import UpdateProjectPage, { type UpdateProjectPageProps } from '@/app/(data)/projects/[projectName]/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/app/_actions/project', () => ({
  findOneProject: vi.fn(),
}));

vi.mock('@/components/form/update-project-form', () => ({
  __esModule: true,
  default: ({ project }: { project: any }) => (
    <div data-testid="update-project-form">
      <div data-testid="project-name">{project?.name}</div>
    </div>
  ),
}));

import { findOneProject } from '@/app/_actions/project';

describe('UpdateProjectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders UpdateProjectForm with fetched project data', async () => {
    const mockProject = {
      id: 'p1',
      name: 'Project Test',
      description: 'A mocked project',
    };

    vi.mocked(findOneProject).mockResolvedValue(mockProject);

    const params: UpdateProjectPageProps['params'] = {
      projectName: 'Project Test',
    };

    render(await UpdateProjectPage({ params }));

    expect(screen.getByTestId('update-project-form')).toBeInTheDocument();
    expect(screen.getByTestId('project-name').textContent).toBe('Project Test');
    expect(findOneProject).toHaveBeenCalledWith('Project Test');
  });

  it('calls notFound when the project cannot be loaded', async () => {
    vi.mocked(findOneProject).mockResolvedValue(undefined);

    const params: UpdateProjectPageProps['params'] = {
      projectName: '',
    };

    await expect(UpdateProjectPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalled();
  });
});
