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
const run = async () => {
  await mkdir(outputDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });

  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: tempDir, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const video = page.video();

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'From mission request to operations' }).waitFor();
  await pause(page, 1200);
  await page.getByRole('button', { name: 'Save mission', exact:true }).click();
  await pause(page, 1200);
  await page.getByRole('button', { name: 'Approve mission', exact:true }).click();
  await page.getByRole('heading', { name: 'Approved · awaiting handoff' }).waitFor();
  await pause(page, 1800);
  await page.getByRole('button', { name: 'Resume delivery', exact:true }).click();
  await page.getByRole('heading', { name: 'Operations ticket issued' }).waitFor();
  await pause(page, 1500);
  await page.getByRole('button', { name: 'Try duplicate delivery', exact:true }).click();
  await pause(page, 1500);
  await page.getByText('History & technical evidence', { exact:true }).click();
  await pause(page, 1500);
  await page.getByRole('link', { name: 'Open audit evidence', exact:true }).click();
  await page.getByRole('heading', { name: 'Mission history & evidence' }).waitFor();
  await pause(page, 2000);

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
