import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExcelOrCsvAxisChartMapping from '@/components/ui/tabs/mappingTab/excelOrCsvMappings/AxisChartMapping';
import ExcelOrCsvCalendarMapping from '@/components/ui/tabs/mappingTab/excelOrCsvMappings/CalendarMapping';
import ExcelOrCsvHierarchyMapping from '@/components/ui/tabs/mappingTab/excelOrCsvMappings/HierarchyMapping';
import ExcelOrCsvNodeLinkMapping from '@/components/ui/tabs/mappingTab/excelOrCsvMappings/NodeLinkMapping';
import ExcelOrCsvPieChartFunnelMapping from '@/components/ui/tabs/mappingTab/excelOrCsvMappings/PieChartFunnelMapping';
import ExcelOrCsvScatterMapping from '@/components/ui/tabs/mappingTab/excelOrCsvMappings/ScatterMapping';
import ExcelOrCsvWordCloudMapping from '@/components/ui/tabs/mappingTab/excelOrCsvMappings/WordCloudMapping';

const createForm = () => ({
    getValues: vi.fn(() => ''),
    setValue: vi.fn()
});

afterEach(() => {
    vi.useRealTimers();
});

describe('excel/csv mapping subcomponents', () => {
    it('updates axis chart mapping keys', () => {
        vi.useFakeTimers();
        const form = createForm();
        render(<ExcelOrCsvAxisChartMapping form={form as any} />);

        fireEvent.change(screen.getByPlaceholderText('Column numbers, comma separated'), { target: { value: '1,2' } });
        vi.runAllTimers();
        fireEvent.change(screen.getByPlaceholderText('Column number'), { target: { value: '3' } });

        expect(form.setValue).toHaveBeenCalledWith('mapping.data', '1,2');
        expect(form.setValue).toHaveBeenCalledWith('mapping.headers', '3');
    });

    it('updates calendar mapping keys', () => {
        vi.useFakeTimers();
        const form = createForm();
        render(<ExcelOrCsvCalendarMapping form={form as any} />);

        const inputs = screen.getAllByPlaceholderText('Column number');
        fireEvent.change(inputs[0] as HTMLElement, { target: { value: '1' } });
        fireEvent.change(inputs[1] as HTMLElement, { target: { value: '2' } });
        fireEvent.change(inputs[2] as HTMLElement, { target: { value: '3' } });
        fireEvent.change(inputs[3] as HTMLElement, { target: { value: '4' } });
        vi.runAllTimers();

        expect(form.setValue).toHaveBeenCalledWith('mapping.dates', '1');
        expect(form.setValue).toHaveBeenCalledWith('mapping.values', '2');
        expect(form.setValue).toHaveBeenCalledWith('mapping.categories', '3');
        expect(form.setValue).toHaveBeenCalledWith('mapping.properties', '4');
    });

    it('updates hierarchy mapping keys', () => {
        vi.useFakeTimers();
        const form = createForm();
        render(<ExcelOrCsvHierarchyMapping form={form as any} />);

        const singleColumnInputs = screen.getAllByPlaceholderText('Column number');
        fireEvent.change(singleColumnInputs[0] as HTMLElement, { target: { value: '1' } });
        fireEvent.change(singleColumnInputs[1] as HTMLElement, { target: { value: '2' } });
        fireEvent.change(singleColumnInputs[2] as HTMLElement, { target: { value: '3' } });
        fireEvent.change(singleColumnInputs[3] as HTMLElement, { target: { value: '4' } });
        fireEvent.change(screen.getByPlaceholderText('Column numbers, comma separated'), { target: { value: '5,6' } });
        vi.runAllTimers();

        expect(form.setValue).toHaveBeenCalledWith('mapping.names', '1');
        expect(form.setValue).toHaveBeenCalledWith('mapping.values', '2');
        expect(form.setValue).toHaveBeenCalledWith('mapping.categories', '3');
        expect(form.setValue).toHaveBeenCalledWith('mapping.properties', '4');
        expect(form.setValue).toHaveBeenCalledWith('mapping.children', '5,6');
    });

    it('updates node link mapping keys', () => {
        vi.useFakeTimers();
        const form = createForm();
        render(<ExcelOrCsvNodeLinkMapping form={form as any} />);

        const inputs = screen.getAllByPlaceholderText('Column number');
        fireEvent.change(inputs[0] as HTMLElement, { target: { value: '1' } });
        fireEvent.change(inputs[1] as HTMLElement, { target: { value: '2' } });
        fireEvent.change(inputs[2] as HTMLElement, { target: { value: '3' } });
        fireEvent.change(inputs[3] as HTMLElement, { target: { value: '4' } });
        fireEvent.change(inputs[4] as HTMLElement, { target: { value: '5' } });
        fireEvent.change(inputs[5] as HTMLElement, { target: { value: '6' } });
        vi.runAllTimers();

        expect(form.setValue).toHaveBeenCalledWith('mapping.categories', '1');
        expect(form.setValue).toHaveBeenCalledWith('mapping.nodes', '2');
        expect(form.setValue).toHaveBeenCalledWith('mapping.properties', '3');
        expect(form.setValue).toHaveBeenCalledWith('mapping.sources', '4');
        expect(form.setValue).toHaveBeenCalledWith('mapping.targets', '5');
        expect(form.setValue).toHaveBeenCalledWith('mapping.values', '6');
    });

    it('updates pie/funnel mapping keys', () => {
        vi.useFakeTimers();
        const form = createForm();
        render(<ExcelOrCsvPieChartFunnelMapping form={form as any} />);

        const inputs = screen.getAllByPlaceholderText('Column numbers, comma separated');
        fireEvent.change(inputs[0] as HTMLElement, { target: { value: '1' } });
        fireEvent.change(inputs[1] as HTMLElement, { target: { value: '2' } });
        vi.runAllTimers();

        expect(form.setValue).toHaveBeenCalledWith('mapping.names', '1');
        expect(form.setValue).toHaveBeenCalledWith('mapping.values', '2');
    });

    it('updates scatter mapping keys', () => {
        vi.useFakeTimers();
        const form = createForm();
        render(<ExcelOrCsvScatterMapping form={form as any} />);

        const singleColumnInputs = screen.getAllByPlaceholderText('Column number');
        fireEvent.change(singleColumnInputs[0] as HTMLElement, { target: { value: '1' } });
        fireEvent.change(screen.getByPlaceholderText('Column numbers, comma separated'), { target: { value: '2,3' } });
        fireEvent.change(singleColumnInputs[1] as HTMLElement, { target: { value: '4' } });
        vi.runAllTimers();

        expect(form.setValue).toHaveBeenCalledWith('mapping.categories', '1');
        expect(form.setValue).toHaveBeenCalledWith('mapping.values', '2,3');
        expect(form.setValue).toHaveBeenCalledWith('mapping.properties', '4');
    });

    it('updates word cloud mapping keys', () => {
        vi.useFakeTimers();
        const form = createForm();
        render(<ExcelOrCsvWordCloudMapping form={form as any} />);

        const inputs = screen.getAllByPlaceholderText('Column number');
        fireEvent.change(inputs[0] as HTMLElement, { target: { value: '1' } });
        fireEvent.change(inputs[1] as HTMLElement, { target: { value: '2' } });
        fireEvent.change(inputs[2] as HTMLElement, { target: { value: '3' } });
        vi.runAllTimers();

        expect(form.setValue).toHaveBeenCalledWith('mapping.names', '1');
        expect(form.setValue).toHaveBeenCalledWith('mapping.values', '2');
        expect(form.setValue).toHaveBeenCalledWith('mapping.properties', '3');
    });
});
