import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTypes } from '@illustry/types';
import AddProjectForm from '@/components/form/add-project-form';
import UpdateProjectForm from '@/components/form/update-project-form';
import AddDashboardForm from '@/components/form/add-dashboard-form';
import UpdateDashboardForm from '@/components/form/update-dashboard-form';
import AddVisualizationForm from '@/components/form/add-visualization-form';

const {
    push,
    toastSuccess,
    toastError,
    createProject,
    updateProject,
    createDashboard,
    updateDashboard,
    createOrUpdateVisualization,
    catchError
} = vi.hoisted(() => ({
    push: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    createProject: vi.fn(() => Promise.resolve({})),
    updateProject: vi.fn(() => Promise.resolve({})),
    createDashboard: vi.fn(() => Promise.resolve({})),
    updateDashboard: vi.fn(() => Promise.resolve({})),
    createOrUpdateVisualization: vi.fn(() => Promise.resolve({})),
    catchError: vi.fn()
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push })
}));

vi.mock('sonner', () => ({
    toast: {
        success: toastSuccess,
        error: toastError
    }
}));

vi.mock('@/app/_actions/project', () => ({
    createProject,
    updateProject
}));

vi.mock('@/app/_actions/dashboard', () => ({
    createDashboard,
    updateDashboard
}));

vi.mock('@/app/_actions/visualization', () => ({
    createOrUpdateVisualization
}));

vi.mock('@/lib/utils', async () => {
    const actual = await vi.importActual<any>('@/lib/utils');
    return {
        ...actual,
        catchError
    };
});

vi.mock('@/components/ui/multi-select', () => ({
    default: ({ onValueChange }: any) => (
        <button onClick={() => onValueChange(['Revenue (bar-chart)', 'Growth (line-chart)'])}>
            set-visualizations
        </button>
    )
}));

vi.mock('@/components/ui/tabs/mappingTab/mappingTab', () => ({
    default: () => <button type="submit">Add Visualizations</button>
}));

vi.mock('@/components/ui/tabs/typeTab/typeTab', () => ({
    default: ({ form, updateFiles, handleFileTypeChange }: any) => (
        <button
            type="button"
            onClick={() => {
                handleFileTypeChange(FileTypes.FileType.CSV);
                form.setValue('fileType', FileTypes.FileType.CSV);
                form.setValue('fullDetails', false);
                form.setValue('separator', ',');
                form.setValue('includeHeaders', true);
                form.setValue('name', 'Visualization A');
                form.setValue('type', 'word-cloud');
                form.setValue('description', 'Desc');
                form.setValue('tags', 'a,b');
                form.setValue('mapping', { names: '1', values: '2', properties: '3' });
                updateFiles([
                    {
                        id: '1',
                        file: new File(['a,b'], 'demo.csv', { type: 'text/csv' })
                    }
                ]);
            }}
        >
            setup-visualization
        </button>
    )
}));

describe('form components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('submits add project form and redirects', async () => {
        const user = userEvent.setup();
        render(<AddProjectForm />);

        await user.type(screen.getByPlaceholderText('Type project name here.'), 'My Project');
        await user.type(screen.getByPlaceholderText('Type project description here.'), 'Some description');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /Add Project/i }));

        await waitFor(() => {
            expect(createProject).toHaveBeenCalledWith({
                name: 'My Project',
                description: 'Some description',
                isActive: true
            });
        });
        expect(toastSuccess).toHaveBeenCalledWith('Project added successfully.');
        expect(push).toHaveBeenCalledWith('/projects');
    });

    it('submits update project form when project exists', async () => {
        const user = userEvent.setup();
        render(<UpdateProjectForm project={{ name: 'p1', description: 'old', isActive: false } as any} />);

        await user.clear(screen.getByPlaceholderText('Type project description here.'));
        await user.type(screen.getByPlaceholderText('Type project description here.'), 'new desc');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /Update Project/i }));

        await waitFor(() => {
            expect(updateProject).toHaveBeenCalledWith({
                name: 'p1',
                description: 'new desc',
                isActive: true
            });
        });
        expect(push).toHaveBeenCalledWith('/projects');
    });

    it('submits add dashboard form with formatted visualizations', async () => {
        const user = userEvent.setup();
        render(<AddDashboardForm visualizations={{ v1: 'Revenue (bar-chart)' }} />);

        await user.type(screen.getByPlaceholderText('Type Dashboard name here.'), 'Dash 1');
        await user.type(screen.getByPlaceholderText('Type Dashboard description here.'), 'Dashboard desc');
        await user.click(screen.getByRole('button', { name: 'set-visualizations' }));
        await user.click(screen.getByRole('button', { name: /Add Dashboard/i }));

        await waitFor(() => {
            expect(createDashboard).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Dash 1',
                description: 'Dashboard desc',
                visualizations: {
                    'Revenue _bar-chart': 'bar-chart',
                    'Growth _line-chart': 'line-chart'
                }
            }));
        });
        expect(push).toHaveBeenCalledWith('/dashboards');
    });

    it('submits update dashboard form with defaults and selection', async () => {
        const user = userEvent.setup();
        render(
            <UpdateDashboardForm
                dashboard={{
                    name: 'd1',
                    description: 'old',
                    visualizations: { 'Revenue_bar-chart': 'bar-chart' }
                } as any}
                visualizations={{ 'Revenue(bar-chart)': 'Revenue (bar-chart)' }}
            />
        );

        await user.clear(screen.getByPlaceholderText('Type Dashboard description here.'));
        await user.type(screen.getByPlaceholderText('Type Dashboard description here.'), 'updated');
        await user.click(screen.getByRole('button', { name: 'set-visualizations' }));
        await user.click(screen.getByRole('button', { name: /Update Dashboard/i }));

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalledWith(expect.objectContaining({
                description: 'updated',
                visualizations: expect.objectContaining({ 'Revenue _bar-chart': 'bar-chart' })
            }));
        });
        expect(push).toHaveBeenCalledWith('/dashboards');
    });

    it('submits add visualization form with file payload and handles no files path', async () => {
        const user = userEvent.setup();
        render(<AddVisualizationForm />);

        await user.click(screen.getByRole('button', { name: /Add Visualizations/i }));
        expect(toastError).toHaveBeenCalledWith('No files selected.');

        await user.click(screen.getByRole('button', { name: 'setup-visualization' }));
        await user.click(screen.getByRole('button', { name: /Add Visualizations/i }));

        await waitFor(() => {
            expect(createOrUpdateVisualization).toHaveBeenCalledTimes(1);
        });
        const formDataArg = createOrUpdateVisualization.mock.calls[0][0] as FormData;
        expect(formDataArg.get('fullDetails')).toBe('false');
        expect(String(formDataArg.get('fileDetails'))).toContain('CSV');
        expect(String(formDataArg.get('visualizationDetails'))).toContain('Visualization A');
        expect(push).toHaveBeenCalledWith('/visualizations');
    });

    it('routes thrown action errors through catchError', async () => {
        const user = userEvent.setup();
        createProject.mockRejectedValueOnce(new Error('boom'));

        render(<AddProjectForm />);
        await user.type(screen.getByPlaceholderText('Type project name here.'), 'Err Project');
        await user.type(screen.getByPlaceholderText('Type project description here.'), 'Desc');
        await user.click(screen.getByRole('button', { name: /Add Project/i }));

        await waitFor(() => {
            expect(catchError).toHaveBeenCalled();
        });
    });
});
