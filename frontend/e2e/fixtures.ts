import fs from 'node:fs/promises';
import path from 'node:path';
import { createCoverageMap } from 'istanbul-lib-coverage';
import {
  expect,
  test as base
} from '@playwright/test';
import type { BrowserContext } from '@playwright/test';

const E2E_COVERAGE_ENABLED = process.env.PW_E2E_COVERAGE === '1';
const COVERAGE_STORAGE_KEY = '__pw_e2e_coverage__';

const sanitizeFileName = (value: string) => value
  .replace(/[^a-zA-Z0-9-_]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/(^-|-$)/g, '')
  .slice(0, 120);

const persistCoverageAcrossNavigations = async (context: BrowserContext) => {
  await context.addInitScript(({ coverageStorageKey }) => {
    const win = window as unknown as { __coverage__?: Record<string, unknown> };
    try {
      const persisted = sessionStorage.getItem(coverageStorageKey);
      if (persisted) {
        win.__coverage__ = JSON.parse(persisted) as Record<string, unknown>;
      }
    } catch {
      // Ignore parse/storage errors.
    }

    window.addEventListener('beforeunload', () => {
      try {
        if (win.__coverage__) {
          sessionStorage.setItem(coverageStorageKey, JSON.stringify(win.__coverage__));
        }
      } catch {
        // Ignore storage quota/access errors.
      }
    });
  }, { coverageStorageKey: COVERAGE_STORAGE_KEY });
};

const writeCoverageForTest = async (context: BrowserContext, testInfoTitle: string, retry: number, projectName: string) => {
  const coverageMap = createCoverageMap({});
  const pages = context.pages();

  await Promise.all(pages.map(async (page) => {
    const pageCoverage = await page
      .evaluate(() => (window as unknown as { __coverage__?: unknown }).__coverage__ ?? null)
      .catch(() => null);

    if (pageCoverage && typeof pageCoverage === 'object' && Object.keys(pageCoverage).length > 0) {
      coverageMap.merge(pageCoverage as Record<string, unknown>);
    }
  }));

  if (coverageMap.files().length === 0) {
    return;
  }

  const outputDir = path.resolve(process.cwd(), '.nyc_output');
  await fs.mkdir(outputDir, { recursive: true });

  const baseName = sanitizeFileName(`${projectName}-${testInfoTitle}-retry-${retry}`);
  const filePath = path.join(outputDir, `${baseName}-${Date.now()}.json`);
  await fs.writeFile(filePath, JSON.stringify(coverageMap.toJSON()), 'utf8');
};

const test = base.extend({
  context: async ({ context, browserName }, use, testInfo) => {
    const shouldCollectCoverage = E2E_COVERAGE_ENABLED && browserName === 'chromium';

    if (shouldCollectCoverage) {
      await persistCoverageAcrossNavigations(context);
    }

    await use(context);

    if (shouldCollectCoverage) {
      await writeCoverageForTest(context, testInfo.title, testInfo.retry, testInfo.project.name);
    }
  }
});

export { test, expect };
export * from '@playwright/test';
