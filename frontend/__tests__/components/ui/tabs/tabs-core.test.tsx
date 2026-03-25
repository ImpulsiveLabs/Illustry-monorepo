import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { FileTypes, VisualizationTypes } from '@illustry/types';
import { Form } from '@/components/ui/form';
import { Tabs } from '@/components/ui/tabs';
import TypeTab from '@/components/ui/tabs/typeTab/typeTab';
import MappingTab from '@/components/ui/tabs/mappingTab/mappingTab';
import JSONMappingTab from '@/components/ui/tabs/mappingTab/jsonMappingTab';
import XMLMappingTab from '@/components/ui/tabs/mappingTab/xmlMappingTab';
import VisualizationType from '@/components/ui/tabs/mappingTab/visualizationType';
import VisualizationDetails from '@/components/ui/tabs/mappingTab/visualizationDetails';
import ExcelOrCsvMappingTab from '@/components/ui/tabs/mappingTab/excelOrCsvMappingTab';

vi.mock('@files-ui/react', () => ({
    Dropzone: ({ children }: any) => <div data-testid="dropzone">{children}</div>,
    FileMosaic: () => <div data-testid="file-mosaic" />
}));

const renderWithForm = (
    ui: (form: any) => React.ReactNode,
    defaultValues: Record<string, unknown> = {}
) => {
    const Wrapper = () => {
        const form = useForm<any>({
            defaultValues: {
                type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
                ...defaultValues
            }
        });

        return <Form {...form}>{ui(form)}</Form>;
    };

    return render(<Wrapper />);
};

const renderInTabsWithForm = (
    ui: (form: any) => React.ReactNode,
    tabValue: 'mapping' | 'type',
    defaultValues: Record<string, unknown> = {}
) => {
    const Wrapper = () => {
        const form = useForm<any>({
            defaultValues: {
                type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART,
                ...defaultValues
            }
        });

        return (
            <Form {...form}>
                <Tabs defaultValue={tabValue}>{ui(form)}</Tabs>
            </Form>
        );
    };

    return render(<Wrapper />);
};

afterEach(() => {
    vi.useRealTimers();
});

