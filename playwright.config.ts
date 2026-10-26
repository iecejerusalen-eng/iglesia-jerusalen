import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 5173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  // Firefox is installed on this Windows host but cannot start because its
  // side-by-side runtime is unavailable; keep the default suite runnable in Chromium.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // Browser tests must never inherit real Supabase credentials or mutate the live project.
    env: {
      PLAYWRIGHT_E2E: '1',
      VITE_SUPABASE_URL: 'https://e2e-placeholder.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'e2e-placeholder-public-key',
    },
  },
});
