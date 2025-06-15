import {
    browseVisualizations,
    deleteVisualization,
    createOrUpdateVisualization,
    findOneVisualization
} from '@/app/_actions/visualization';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VisualizationTypes } from '@illustry/types';

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
import { VisualizationTypesEnum } from '@illustry/types/dist/visualization';

describe('Visualization Server Functions', () => {
    const visualizationMock: VisualizationTypes.VisualizationType = {
        _id: 'mocked-id',
        projectName: 'TestProject',
        name: 'TestVisualization',
        type: VisualizationTypesEnum.BAR_CHART,
        data: {}
    };

    const extendedMock: VisualizationTypes.ExtendedVisualizationType = {
        visualizations: [visualizationMock]
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('browseVisualizations calls makeRequest with correct request', async () => {
        (makeRequest as any).mockResolvedValue(extendedMock);
        const result = await browseVisualizations({ type: 'chart' });
        expect(makeRequest).toHaveBeenCalled();
        expect(result).toEqual(extendedMock);
    });

    it('deleteVisualization calls makeRequest with DELETE method', async () => {
        (makeRequest as any).mockResolvedValue(true);
        const result = await deleteVisualization({ name: 'TestVisualization' });
        expect(makeRequest).toHaveBeenCalled();
        const request = (makeRequest as any).mock.calls[0][0];
        expect(request.method).toBe('DELETE');
        expect(result).toBe(true);
    });

    it('createOrUpdateVisualization calls makeRequest with POST method', async () => {
        const form = new FormData();
        (makeRequest as any).mockResolvedValue(visualizationMock);
        const result = await createOrUpdateVisualization(form);
        expect(makeRequest).toHaveBeenCalled();
        const request = (makeRequest as any).mock.calls[0][0];
        expect(request.method).toBe('POST');
        expect(result).toEqual(visualizationMock);
    });

    it('findOneVisualization calls makeRequest with POST method and body', async () => {
        (makeRequest as any).mockResolvedValue(visualizationMock);
        const result = await findOneVisualization({ name: 'TestVisualization' });
        expect(makeRequest).toHaveBeenCalled();
        const request = (makeRequest as any).mock.calls[0][0];
        expect(request.method).toBe('POST');
        expect(result).toEqual(visualizationMock);
    });

    it('returns null on makeRequest failure for all functions', async () => {
        (makeRequest as any).mockImplementation(() => {
            throw new Error('Request failed');
        });

        const resultBrowse = await browseVisualizations();
        expect(resultBrowse).toBeNull();

        const resultDelete = await deleteVisualization({ name: 'TestVisualization' });
        expect(resultDelete).toBeNull();

        const resultCreateOrUpdate = await createOrUpdateVisualization(new FormData());
        expect(resultCreateOrUpdate).toBeNull();

        const resultFind = await findOneVisualization({ name: 'TestVisualization' });
        expect(resultFind).toBeNull();
    });
});
