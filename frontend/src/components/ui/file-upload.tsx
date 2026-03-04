/* eslint-disable no-unused-vars */
import { Dropzone, FileMosaic, ExtFile } from '@files-ui/react';
import React from 'react';

type FileUploadProps = {
  acceptedFiles: ExtFile[];
  updateFiles: (incomingFiles: ExtFile[]) => void;
  removeFile: (id: string | number | undefined) => void;
  fileFormat: string
}

const FileUpload = ({
  acceptedFiles,
  updateFiles,
  removeFile,
  fileFormat
}: FileUploadProps) => (
    <>
      <Dropzone
        onChange={updateFiles}
        value={acceptedFiles}
        accept= {fileFormat}
      >
        {acceptedFiles.map((file: ExtFile) => (
          <FileMosaic key={file.id} {...file} onDelete={removeFile} info />
        ))}
      </Dropzone>
    </>
);

export default FileUpload;
