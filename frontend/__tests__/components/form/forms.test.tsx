import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileTypes } from '@illustry/types';
import AddProjectForm from '@/components/form/add-project-form';
import UpdateProjectForm from '@/components/form/update-project-form';
import AddDashboardForm from '@/components/form/add-dashboard-form';
import UpdateDashboardForm from '@/components/form/update-dashboard-form';
import AddVisualizationForm from '@/components/form/add-visualization-form';

const {
    push,
    replace,
    refresh,
    toastSuccess,
    toastError,
    createProject,
    updateProject,
    createDashboard,
    updateDashboard,
    createOrUpdateVisualization,
    catchError,
    typeTabState,
    navigationState
} = vi.hoisted(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
    createProject: vi.fn(() => Promise.resolve({})),
    updateProject: vi.fn(() => Promise.resolve({})),
    createDashboard: vi.fn(() => Promise.resolve({})),
    updateDashboard: vi.fn(() => Promise.resolve({})),
    createOrUpdateVisualization: vi.fn(() => Promise.resolve({})),
    catchError: vi.fn(),
    typeTabState: {
        filesCount: 1,
        fileType: 'CSV' as string
    },
    navigationState: {
        pathname: '/projects'
    }
}));

vi.mock('next/navigation', () => ({
    usePathname: () => navigationState.pathname,
    useRouter: () => ({ push, replace, refresh }),
    useSearchParams: () => new URLSearchParams()
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
        <>
            <button onClick={() => onValueChange(['Revenue (bar-chart)', 'Growth (line-chart)'])}>
                set-visualizations
            </button>
            <button onClick={() => onValueChange(['Malformed visualization value'])}>
                set-invalid-visualizations
            </button>
        </>
    )
}));

vi.mock('@/components/ui/tabs/mappingTab/mappingTab', () => ({
    default: () => <div data-testid="mapping-tab" />
}));

vi.mock('@/components/ui/tabs/typeTab/typeTab', () => ({
    default: ({ form, updateFiles, handleFileTypeChange, removeFile }: any) => (
        <button
            type="button"
            onClick={() => {
                handleFileTypeChange(typeTabState.fileType);
                form.setValue('fileType', typeTabState.fileType);
                form.setValue('fullDetails', false);
                form.setValue('separator', ',');
                form.setValue('includeHeaders', true);
                form.setValue('name', 'Visualization A');
                form.setValue('type', 'word-cloud');
                form.setValue('description', 'Desc');
                form.setValue('tags', 'a,b');
                form.setValue('mapping', { names: '1', values: '2', properties: '3' });
                const files = Array.from({ length: typeTabState.filesCount }, (_, index) => ({
                    id: String(index + 1),
                    file: new File(['a,b'], `demo-${index + 1}.csv`, { type: 'text/csv' })
                }));
                updateFiles(files as any);
                if (files.length > 0) {
                    removeFile(files[0]?.id);
                    updateFiles(files as any);
                }
            }}
        >
            setup-visualization
        </button>
    )
}));

