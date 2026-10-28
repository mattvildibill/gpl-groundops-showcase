// Captures the synthetic browser walkthrough, with its regression checks.
// Java/JMS integration evidence is produced separately by Maven.
import path from 'node:path';
process.env.SCREENSHOT_DIR ||= path.resolve('docs/screenshots');
await import('./verify-browser.mjs');
