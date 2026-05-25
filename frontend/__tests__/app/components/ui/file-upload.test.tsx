import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUpload from '@/components/ui/file-upload';
import React from 'react';

vi.mock('@files-ui/react', () => {
  return {
    Dropzone: ({ accept, disabled, label, maxFileSize, maxFiles, children }: any) => (
      <div
        aria-disabled={disabled}
        data-accept={accept}
        data-max-file-size={maxFileSize}
        data-max-files={maxFiles}
        data-testid="dropzone"
      >
        <p>{label}</p>
        {children}
      </div>
    ),
    FileMosaic: ({ name, onDelete, id }: any) => (
      <div>
        <span>{name}</span>
        <button onClick={() => onDelete(id)}>Delete</button>
      </div>
    ),
  };
});

describe('FileUpload', () => {
  const mockFile = {
    id: 'file-1',
    name: 'test.txt',
    size: 1024,
    type: 'text/plain',
  };

  const acceptedFiles = [mockFile];
  const updateFiles = vi.fn();
  const removeFile = vi.fn();
  const fileFormat = '.txt';

  it('renders the dropzone and file mosaic components', () => {
    render(
      <FileUpload
        acceptedFiles={acceptedFiles}
        updateFiles={updateFiles}
        removeFile={removeFile}
        fileFormat={fileFormat}
      />
    );

    expect(screen.getByText('Drag files here or click to browse')).toBeInTheDocument();
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('Accepted: .txt')).toBeInTheDocument();
  });

  it('calls removeFile when delete is triggered on FileMosaic', () => {
    render(
      <FileUpload
        acceptedFiles={acceptedFiles}
        updateFiles={updateFiles}
        removeFile={removeFile}
        fileFormat={fileFormat}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(removeFile).toHaveBeenCalledWith('file-1');
  });

  it('renders empty-state helper text with limits and one-file messaging', () => {
    render(
      <FileUpload
        acceptedFiles={[]}
        updateFiles={updateFiles}
        removeFile={removeFile}
        fileFormat=".csv, text/csv"
        maxFiles={1}
        maxFileSize={1024 * 1024}
      />
    );

    expect(screen.getByText('Drop files here')).toBeInTheDocument();
    expect(screen.getByText('Accepted: .csv - Max 1 MB - One file only')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toHaveAttribute('data-max-files', '1');
  });

  it('renders custom labels, error feedback, and disabled state', () => {
    render(
      <FileUpload
        acceptedFiles={[]}
        updateFiles={updateFiles}
        removeFile={removeFile}
        fileFormat=".xlsx"
        label="Drop workbook"
        helperText="Only one spreadsheet"
        error="Workbook is too large"
        disabled
      />
    );

    expect(screen.getAllByText('Drop workbook')).toHaveLength(2);
    expect(screen.getByText('Only one spreadsheet')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Workbook is too large');
    expect(screen.getByTestId('dropzone')).toHaveAttribute('aria-disabled', 'true');
  });

  it('falls back to the raw accept string when no extension is present', () => {
    render(
      <FileUpload
        acceptedFiles={[]}
        updateFiles={updateFiles}
        removeFile={removeFile}
        fileFormat="application/json"
      />
    );

    expect(screen.getByText('Accepted: application/json')).toBeInTheDocument();
  });
});