describe('tabs mapping/type components', () => {
    it('renders JSON and XML mapping tabs in both details modes', () => {
        const router = { refresh: vi.fn() };

        const jsonRender = renderWithForm((form) => (
            <JSONMappingTab form={form} router={router} fileDetails={true} />
        ));

        expect(screen.getByText("JSON files don't need a special mapping")).toBeInTheDocument();
        jsonRender.unmount();

        renderWithForm((form) => (
            <XMLMappingTab form={form} router={router} fileDetails={false} />
        ));

        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type visualization name here.')).toBeInTheDocument();

        jsonRender.unmount();
        renderWithForm((form) => (
            <XMLMappingTab form={form} router={router} fileDetails={true} />
        ));
        expect(screen.getByText("XML files don't need a special mapping")).toBeInTheDocument();
    });

    it('updates visualization detail fields', () => {
        vi.useFakeTimers();

        renderWithForm((form) => <VisualizationDetails form={form} />, {
            name: '',
            tags: '',
            description: ''
        });

        fireEvent.change(screen.getByPlaceholderText('Type visualization name here.'), { target: { value: 'My Viz' } });
        fireEvent.change(screen.getByPlaceholderText('Type comma-separated tags.'), { target: { value: 'a,b' } });
        fireEvent.change(screen.getByPlaceholderText('Type visualization description here.'), { target: { value: 'desc' } });

        act(() => {
            vi.runAllTimers();
        });

        expect(screen.getByDisplayValue('My Viz')).toBeInTheDocument();
        expect(screen.getByDisplayValue('a,b')).toBeInTheDocument();
        expect(screen.getByDisplayValue('desc')).toBeInTheDocument();
    });

    it('renders visualization type options and triggers router refresh', async () => {
        const user = userEvent.setup();
        const router = { refresh: vi.fn() };

        renderWithForm((form) => <VisualizationType form={form} router={router} exclude={false} />, {
            type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART
        });

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByText('Scatter'));

        expect(router.refresh).toHaveBeenCalledTimes(1);
    });

    it('hides matrix and timeline options when exclude is true', async () => {
        const user = userEvent.setup();

        renderWithForm((form) => <VisualizationType form={form} router={{ refresh: vi.fn() }} exclude />, {
            type: VisualizationTypes.VisualizationTypesEnum.LINE_CHART
        });

        await user.click(screen.getByRole('combobox'));
        expect(screen.queryByText('Matrix')).not.toBeInTheDocument();
        expect(screen.queryByText('Timeline')).not.toBeInTheDocument();
    });

    it('renders mapping tab branches for json, xml and excel/csv and toggles full details', async () => {
        const user = userEvent.setup();

        const jsonRender = renderInTabsWithForm((form) => (
            <MappingTab
                selectedFileType={FileTypes.FileType.JSON}
                isPending={true}
                form={form}
                router={{ refresh: vi.fn() }}
            />
        ), 'mapping');

        expect(screen.getByRole('button', { name: /Add Visualizations/i })).toBeDisabled();
        await user.click(screen.getByRole('checkbox'));
        expect(screen.getByText("JSON files don't need a special mapping")).toBeInTheDocument();
        jsonRender.unmount();

        const xmlRender = renderInTabsWithForm((form) => (
            <MappingTab
                selectedFileType={FileTypes.FileType.XML}
                isPending={false}
                form={form}
                router={{ refresh: vi.fn() }}
            />
        ), 'mapping');

        expect(screen.getByRole('button', { name: /Add Visualizations/i })).toBeEnabled();
        xmlRender.unmount();

        renderInTabsWithForm((form) => (
            <MappingTab
                selectedFileType={FileTypes.FileType.CSV}
                isPending={false}
                form={form}
                router={{ refresh: vi.fn() }}
            />
        ), 'mapping');

        expect(screen.getByText('Separator')).toBeInTheDocument();

        const excelRender = renderInTabsWithForm((form) => (
            <MappingTab
                selectedFileType={FileTypes.FileType.EXCEL}
                isPending={false}
                form={form}
                router={{ refresh: vi.fn() }}
            />
        ), 'mapping');
        expect(screen.getByText('Sheets number')).toBeInTheDocument();
        excelRender.unmount();
    });

    it('returns empty mapping content for unsupported or missing file types', () => {
        const unknownRender = renderInTabsWithForm((form) => (
            <MappingTab
                selectedFileType={'unsupported' as any}
                isPending={false}
                form={form}
                router={{ refresh: vi.fn() }}
            />
        ), 'mapping');

        expect(screen.queryByRole('button', { name: /Add Visualizations/i })).not.toBeInTheDocument();
        unknownRender.unmount();

        renderInTabsWithForm((form) => (
            <MappingTab
                selectedFileType={''}
                isPending={false}
                form={form}
                router={{ refresh: vi.fn() }}
            />
        ), 'mapping');
        expect(screen.queryByRole('button', { name: /Add Visualizations/i })).not.toBeInTheDocument();
    });

    it('renders pending spinner for xml and excel mapping submit buttons', () => {
        const xmlRender = renderInTabsWithForm((form) => (
            <MappingTab
                selectedFileType={FileTypes.FileType.XML}
                isPending={true}
                form={form}
                router={{ refresh: vi.fn() }}
            />
        ), 'mapping');

        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
        xmlRender.unmount();

        renderInTabsWithForm((form) => (
            <MappingTab
                selectedFileType={FileTypes.FileType.EXCEL}
                isPending={true}
                form={form}
                router={{ refresh: vi.fn() }}
            />
        ), 'mapping');
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders excel/csv mapping tab branches for each visualization type', () => {
        const typesToMarker: Array<[VisualizationTypes.VisualizationTypesEnum, string]> = [
            [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD, 'Names:'],
            [VisualizationTypes.VisualizationTypesEnum.FORCE_DIRECTED_GRAPH, 'Nodes:'],
            [VisualizationTypes.VisualizationTypesEnum.CALENDAR, 'Dates:'],
            [VisualizationTypes.VisualizationTypesEnum.BAR_CHART, 'Data:'],
            [VisualizationTypes.VisualizationTypesEnum.PIE_CHART, 'Values:'],
            [VisualizationTypes.VisualizationTypesEnum.SCATTER, 'Values:'],
            [VisualizationTypes.VisualizationTypesEnum.TREEMAP, 'Children:']
        ];

        for (const [type, marker] of typesToMarker) {
            const renderResult = renderWithForm((form) => (
                <ExcelOrCsvMappingTab
                    form={form}
                    router={{ refresh: vi.fn() }}
                    fileDetails={false}
                    selectedFileType={FileTypes.FileType.EXCEL}
                />
            ), { type, sheets: '1' });

            expect(screen.getByText(marker)).toBeInTheDocument();
            renderResult.unmount();
        }

        renderWithForm((form) => (
            <ExcelOrCsvMappingTab
                form={form}
                router={{ refresh: vi.fn() }}
                fileDetails={true}
                selectedFileType={FileTypes.FileType.CSV}
            />
        ), { type: VisualizationTypes.VisualizationTypesEnum.TIMELINE, separator: ',' });

        expect(screen.getByText('Visualization Name:')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Separator')).toBeInTheDocument();
    });

    it('renders type tab branches for json/csv/excel/xml file upload and handles file type change', async () => {
        const user = userEvent.setup();
        const fileTypeChanges = vi.fn();
        const files: any[] = [{ id: '1', name: 'demo', size: 1, type: 'text/plain' }];

        const jsonRender = renderInTabsWithForm((form) => (
            <TypeTab
                form={form}
                handleFileTypeChange={fileTypeChanges}
                selectedFileType={FileTypes.FileType.JSON}
                files={files}
                updateFiles={vi.fn()}
                removeFile={vi.fn()}
            />
        ), 'type', { fileType: FileTypes.FileType.JSON });

        expect(screen.getByTestId('dropzone')).toBeInTheDocument();
        jsonRender.unmount();

        const excelRender = renderInTabsWithForm((form) => (
            <TypeTab
                form={form}
                handleFileTypeChange={fileTypeChanges}
                selectedFileType={FileTypes.FileType.EXCEL}
                files={files}
                updateFiles={vi.fn()}
                removeFile={vi.fn()}
            />
        ), 'type', { fileType: FileTypes.FileType.EXCEL });
        excelRender.unmount();

        const csvRender = renderInTabsWithForm((form) => (
            <TypeTab
                form={form}
                handleFileTypeChange={fileTypeChanges}
                selectedFileType={FileTypes.FileType.CSV}
                files={files}
                updateFiles={vi.fn()}
                removeFile={vi.fn()}
            />
        ), 'type', { fileType: FileTypes.FileType.CSV });
        csvRender.unmount();

        renderInTabsWithForm((form) => (
            <TypeTab
                form={form}
                handleFileTypeChange={fileTypeChanges}
                selectedFileType={FileTypes.FileType.XML}
                files={files}
                updateFiles={vi.fn()}
                removeFile={vi.fn()}
            />
        ), 'type', { fileType: FileTypes.FileType.XML });

        await user.click(screen.getByRole('combobox'));
        await user.click(screen.getByText(FileTypes.FileType.CSV));
        expect(fileTypeChanges).toHaveBeenCalledWith(FileTypes.FileType.CSV);
    });

    it('renders no formatter for empty or unsupported type tab file type', () => {
        const fileTypeChanges = vi.fn();
        const baseProps = {
            handleFileTypeChange: fileTypeChanges,
            files: [],
            updateFiles: vi.fn(),
            removeFile: vi.fn()
        };

        const unsupported = renderInTabsWithForm((form) => (
            <TypeTab
                form={form}
                selectedFileType={'unsupported'}
                {...baseProps}
            />
        ), 'type', { fileType: 'unsupported' });

        expect(screen.queryByTestId('dropzone')).not.toBeInTheDocument();
        unsupported.unmount();

        renderInTabsWithForm((form) => (
            <TypeTab
                form={form}
                selectedFileType={''}
                {...baseProps}
            />
        ), 'type', { fileType: '' });
        expect(screen.queryByTestId('dropzone')).not.toBeInTheDocument();
    });
});
