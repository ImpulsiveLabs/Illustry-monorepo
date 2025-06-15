import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUpload from '@/components/ui/file-upload';
import React from 'react';

vi.mock('@files-ui/react', () => {
  return {
    Dropzone: ({ onChange, children }: any) => (
      <div>
        <p>Drag your files here or click in this area.</p>
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

    expect(screen.getByText('Drag your files here or click in this area.')).toBeInTheDocument();
    expect(screen.getByText('test.txt')).toBeInTheDocument();
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
});
