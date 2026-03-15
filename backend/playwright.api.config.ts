import { defineConfig } from '@playwright/test';

const port = process.env.ILLUSTRY_PORT || '7010';
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e-api',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL
  },
  webServer: {
    command: 'yarn start:dev',
    port: +port,
    timeout: 180000,
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test',
      ILLUSTRY_PORT: port,
      MONGO_TEST_URL: process.env.MONGO_TEST_URL || 'mongodb://127.0.0.1:27017/illustrytest',
      MONGO_USER: process.env.MONGO_USER || 'root',
      MONGO_PASSWORD: process.env.MONGO_PASSWORD || 'rootPass'
    }
  }
});
