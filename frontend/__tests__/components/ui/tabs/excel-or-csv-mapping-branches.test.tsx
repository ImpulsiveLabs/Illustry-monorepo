import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { FileTypes, VisualizationTypes } from '@illustry/types';
import { Form } from '@/components/ui/form';
import ExcelOrCsvMappingTab from '@/components/ui/tabs/mappingTab/excelOrCsvMappingTab';

const renderWithForm = (defaultValues: Record<string, unknown>, selectedFileType: FileTypes.FileType, fileDetails: boolean) => {
  const router = { refresh: vi.fn() };

  const Harness = () => {
    const form = useForm<any>({ defaultValues });
    const [snapshot, setSnapshot] = React.useState('');
    return (
      <Form {...form}>
        <ExcelOrCsvMappingTab
          form={form}
          router={router}
          fileDetails={fileDetails}
          selectedFileType={selectedFileType}
        />
        <button type="button" onClick={() => setSnapshot(JSON.stringify(form.getValues()))}>take-snapshot</button>
        <div data-testid="snapshot">{snapshot}</div>
      </Form>
    );
  };

  return render(<Harness />);
};

afterEach(() => {
  vi.useRealTimers();
});

describe('ExcelOrCsvMappingTab branches', () => {
  it('renders grouped node-link mappings for sankey and hierarchical-edge-bundling', () => {
    const sankey = renderWithForm({ type: VisualizationTypes.VisualizationTypesEnum.SANKEY }, FileTypes.FileType.EXCEL, false);
    expect(screen.getByPlaceholderText('Column number for Nodes')).toBeInTheDocument();
    sankey.unmount();

    renderWithForm({ type: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING }, FileTypes.FileType.EXCEL, false);
    expect(screen.getByPlaceholderText('Column number for Targets')).toBeInTheDocument();
  });

  it('renders default mapping-only block when visualization type is not mapped', () => {
    renderWithForm({ type: VisualizationTypes.VisualizationTypesEnum.TIMELINE }, FileTypes.FileType.CSV, true);

    expect(screen.getByPlaceholderText('Column number for Visualization Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Column number for Visualization Description')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Column number for Visualization Tags')).toBeInTheDocument();
  });

  it('handles undefined type by rendering no specific mapping controls', () => {
    renderWithForm({ type: undefined }, FileTypes.FileType.CSV, false);

    expect(screen.queryByPlaceholderText('Column number for Names')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Column number for Nodes')).not.toBeInTheDocument();
  });

  it.each([
    [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD, 'Column number for Names'],
    [VisualizationTypes.VisualizationTypesEnum.CALENDAR, 'Column number for Dates'],
    [VisualizationTypes.VisualizationTypesEnum.BAR_CHART, 'Column number for Headers'],
    [VisualizationTypes.VisualizationTypesEnum.FUNNEL, 'Column numbers for Values'],
    [VisualizationTypes.VisualizationTypesEnum.SUNBURST, 'Column numbers for Children, coma separated']
  ])('hides visualization metadata mapping when fileDetails is false for %s', (type, markerPlaceholder) => {
    renderWithForm({ type }, FileTypes.FileType.CSV, false);

    expect(screen.getByPlaceholderText(markerPlaceholder)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Column number for Visualization Name')).not.toBeInTheDocument();
  });

  it.each([
    [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD, 'Column number for Values'],
    [VisualizationTypes.VisualizationTypesEnum.SANKEY, 'Column number for Nodes'],
    [VisualizationTypes.VisualizationTypesEnum.CALENDAR, 'Column number for Dates'],
    [VisualizationTypes.VisualizationTypesEnum.LINE_CHART, 'Column number for Headers'],
    [VisualizationTypes.VisualizationTypesEnum.PIE_CHART, 'Column numbers for Values'],
    [VisualizationTypes.VisualizationTypesEnum.TREEMAP, 'Column numbers for Children, coma separated']
  ])('shows visualization metadata mapping when fileDetails is true for %s', (type, markerPlaceholder) => {
    renderWithForm({ type }, FileTypes.FileType.CSV, true);

    expect(screen.getByPlaceholderText(markerPlaceholder)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Column number for Visualization Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Column number for Visualization Description')).toBeInTheDocument();
  });

  it('updates sheets/separator and includeHeaders via form state', () => {
    vi.useFakeTimers();

    const excel = renderWithForm(
      { type: VisualizationTypes.VisualizationTypesEnum.FUNNEL, sheets: '1', includeHeaders: false },
      FileTypes.FileType.EXCEL,
      false
    );

    const sheetsInput = screen.getByPlaceholderText('How many sheets to include');
    fireEvent.change(sheetsInput, { target: { value: '3' } });
    fireEvent.click(screen.getByRole('checkbox'));

    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByRole('button', { name: 'take-snapshot' }));
    expect(screen.getByTestId('snapshot').textContent).toContain('"sheets":"3"');
    expect(screen.getByTestId('snapshot').textContent).toContain('"includeHeaders":true');

    excel.unmount();

    const csv = renderWithForm(
      { type: VisualizationTypes.VisualizationTypesEnum.FUNNEL, separator: ',' },
      FileTypes.FileType.CSV,
      false
    );

    const separatorInput = screen.getByPlaceholderText('Separator');
    fireEvent.change(separatorInput, { target: { value: ';' } });

    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByRole('button', { name: 'take-snapshot' }));
    expect(screen.getByTestId('snapshot').textContent).toContain('"separator":";"');
    csv.unmount();
  });

  it('updates visualization metadata mapping inputs when file details are enabled', () => {
    vi.useFakeTimers();
    renderWithForm(
      { type: VisualizationTypes.VisualizationTypesEnum.SCATTER, mapping: {} },
      FileTypes.FileType.CSV,
      true
    );

    fireEvent.change(
      screen.getByPlaceholderText('Column number for Visualization Name'),
      { target: { value: '7' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Column number for Visualization Description'),
      { target: { value: '8' } }
    );
    fireEvent.change(
      screen.getByPlaceholderText('Column number for Visualization Tags'),
      { target: { value: '9' } }
    );

    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByRole('button', { name: 'take-snapshot' }));
    const snapshot = screen.getByTestId('snapshot').textContent || '';
    expect(snapshot).toContain('"visualizationName":"7"');
    expect(snapshot).toContain('"visualizationDescription":"8"');
    expect(snapshot).toContain('"visualizationTags":"9"');
  });
});
