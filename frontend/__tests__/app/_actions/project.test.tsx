import {
  browseProjects,
  deleteProject,
  updateProject,
  createProject,
  findOneProject
} from '@/app/_actions/project';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectTypes } from '@illustry/types';

// Mock the revalidateTag function from next/cache
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}));

// Mock makeRequest
vi.mock('@/lib/request', () => ({
  __esModule: true,
  default: vi.fn()
}));

// Mock the environment variable
const mockUrl = 'http://mocked-backend-url';
process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL = mockUrl;

import makeRequest from '@/lib/request';

describe('Project Server Functions', () => {
  const projectMock: ProjectTypes.ProjectType = {
    _id: 'mocked-id',
    name: 'TestProject',
    description: 'A test project',
    isActive: true
  };

  const extendedMock: ProjectTypes.ExtendedProjectType = {
    projects: [projectMock]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('browseProjects calls makeRequest with correct request', async () => {
    (makeRequest as any).mockResolvedValue(extendedMock);
    const result = await browseProjects({ isActive: true });
    expect(makeRequest).toHaveBeenCalled();
    expect(result).toEqual(extendedMock);
  });

  it('deleteProject calls makeRequest with DELETE method', async () => {
    (makeRequest as any).mockResolvedValue(true);
    const result = await deleteProject('TestProject');
    expect(makeRequest).toHaveBeenCalled();
    const request = (makeRequest as any).mock.calls[0][0];
    expect(request.method).toBe('DELETE');
    expect(result).toBe(true);
  });

  it('updateProject calls makeRequest with PUT method', async () => {
    (makeRequest as any).mockResolvedValue(projectMock);
    const result = await updateProject(projectMock);
    expect(makeRequest).toHaveBeenCalled();
    const request = (makeRequest as any).mock.calls[0][0];
    expect(request.method).toBe('PUT');
    expect(result).toEqual(projectMock);
  });

  it('createProject calls makeRequest with POST method and transformed body', async () => {
    (makeRequest as any).mockResolvedValue(projectMock);
    const result = await createProject({
      name: 'TestProject',
      description: 'A test project',
      isActive: true
    });
    expect(makeRequest).toHaveBeenCalled();
    const request = (makeRequest as any).mock.calls[0][0];
    expect(request.method).toBe('POST');
    expect(result).toEqual(projectMock);
  });

  it('findOneProject calls makeRequest with POST method and body', async () => {
    (makeRequest as any).mockResolvedValue(projectMock);
    const result = await findOneProject('TestProject');
    expect(makeRequest).toHaveBeenCalled();
    const request = (makeRequest as any).mock.calls[0][0];
    expect(request.method).toBe('POST');
    expect(result).toEqual(projectMock);
  });

  it('returns null on makeRequest failure for all functions', async () => {
    (makeRequest as any).mockImplementation(() => {
      throw new Error('Request failed');
    });

    const resultBrowse = await browseProjects();
    expect(resultBrowse).toBeNull();

    const resultDelete = await deleteProject('TestProject');
    expect(resultDelete).toBeNull();

    const resultUpdate = await updateProject(projectMock);
    expect(resultUpdate).toBeNull();

    const resultCreate = await createProject({
      name: 'TestProject',
      description: 'A test project',
      isActive: true
    });
    expect(resultCreate).toBeNull();

    const resultFind = await findOneProject('TestProject');
    expect(resultFind).toBeNull();
  });
});
