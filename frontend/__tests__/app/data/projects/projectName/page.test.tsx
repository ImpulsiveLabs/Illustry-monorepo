import { render, screen } from '@testing-library/react';
import UpdateProjectPage, { type UpdateProjectPageProps } from '@/app/(data)/projects/[projectName]/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock the project action
vi.mock('@/app/_actions/project', () => ({
  findOneProject: vi.fn(),
}));

// Mock the form component
vi.mock('@/components/form/update-project-form', () => ({
  __esModule: true,
  default: ({ project }: { project: any }) => (
    <div data-testid="update-project-form">
      <div data-testid="project-name">{project?.name}</div>
    </div>
  ),
}));

// Import after mocks
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

  it('renders UpdateProjectForm with undefined when no params are given', async () => {
    vi.mocked(findOneProject).mockResolvedValue(undefined);

    const params: UpdateProjectPageProps['params'] = {
      projectName: '',
    };

    render(await UpdateProjectPage({ params }));

    expect(screen.getByTestId('update-project-form')).toBeInTheDocument();
    expect(screen.getByTestId('project-name').textContent).toBe('');
  });
});
