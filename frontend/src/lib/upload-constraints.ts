type UploadKind = 'visualization-source' | 'export-template';

type UploadConstraint = {
  maxBytes: number;
  extensions: string[];
  accept: string;
};

const MB = 1024 * 1024;

const UPLOAD_CONSTRAINTS: Record<UploadKind, UploadConstraint> = {
  'visualization-source': {
    maxBytes: 100 * MB,
    extensions: ['.json', '.xml', '.csv', '.xlsx'],
    accept: '.json,.xml,.csv,.xlsx,application/json,text/xml,application/xml,text/csv,application/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  'export-template': {
    maxBytes: 100 * MB,
    extensions: ['.xlsx', '.pdf', '.docx', '.pptx'],
    accept: '.xlsx,.pdf,.docx,.pptx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
};

const formatUploadBytes = (bytes: number) => {
  if (bytes >= MB) {
    return `${Math.round(bytes / MB)} MB`;
  }
  return `${bytes} bytes`;
};

const getFileExtension = (filename: string) => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : '';
};

const validateBrowserFile = (file: File, kind: UploadKind) => {
  const constraint = UPLOAD_CONSTRAINTS[kind];
  if (file.size > constraint.maxBytes) {
    return `The file is too large. Maximum size is ${formatUploadBytes(constraint.maxBytes)}.`;
  }
  if (!constraint.extensions.includes(getFileExtension(file.name))) {
    return `Unsupported file type. Accepted files: ${constraint.extensions.join(', ')}.`;
  }
  return '';
};

export {
  UPLOAD_CONSTRAINTS,
  formatUploadBytes,
  validateBrowserFile
};
export type {
  UploadKind
};
