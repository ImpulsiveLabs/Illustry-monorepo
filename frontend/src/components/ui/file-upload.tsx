/* eslint-disable no-unused-vars */
import { Dropzone, FileMosaic, ExtFile } from '@files-ui/react';
import React from 'react';

type FileUploadProps = {
  acceptedFiles: ExtFile[];
  updateFiles: (incomingFiles: ExtFile[]) => void;
  removeFile: (id: string | number | undefined) => void;
  fileFormat: string;
  maxFiles?: number;
  label?: string;
  className?: string;
}

const FileUpload = ({
  acceptedFiles,
  updateFiles,
  removeFile,
  fileFormat,
  maxFiles,
  label,
  className
}: FileUploadProps) => (
    <div className={`rounded-2xl border border-dashed border-border/80 bg-background/55 p-3 shadow-sm transition-colors hover:border-primary/45 hover:bg-background/75 ${className || ''}`}>
      <Dropzone
        onChange={updateFiles}
        value={acceptedFiles}
        accept= {fileFormat}
        maxFiles={maxFiles}
        label={label}
      >
        {acceptedFiles.map((file: ExtFile) => (
          <FileMosaic key={file.id} {...file} onDelete={removeFile} info />
        ))}
      </Dropzone>
    </div>
);

export default FileUpload;
