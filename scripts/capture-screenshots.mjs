import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.resolve(__dirname, '../web/package.json'));
const { chromium } = require('playwright');

const baseUrl = process.env.UI_URL || 'http://localhost:5173';
const outputDir = path.resolve(process.cwd(), 'docs', 'screenshots');

const waitForApp = async (page) => {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByText('Mission Operations Console').waitFor({ timeout: 15000 });
};

const selectRole = async (page, role) => {
  await page.getByRole('button', { name: role }).click();
  await page.waitForTimeout(500);
};

const capture = async (page, route, filename) => {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outputDir, filename), fullPage: true });
};

const run = async () => {
  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await waitForApp(page);

  await selectRole(page, 'PLANNER');
  await capture(page, '/', 'mission-planner.png');

  await selectRole(page, 'OPS');
  await capture(page, '/ops', 'ops-tasking.png');

  await selectRole(page, 'EXEC');
  await capture(page, '/executive', 'executive-summary.png');

  await selectRole(page, 'AUDITOR');
  await capture(page, '/audit', 'audit-trail.png');

  await browser.close();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
