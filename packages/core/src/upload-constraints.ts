import path from 'path';
import { IllustryError } from './errors';

type UploadKind = 'visualization-source' | 'export-template';

type UploadConstraint = {
  maxBytes: number;
  extensions: string[];
  mimeTypes: string[];
  accept: string;
};

type UploadedFileMetadata = {
  originalname?: string;
  name?: string;
  mimetype?: string;
  type?: string;
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
    ],
    accept: '.json,.xml,.csv,.xlsx,application/json,text/xml,application/xml,text/csv,application/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
    ],
    accept: '.xlsx,.pdf,.docx,.pptx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation'
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
  const filename = file.originalname || file.name || '';
  const extension = getFileExtension(filename);
  const mimetype = file.mimetype || file.type || '';

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

const assertUploadedFileMetadata = (file: UploadedFileMetadata, kind: UploadKind) => {
  const validation = validateUploadedFileMetadata(file, kind);
  if (!validation.valid) {
    throw new IllustryError(validation.message, {
      code: 'ILLUSTRY_FILE_REJECTED',
      status: 400,
      details: { kind, file }
    });
  }
};

export {
  MB,
  UPLOAD_CONSTRAINTS,
  assertUploadedFileMetadata,
  formatUploadBytes,
  getFileExtension,
  validateUploadedFileMetadata
};
export type {
  UploadConstraint,
  UploadKind,
  UploadedFileMetadata
};
