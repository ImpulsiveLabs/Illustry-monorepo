import {
  browseDashboards,
  deleteDashboard,
  updateDashboard,
  createDashboard,
  findOneDashboard
} from '@/app/_actions/dashboard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardTypes } from '@illustry/types';

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

describe('Dashboard Server Functions', () => {
  const dashboardMock: DashboardTypes.DashboardType = {
    _id: 'mocked-id',
    name: 'Test',
    projectName: 'Test Project',
    description: 'Test Description',
    visualizations: []
  };

  const extendedMock: DashboardTypes.ExtendedDashboardType = {
    dashboards: [dashboardMock]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('browseDashboards calls makeRequest with correct request', async () => {
    (makeRequest as any).mockResolvedValue(extendedMock);
    const result = await browseDashboards({ projectName: 'proj' });
    expect(makeRequest).toHaveBeenCalled();
    expect(result).toEqual(extendedMock);
  });

  it('deleteDashboard calls makeRequest with DELETE method', async () => {
    (makeRequest as any).mockResolvedValue(true);
    const result = await deleteDashboard('Test');
    expect(makeRequest).toHaveBeenCalled();
    const request = (makeRequest as any).mock.calls[0][0];
    expect(request.method).toBe('DELETE');
    expect(result).toBe(true);
  });

  it('updateDashboard calls makeRequest with PUT method', async () => {
    (makeRequest as any).mockResolvedValue(dashboardMock);
    const result = await updateDashboard(dashboardMock);
    expect(makeRequest).toHaveBeenCalled();
    const request = (makeRequest as any).mock.calls[0][0];
    expect(request.method).toBe('PUT');
    expect(result).toEqual(dashboardMock);
  });

  it('createDashboard calls makeRequest with POST method', async () => {
    (makeRequest as any).mockResolvedValue(dashboardMock);
    const result = await createDashboard({
      name: 'Test',
      projectName: 'Project',
      description: 'desc',
      visualizations: []
    });
    expect(makeRequest).toHaveBeenCalled();
    const request = (makeRequest as any).mock.calls[0][0];
    expect(request.method).toBe('POST');
    expect(result).toEqual(dashboardMock);
  });

  it('findOneDashboard calls makeRequest with POST method and body', async () => {
    (makeRequest as any).mockResolvedValue(dashboardMock);
    const result = await findOneDashboard('Test', true);
    expect(makeRequest).toHaveBeenCalled();
    const request = (makeRequest as any).mock.calls[0][0];
    expect(request.method).toBe('POST');
    expect(result).toEqual(dashboardMock);
  });

  it('returns null on makeRequest failure', async () => {
    (makeRequest as any).mockImplementation(() => {
      throw new Error('Request failed');
    });
    const resultBrowse = await browseDashboards();
    expect(resultBrowse).toBeNull();
    const resultDelete = await deleteDashboard('Test');
    expect(resultDelete).toBeNull();
    const resultUpdate = await updateDashboard(dashboardMock);
    expect(resultUpdate).toBeNull();
    const resultCreate = await createDashboard({
      name: 'Test',
      projectName: 'Project',
      description: 'desc',
      visualizations: []
    });
    expect(resultCreate).toBeNull();
    const resultFind = await findOneDashboard('Test', true);
    expect(resultFind).toBeNull();
  });
});
