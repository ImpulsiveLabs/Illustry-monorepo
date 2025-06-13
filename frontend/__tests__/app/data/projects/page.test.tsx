import { render, screen } from '@testing-library/react';
import Projects, { type ProjectsProps } from '@/app/(data)/projects/page';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock the data fetcher
vi.mock('@/app/_actions/project', () => ({
  browseProjects: vi.fn(),
}));

// Mock the shell component
vi.mock('@/components/shells/projects-table-shell', () => ({
  __esModule: true,
  default: ({ data, pageCount }: { data: any[]; pageCount: number }) => (
    <div data-testid="projects-table-shell">
      <div data-testid="projects-count">{data.length}</div>
      <div data-testid="page-count">{pageCount}</div>
    </div>
  ),
}));

// Import after mocks
import { browseProjects } from '@/app/_actions/project';

describe('Projects Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ProjectsTableShell with fetched data and pagination', async () => {
    const mockProjects = {
      projects: [
        { id: '1', name: 'Project A' },
        { id: '2', name: 'Project B' },
      ],
      pagination: { pageCount: 4 },
    };

    vi.mocked(browseProjects).mockResolvedValue(mockProjects);

    const searchParams: ProjectsProps['searchParams'] = {
      page: '1',
      text: 'analytics',
      per_page: '10',
      sort: 'name.asc',
    };

    render(await Projects({ searchParams }));

    expect(screen.getByTestId('projects-table-shell')).toBeInTheDocument();
    expect(screen.getByTestId('projects-count').textContent).toBe('2');
    expect(screen.getByTestId('page-count').textContent).toBe('4');

    expect(browseProjects).toHaveBeenCalledWith({
      page: 1,
      text: 'analytics',
      per_page: 10,
      sort: {
        sortOrder: 1,
        element: 'name',
      },
    });
  });

  it('renders ProjectsTableShell with default values when searchParams is empty', async () => {
    const mockProjects = {
      projects: [],
      pagination: { pageCount: 1 },
    };

    vi.mocked(browseProjects).mockResolvedValue(mockProjects);

    render(await Projects({ searchParams: {} }));

    expect(screen.getByTestId('projects-table-shell')).toBeInTheDocument();
    expect(screen.getByTestId('projects-count').textContent).toBe('0');
    expect(screen.getByTestId('page-count').textContent).toBe('1');

    expect(browseProjects).toHaveBeenCalledWith({
      page: 1,
      per_page: 10,
      sort: undefined,
    });
  });
});
