import { createRequire } from 'node:module';
import { mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requireFromWeb = createRequire(path.resolve(__dirname, '../web/package.json'));
const { chromium } = requireFromWeb('playwright');

const playwrightCorePath = requireFromWeb.resolve('playwright-core');
const registryPath = path.join(path.dirname(playwrightCorePath), 'lib/server/registry/index.js');
const { registry } = requireFromWeb(registryPath);
const ffmpegExecutable = registry.findExecutable('ffmpeg');
const systemFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
const ffmpegPath = systemFfmpeg.status === 0
  ? 'ffmpeg'
  : ffmpegExecutable?.executablePath();

if (!ffmpegPath) {
  console.error('FFmpeg not found. Install ffmpeg or run `npx --prefix web playwright install chromium`.');
  process.exit(1);
}
const baseUrl = process.env.UI_URL || 'http://localhost:5173';
const outputDir = path.resolve(process.cwd(), 'docs', 'screenshots');
const tempDir = path.join(outputDir, '_demo-video');
const gifPath = path.join(outputDir, 'demo.gif');

const pause = (page, ms) => page.waitForTimeout(ms);
const selectRole = async (page, role) => {
  await page.getByRole('button', { name: role }).click();
  await page.waitForFunction(
    (expectedRole) =>
      localStorage.getItem('groundops.role') === expectedRole &&
      Boolean(localStorage.getItem('groundops.token')),
    role
  );
};

const run = async () => {
  await mkdir(outputDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: tempDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const video = page.video();

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByText('Mission Operations Console').waitFor({ timeout: 15000 });

  await selectRole(page, 'PLANNER');
  await pause(page, 1200);

  await page.getByRole('button', { name: 'Submit Plan' }).click();
  await pause(page, 1500);

  const approveButton = page.getByRole('button', { name: 'Approve' }).first();
  await approveButton.waitFor({ timeout: 15000 });
  await approveButton.click();
  await pause(page, 1800);

  await selectRole(page, 'OPS');
  const tasksResponse = page.waitForResponse(
    (response) => response.url().includes('/api/tasks') && response.status() === 200,
    { timeout: 15000 }
  );
  await page.goto(`${baseUrl}/ops`, { waitUntil: 'networkidle' });
  await page.waitForURL('**/ops');
  await tasksResponse;
  await page.getByRole('heading', { name: 'Tasking Ticket', exact: true }).waitFor({ timeout: 15000 });
  await page.getByText(/TSK-\d+/).first().waitFor({ timeout: 30000 });
  await pause(page, 2000);

  await selectRole(page, 'AUDITOR');
  const auditResponse = page.waitForResponse(
    (response) => response.url().includes('/api/audit') && response.status() === 200,
    { timeout: 15000 }
  );
  await page.goto(`${baseUrl}/audit`, { waitUntil: 'networkidle' });
  await page.waitForURL('**/audit');
  await auditResponse;
  await page.getByRole('heading', { name: 'Audit Events', exact: true }).waitFor({ timeout: 15000 });
  await page.getByText(/PLAN_|OPS_/).first().waitFor({ timeout: 15000 });
  await pause(page, 2000);

  await selectRole(page, 'EXEC');
  const execResponses = Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/plans') && response.status() === 200,
      { timeout: 15000 }
    ),
    page.waitForResponse(
      (response) => response.url().includes('/api/tasks') && response.status() === 200,
      { timeout: 15000 }
    ),
    page.waitForResponse(
      (response) => response.url().includes('/api/audit') && response.status() === 200,
      { timeout: 15000 }
    ),
  ]);
  await page.goto(`${baseUrl}/executive`, { waitUntil: 'networkidle' });
  await page.waitForURL('**/executive');
  await execResponses;
  await page.getByText('Mission readiness at a glance').waitFor({ timeout: 15000 });
  await pause(page, 2400);

  await context.close();
  await browser.close();

  const videoPath = await video.path();
  const result = spawnSync(ffmpegPath, [
    '-y',
    '-i',
    videoPath,
    '-vf',
    'fps=12,scale=1280:-1:flags=lanczos',
    '-f',
    'gif',
    '-loop',
    '0',
    gifPath,
  ], { stdio: 'inherit' });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  await rm(tempDir, { recursive: true, force: true });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
