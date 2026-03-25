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
    expect(screen.getByText('Nodes:')).toBeInTheDocument();
    sankey.unmount();

    renderWithForm({ type: VisualizationTypes.VisualizationTypesEnum.HIERARCHICAL_EDGE_BUNDLING }, FileTypes.FileType.EXCEL, false);
    expect(screen.getByText('Targets:')).toBeInTheDocument();
  });

  it('renders default mapping-only block when visualization type is not mapped', () => {
    renderWithForm({ type: VisualizationTypes.VisualizationTypesEnum.TIMELINE }, FileTypes.FileType.CSV, true);

    expect(screen.getByText('Visualization Name:')).toBeInTheDocument();
    expect(screen.getByText('Visualization Description:')).toBeInTheDocument();
    expect(screen.getByText('Visualization Tags:')).toBeInTheDocument();
  });

  it('handles undefined type by rendering no specific mapping controls', () => {
    renderWithForm({ type: undefined }, FileTypes.FileType.CSV, false);

    expect(screen.queryByPlaceholderText('Column number for Names')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Column number for Nodes')).not.toBeInTheDocument();
  });

  it.each([
    [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD, 'Names:'],
    [VisualizationTypes.VisualizationTypesEnum.CALENDAR, 'Dates:'],
    [VisualizationTypes.VisualizationTypesEnum.BAR_CHART, 'Headers:'],
    [VisualizationTypes.VisualizationTypesEnum.FUNNEL, 'Values:'],
    [VisualizationTypes.VisualizationTypesEnum.SUNBURST, 'Children:']
  ])('hides visualization metadata mapping when fileDetails is false for %s', (type, markerLabel) => {
    renderWithForm({ type }, FileTypes.FileType.CSV, false);

    expect(screen.getByText(markerLabel)).toBeInTheDocument();
    expect(screen.queryByText('Visualization Name:')).not.toBeInTheDocument();
  });

  it.each([
    [VisualizationTypes.VisualizationTypesEnum.WORD_CLOUD, 'Values:'],
    [VisualizationTypes.VisualizationTypesEnum.SANKEY, 'Nodes:'],
    [VisualizationTypes.VisualizationTypesEnum.CALENDAR, 'Dates:'],
    [VisualizationTypes.VisualizationTypesEnum.LINE_CHART, 'Headers:'],
    [VisualizationTypes.VisualizationTypesEnum.PIE_CHART, 'Values:'],
    [VisualizationTypes.VisualizationTypesEnum.TREEMAP, 'Children:']
  ])('shows visualization metadata mapping when fileDetails is true for %s', (type, markerLabel) => {
    renderWithForm({ type }, FileTypes.FileType.CSV, true);

    expect(screen.getByText(markerLabel)).toBeInTheDocument();
    expect(screen.getByText('Visualization Name:')).toBeInTheDocument();
    expect(screen.getByText('Visualization Description:')).toBeInTheDocument();
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

    const mappingRows = ['Visualization Name:', 'Visualization Description:', 'Visualization Tags:']
      .map((label) => screen.getByText(label).closest('div')?.parentElement as HTMLElement)
      .map((row) => row.querySelector('input') as HTMLInputElement);
    fireEvent.change(mappingRows[0] as HTMLInputElement, { target: { value: '7' } });
    fireEvent.change(mappingRows[1] as HTMLInputElement, { target: { value: '8' } });
    fireEvent.change(mappingRows[2] as HTMLInputElement, { target: { value: '9' } });

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
