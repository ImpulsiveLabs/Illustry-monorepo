import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExcelExportDialog from '@/components/export/excel-export-dialog';

describe('ExcelExportDialog', () => {
  it('submits workbook placement values from the modal', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ExcelExportDialog
        open
        title="Export as Excel"
        description="Place the visualization in a workbook."
        defaultSheetName="Visualization"
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    );

    await user.clear(screen.getByLabelText('Sheet'));
    await user.type(screen.getByLabelText('Sheet'), 'Report');
    await user.clear(screen.getByLabelText('Width columns'));
    await user.type(screen.getByLabelText('Width columns'), '14');
    await user.clear(screen.getByLabelText('Height rows'));
    await user.type(screen.getByLabelText('Height rows'), '22');
    await user.click(screen.getByRole('button', { name: 'Export workbook' }));

    expect(onSubmit).toHaveBeenCalledWith({
      sheetName: 'Report',
      widthColumns: 14,
      heightRows: 22
    });
  });

  it('falls back to safe defaults and can be cancelled', async () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ExcelExportDialog
        open
        title="Export as Excel"
        description="Place the visualization in a workbook."
        defaultSheetName="Visualization"
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    );

    fireEvent.change(screen.getByLabelText('Sheet'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Width columns'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText('Height rows'), { target: { value: 'not-a-number' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export workbook' }));

    expect(onSubmit).toHaveBeenCalledWith({
      sheetName: 'Visualization',
      widthColumns: 8,
      heightRows: 12
    });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables actions while export is pending', () => {
    render(
      <ExcelExportDialog
        open
        pending
        title="Export as Excel"
        description="Place the visualization in a workbook."
        defaultSheetName="Visualization"
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Exporting' })).toBeDisabled();
  });
});
