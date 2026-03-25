import { defineConfig, devices } from '@playwright/test';

const backendPort = process.env.E2E_BACKEND_PORT || '7011';
const frontendPort = process.env.E2E_FRONTEND_PORT || '3100';
const backendBaseURL = `http://127.0.0.1:${backendPort}`;
const frontendBaseURL = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: frontendBaseURL,
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
      reuseExistingServer: false,
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
      command: `yarn start:dev --port ${frontendPort}`,
      url: frontendBaseURL,
      reuseExistingServer: false,
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
