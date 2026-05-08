#!/usr/bin/env node
/* eslint-disable no-console */
const { performance } = require('perf_hooks');

const baseUrl = (process.env.API_LATENCY_BASE_URL || 'http://127.0.0.1:7010').replace(/\/$/, '');
const budgetMs = Number(process.env.API_LATENCY_BUDGET_MS || process.env.REQUEST_LATENCY_BUDGET_MS || 300);
const iterations = Math.max(1, Number(process.env.API_LATENCY_ITERATIONS || 3));

const requests = [
  {
    name: 'health',
    method: 'GET',
    path: '/api/health'
  },
  {
    name: 'projects browse',
    method: 'POST',
    path: '/api/projects',
    body: { page: 1, per_page: 1 }
  },
  {
    name: 'visualizations browse',
    method: 'POST',
    path: '/api/visualizations',
    body: { page: 1, per_page: 1 }
  },
  {
    name: 'dashboards browse',
    method: 'POST',
    path: '/api/dashboards',
    body: { page: 1, per_page: 1 }
  }
];

const timedFetch = async (request) => {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${request.path}`, {
    method: request.method,
    headers: request.body ? { 'Content-Type': 'application/json' } : undefined,
    body: request.body ? JSON.stringify(request.body) : undefined
  });
  await response.text();

  return {
    ...request,
    status: response.status,
    durationMs: performance.now() - startedAt
  };
};

const main = async () => {
  if (!Number.isFinite(budgetMs) || budgetMs <= 0) {
    throw new Error(`Invalid API latency budget: ${budgetMs}`);
  }

  const results = [];
  for (let iteration = 1; iteration <= iterations; iteration += 1) {
    for (const request of requests) {
      results.push({
        iteration,
        ...(await timedFetch(request))
      });
    }
  }

  const slow = results.filter((result) => result.durationMs > budgetMs);
  const failed = results.filter((result) => result.status >= 500);

  console.log(`API latency check: ${baseUrl}, budget ${budgetMs}ms, iterations ${iterations}`);
  results.forEach((result) => {
    console.log(
      `${result.durationMs > budgetMs ? 'FAIL' : 'PASS'} ${result.name} #${result.iteration}: `
      + `${result.durationMs.toFixed(1)}ms status=${result.status}`
    );
  });

  if (failed.length > 0) {
    throw new Error(`${failed.length} request(s) returned 5xx`);
  }

  if (slow.length > 0) {
    throw new Error(`${slow.length} request(s) exceeded ${budgetMs}ms`);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
