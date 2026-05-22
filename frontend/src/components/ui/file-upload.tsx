/* eslint-disable no-unused-vars */
import { Dropzone, FileMosaic, ExtFile } from '@files-ui/react';
import React from 'react';
import Icons from '@/components/icons';
import { cn } from '@/lib/utils';
import { formatUploadBytes } from '@/lib/upload-constraints';

type FileUploadProps = {
  acceptedFiles: ExtFile[];
  updateFiles: (incomingFiles: ExtFile[]) => void;
  removeFile: (id: string | number | undefined) => void;
  fileFormat: string;
  maxFiles?: number;
  maxFileSize?: number;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const FileUpload = ({
  acceptedFiles,
  updateFiles,
  removeFile,
  fileFormat,
  maxFiles,
  maxFileSize,
  label,
  helperText,
  error,
  disabled,
  className
}: FileUploadProps) => {
  const computedHelper = helperText || [
    `Accepted: ${fileFormat.split(',').filter((item) => item.trim().startsWith('.')).join(', ') || fileFormat}`,
    maxFileSize ? `Max ${formatUploadBytes(maxFileSize)}` : undefined,
    maxFiles === 1 ? 'One file only' : undefined
  ].filter(Boolean).join(' - ');

  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 shadow-sm transition-all',
        'hover:border-primary/45 hover:bg-muted/35 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-ring/15',
        disabled && 'pointer-events-none opacity-60',
        error && 'border-destructive/60 bg-destructive/5',
        className
      )}
    >
      <Dropzone
        onChange={updateFiles}
        value={acceptedFiles}
        accept={fileFormat}
        maxFiles={maxFiles}
        maxFileSize={maxFileSize}
        label={label || 'Drag files here or click to browse'}
        disabled={disabled}
        footer={false}
        header={false}
        style={{
          border: '0',
          minHeight: acceptedFiles.length ? '96px' : '132px',
          background: 'transparent',
          borderRadius: '10px'
        }}
      >
        {!acceptedFiles.length && (
          <div className="flex flex-col items-center justify-center gap-2 px-3 py-4 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icons.upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{label || 'Drop files here'}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{computedHelper}</p>
            </div>
          </div>
        )}
        {acceptedFiles.map((file: ExtFile) => (
          <FileMosaic key={file.id} {...file} onDelete={removeFile} info />
        ))}
      </Dropzone>
      {acceptedFiles.length > 0 && (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{computedHelper}</p>
      )}
      {error && (
        <p className="mt-2 text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
