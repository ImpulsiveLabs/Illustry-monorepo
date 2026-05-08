const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const MAX_TEXT_SEARCH_LENGTH = 64;

type SortInput = {
  element?: string;
  sortOrder?: number | string;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSafeTextRegex = (value: unknown): RegExp | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().slice(0, MAX_TEXT_SEARCH_LENGTH);
  if (normalized.length === 0) {
    return undefined;
  }

  return new RegExp(escapeRegExp(normalized), 'i');
};

const getPerPage = (value: unknown): number => {
  const parsed = Number(value);

  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
  }

  return DEFAULT_PAGE_SIZE;
};

const getSkip = (page: unknown, perPage: number): number => {
  const parsed = Number(page);

  if (Number.isFinite(parsed) && parsed >= 1) {
    return (Math.floor(parsed) - 1) * perPage;
  }

  return 0;
};

const getSafeSort = (
  sort: SortInput | undefined,
  allowedFields: ReadonlySet<string>,
  fallback: Record<string, 1 | -1> = { name: 1 }
): Record<string, 1 | -1> => {
  if (!sort?.element || allowedFields.has(sort.element) === false) {
    return fallback;
  }

  return { [sort.element]: sort.sortOrder === -1 ? -1 : 1 };
};

const getPageCount = (count: number, perPage: number): number => (
  count > 0 ? count / perPage : 1
);

export {
  DEFAULT_PAGE_SIZE,
  buildSafeTextRegex,
  getPageCount,
  getPerPage,
  getSafeSort,
  getSkip
};
