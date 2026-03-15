import { defineConfig, devices } from '@playwright/test';

const backendPort = process.env.E2E_BACKEND_PORT || '7011';
const backendBaseURL = `http://127.0.0.1:${backendPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: [
    {
      command: 'cd .. && yarn workspace @impulsivelabs/illustry-server start:dev',
      port: +backendPort,
      reuseExistingServer: !process.env.CI,
      timeout: 240000,
      env: {
        NODE_ENV: 'test',
        ILLUSTRY_PORT: backendPort,
        MONGO_TEST_URL: process.env.MONGO_TEST_URL || 'mongodb://127.0.0.1:27017/illustrytest',
        MONGO_USER: process.env.MONGO_USER || 'root',
        MONGO_PASSWORD: process.env.MONGO_PASSWORD || 'rootPass'
      }
    },
    {
      command: 'yarn start:dev --port 3000',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        BACKEND_INTERNAL_URL: backendBaseURL,
        NEXT_PUBLIC_BACKEND_PUBLIC_URL: backendBaseURL,
        E2E_COVERAGE: process.env.E2E_COVERAGE || '0',
        BABEL_ENV: process.env.BABEL_ENV || ''
      }
    }
  ]
});
