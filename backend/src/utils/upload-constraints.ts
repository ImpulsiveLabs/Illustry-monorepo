import path from 'path';

type UploadKind = 'visualization-source' | 'export-template';

type UploadConstraint = {
  maxBytes: number;
  extensions: string[];
  mimeTypes: string[];
};

type UploadedFileMetadata = {
  originalname?: string;
  mimetype?: string;
  size?: number;
};

const MB = 1024 * 1024;

const UPLOAD_CONSTRAINTS: Record<UploadKind, UploadConstraint> = {
  'visualization-source': {
    maxBytes: 100 * MB,
    extensions: ['.json', '.xml', '.csv', '.xlsx'],
    mimeTypes: [
      'application/json',
      'text/xml',
      'application/xml',
      'text/csv',
      'application/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream'
    ]
  },
  'export-template': {
    maxBytes: 100 * MB,
    extensions: ['.xlsx', '.pdf', '.docx', '.pptx'],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream'
    ]
  }
};

const getFileExtension = (filename?: string) => path.extname(filename || '').toLowerCase();

const formatUploadBytes = (bytes: number) => {
  if (bytes >= MB) {
    return `${Math.round(bytes / MB)} MB`;
  }

  return `${bytes} bytes`;
};

const validateUploadedFileMetadata = (
  file: UploadedFileMetadata,
  kind: UploadKind
): { valid: true } | { valid: false; message: string } => {
  const constraint = UPLOAD_CONSTRAINTS[kind];
  const extension = getFileExtension(file.originalname);
  const mimetype = file.mimetype || '';

  if (typeof file.size === 'number' && file.size > constraint.maxBytes) {
    return {
      valid: false,
      message: `The file is too large. Maximum size is ${formatUploadBytes(constraint.maxBytes)}.`
    };
  }

  if (!constraint.extensions.includes(extension)) {
    return {
      valid: false,
      message: `Unsupported file type. Accepted files: ${constraint.extensions.join(', ')}.`
    };
  }

  if (mimetype && !constraint.mimeTypes.includes(mimetype)) {
    return {
      valid: false,
      message: `Unsupported file content type. Accepted files: ${constraint.extensions.join(', ')}.`
    };
  }

  return { valid: true };
};

const createMulterFileFilter = (kind: UploadKind) => (
  _request: unknown,
  file: UploadedFileMetadata,
  callback: (error: Error | null, acceptFile?: boolean) => void
) => {
  const validation = validateUploadedFileMetadata(file, kind);
  if (!validation.valid) {
    callback(new Error(validation.message));
    return;
  }

  callback(null, true);
};

export {
  UPLOAD_CONSTRAINTS,
  createMulterFileFilter,
  formatUploadBytes,
  validateUploadedFileMetadata
};
export type {
  UploadKind,
  UploadedFileMetadata
};