describe('form components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        typeTabState.filesCount = 1;
        typeTabState.fileType = FileTypes.FileType.CSV;
        navigationState.pathname = '/projects';
    });

    it('submits add project form and redirects', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/projects';
        render(<AddProjectForm />);

        await user.type(screen.getByPlaceholderText('Type project name here.'), 'My Project');
        await user.type(screen.getByPlaceholderText('Type project description here.'), 'Some description');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /Create project/i }));

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
        navigationState.pathname = '/projects';
        render(<UpdateProjectForm project={{ name: 'p1', description: 'old', isActive: false } as any} />);

        await user.clear(screen.getByPlaceholderText('Type project description here.'));
        await user.type(screen.getByPlaceholderText('Type project description here.'), 'new desc');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /Update project/i }));

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
        navigationState.pathname = '/dashboards';
        render(<AddDashboardForm visualizations={{ v1: 'Revenue (bar-chart)' }} />);

        await user.type(screen.getByPlaceholderText('Type dashboard name here.'), 'Dash 1');
        await user.type(screen.getByPlaceholderText('Type dashboard description here.'), 'Dashboard desc');
        await user.click(screen.getByRole('button', { name: 'set-visualizations' }));
        await user.click(screen.getByRole('button', { name: /Create dashboard/i }));

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
        navigationState.pathname = '/dashboards';
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

        await user.clear(screen.getByPlaceholderText('Type dashboard description here.'));
        await user.type(screen.getByPlaceholderText('Type dashboard description here.'), 'updated');
        await user.click(screen.getByRole('button', { name: 'set-visualizations' }));
        await user.click(screen.getByRole('button', { name: /Update dashboard/i }));

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalledWith(expect.objectContaining({
                description: 'updated',
                visualizations: expect.objectContaining({ 'Revenue _bar-chart': 'bar-chart' })
            }));
        });
        expect(push).toHaveBeenCalledWith('/dashboards');
    });

    it('handles missing visualization maps and malformed selected labels', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/dashboards';

        render(<AddDashboardForm visualizations={undefined as any} />);
        await user.type(screen.getByPlaceholderText('Type dashboard name here.'), 'Dash Missing');
        await user.type(screen.getByPlaceholderText('Type dashboard description here.'), 'Desc');
        await user.click(screen.getByRole('button', { name: 'set-invalid-visualizations' }));
        await user.click(screen.getByRole('button', { name: /Create dashboard/i }));

        await waitFor(() => {
            expect(createDashboard).toHaveBeenCalledWith(expect.objectContaining({
                visualizations: {}
            }));
        });

        render(
            <UpdateDashboardForm
                dashboard={null}
                visualizations={undefined as any}
            />
        );
        const invalidButtons = screen.getAllByRole('button', { name: 'set-invalid-visualizations' });
        await user.click(invalidButtons[invalidButtons.length - 1] as HTMLElement);
        const updateButtons = screen.getAllByRole('button', { name: /Update dashboard/i });
        await user.click(updateButtons[updateButtons.length - 1] as HTMLElement);

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalledWith(expect.objectContaining({
                description: '',
                visualizations: {}
            }));
        });
    });

    it('submits add visualization form with file payload and handles no files path', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/visualizations';
        render(<AddVisualizationForm />);

        expect(screen.getByRole('button', { name: /Create visualization/i })).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'setup-visualization' }));
        await user.click(screen.getByRole('button', { name: 'setup-visualization' }));
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Create visualization/i })).toBeEnabled();
        });
        await user.click(screen.getByRole('button', { name: /Create visualization/i }));

        await waitFor(() => {
            expect(createOrUpdateVisualization).toHaveBeenCalledTimes(1);
        });
        const formDataArg = createOrUpdateVisualization.mock.calls[0][0] as FormData;
        expect(formDataArg.get('fullDetails')).toBe('false');
        expect(String(formDataArg.get('fileDetails'))).toContain('CSV');
        expect(String(formDataArg.get('visualizationDetails'))).toContain('Visualization A');
        expect(replace).toHaveBeenCalledWith('/visualizations');
        expect(refresh).toHaveBeenCalled();
    });

    it('handles no-op file type changes while still submitting payload', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/visualizations';
        typeTabState.fileType = FileTypes.FileType.JSON;

        render(<AddVisualizationForm />);
        await user.click(screen.getByRole('button', { name: 'setup-visualization' }));
        await user.click(screen.getByRole('button', { name: /Create visualization/i }));

        await waitFor(() => {
            expect(createOrUpdateVisualization).toHaveBeenCalledTimes(1);
        });
    });

    it('closes add visualization modal from cancel and close controls', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/visualizations';

        const { unmount } = render(<AddVisualizationForm />);
        await user.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(replace).toHaveBeenCalledWith('/visualizations');
        expect(refresh).not.toHaveBeenCalled();

        unmount();
        vi.clearAllMocks();
        render(<AddVisualizationForm />);
        await user.click(screen.getByRole('button', { name: '×' }));
        expect(replace).toHaveBeenCalledWith('/visualizations');
        expect(refresh).not.toHaveBeenCalled();
    });

    it('routes file-count validation errors through catchError', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/visualizations';
        typeTabState.filesCount = 11;

        render(<AddVisualizationForm />);

        await user.click(screen.getByRole('button', { name: 'setup-visualization' }));
        await user.click(screen.getByRole('button', { name: /Create visualization/i }));

        await waitFor(() => {
            expect(catchError).toHaveBeenCalled();
        });
        expect(createOrUpdateVisualization).not.toHaveBeenCalled();
    });

    it('routes thrown action errors through catchError', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/projects';
        createProject.mockRejectedValueOnce(new Error('boom'));

        render(<AddProjectForm />);
        await user.type(screen.getByPlaceholderText('Type project name here.'), 'Err Project');
        await user.type(screen.getByPlaceholderText('Type project description here.'), 'Desc');
        await user.click(screen.getByRole('button', { name: /Create project/i }));

        await waitFor(() => {
            expect(catchError).toHaveBeenCalled();
        });
    });

    it('routes dashboard create/update errors through catchError', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/dashboards';
        createDashboard.mockRejectedValueOnce(new Error('dash-create'));
        updateDashboard.mockRejectedValueOnce(new Error('dash-update'));

        render(<AddDashboardForm visualizations={{ v1: 'Revenue (bar-chart)' }} />);
        await user.type(screen.getByPlaceholderText('Type dashboard name here.'), 'Dash Err');
        await user.type(screen.getByPlaceholderText('Type dashboard description here.'), 'Desc');
        await user.click(screen.getByRole('button', { name: /Create dashboard/i }));

        await waitFor(() => {
            expect(catchError).toHaveBeenCalled();
        });

        render(
            <UpdateDashboardForm
                dashboard={{ name: 'd2', description: 'old', visualizations: {} } as any}
                visualizations={{}}
            />
        );
        await user.click(screen.getAllByRole('button', { name: /Update dashboard/i })[0] as HTMLElement);

        await waitFor(() => {
            expect(catchError).toHaveBeenCalled();
        });
    });

    it('covers update-project guard and error paths', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/projects';
        updateProject.mockRejectedValueOnce(new Error('project-update'));

        render(<UpdateProjectForm project={{ name: 'p2', description: 'old', isActive: false } as any} />);
        await user.click(screen.getByRole('button', { name: /Update project/i }));
        await waitFor(() => {
            expect(catchError).toHaveBeenCalled();
        });

        cleanup();
        render(<UpdateProjectForm project={{ description: '', isActive: false } as any} />);
        await user.click(screen.getByRole('button', { name: /Update project/i }));
        expect(updateProject).toHaveBeenCalledTimes(1);
    });

    it('uses truthy project defaults and skips predefined visualization push when key is absent', async () => {
        const user = userEvent.setup();
        navigationState.pathname = '/projects';

        render(
            <UpdateProjectForm project={{ name: 'p3', description: 'has-desc', isActive: true } as any} />
        );
        expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');

        render(
            <UpdateDashboardForm
                dashboard={{
                    name: 'd3',
                    description: 'desc',
                    visualizations: {}
                } as any}
                visualizations={{ 'Missing(line-chart)': 'Missing (line-chart)' }}
            />
        );

        const setButtons = screen.getAllByRole('button', { name: 'set-visualizations' });
        await user.click(setButtons[setButtons.length - 1] as HTMLElement);
        const submitButtons = screen.getAllByRole('button', { name: /Update dashboard/i });
        await user.click(submitButtons[submitButtons.length - 1] as HTMLElement);

        await waitFor(() => {
            expect(updateDashboard).toHaveBeenCalled();
        });
    });
});
