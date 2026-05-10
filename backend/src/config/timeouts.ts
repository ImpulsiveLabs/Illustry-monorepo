const DEFAULT_REQUEST_LATENCY_BUDGET_MS = 300;

const parsePositiveInteger = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);

  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }

  return fallback;
};

const getRequestLatencyBudgetMs = (): number => parsePositiveInteger(
  process.env.REQUEST_LATENCY_BUDGET_MS,
  DEFAULT_REQUEST_LATENCY_BUDGET_MS
);

const getMongoServerSelectionTimeoutMs = (): number => parsePositiveInteger(
  process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
  getRequestLatencyBudgetMs()
);

const getMongoConnectTimeoutMs = (): number => parsePositiveInteger(
  process.env.MONGO_CONNECT_TIMEOUT_MS,
  getRequestLatencyBudgetMs()
);

const getMongoSocketTimeoutMs = (): number => parsePositiveInteger(
  process.env.MONGO_SOCKET_TIMEOUT_MS,
  getRequestLatencyBudgetMs()
);

const getMongoQueryTimeoutMs = (): number => parsePositiveInteger(
  process.env.MONGO_QUERY_TIMEOUT_MS,
  Math.max(1, getRequestLatencyBudgetMs() - 50)
);

const getExternalHttpTimeoutMs = (): number => parsePositiveInteger(
  process.env.EXTERNAL_HTTP_TIMEOUT_MS,
  getRequestLatencyBudgetMs()
);

const getRedisConnectTimeoutMs = (): number => parsePositiveInteger(
  process.env.REDIS_CONNECT_TIMEOUT_MS,
  getRequestLatencyBudgetMs()
);

const getRedisSocketTimeoutMs = (): number => parsePositiveInteger(
  process.env.REDIS_SOCKET_TIMEOUT_MS,
  getRequestLatencyBudgetMs()
);

export {
  parsePositiveInteger,
  getRequestLatencyBudgetMs,
  getMongoServerSelectionTimeoutMs,
  getMongoConnectTimeoutMs,
  getMongoSocketTimeoutMs,
  getMongoQueryTimeoutMs,
  getExternalHttpTimeoutMs,
  getRedisConnectTimeoutMs,
  getRedisSocketTimeoutMs
};
