import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../web/package.json', import.meta.url));
const { chromium } = require('playwright');
const base = process.env.UI_URL || 'http://localhost:5173';
const out = process.env.SCREENSHOT_DIR || '/tmp/groundops-guided-check';
await mkdir(out,{recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
try {
 for (const width of [320,375,1440]) {
  const page = await browser.newPage({viewport:{width,height:width===1440?900:812},reducedMotion:'reduce'});
  page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  await page.getByRole('heading',{name:'From mission request to operations'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'PLANNER',exact:true}).isVisible(),false);
  const save=page.getByRole('button',{name:'Save mission',exact:true});
  if(width===1440) {const box=await save.boundingBox();assert.ok(box.y+box.height<=900,'Desktop save must fit first viewport');}
  await page.screenshot({path:`${out}/start-${width}.png`,fullPage:true});
  await save.focus();await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Ready for your approval'}).waitFor();
  assert.equal(await page.locator(':focus').textContent(),'Ready for your approval');
  await page.keyboard.press('Tab'); // Delay checkbox
  assert.equal(await page.locator(':focus').getAttribute('type'),'checkbox');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(),'Approve mission');
  await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Approved · awaiting handoff'}).waitFor();
  assert.equal(await page.locator(':focus').textContent(),'Approved · awaiting handoff');
  const resume=page.getByRole('button',{name:'Resume delivery',exact:true});
  const resumeBox=await resume.boundingBox();assert.ok(resumeBox.y>=0 && resumeBox.y+resumeBox.height<=812+(width===1440?88:0),'Recovery action stays in viewport');
  await page.screenshot({path:`${out}/pending-${width}.png`,fullPage:true});
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Resume delivery');await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'Operations ticket issued'}).waitFor();
  assert.equal(await page.locator(':focus').textContent(),'Operations ticket issued');
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').textContent(),'Try duplicate delivery');await page.keyboard.press('Enter');
  await page.getByRole('status').filter({hasText:'Duplicate delivery ignored'}).waitFor();
  assert.equal(await page.locator('.ticket-receipt b').textContent(),'TSK-2001');
  await page.screenshot({path:`${out}/recovered-${width}.png`,fullPage:true});
  await page.getByText('History & technical evidence',{exact:true}).click();
  await page.getByRole('link',{name:'Open audit evidence',exact:true}).click();
  await page.getByText('Task issued for AURORA-7',{exact:true}).waitFor();
  assert.equal(await page.getByRole('alert').count(),0);
  await page.goBack();
  await page.getByRole('heading',{name:'Operations ticket issued'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Save mission',exact:true}).count(),0,'Return restores mission instead of intake');
  assert.equal(await page.getByRole('alert').count(),0);
  await page.goForward();await page.getByText('Task issued for AURORA-7',{exact:true}).waitFor();
  assert.equal(await page.getByRole('alert').count(),0);
  await page.getByRole('link',{name:'Mission workspace',exact:true}).click();
  await page.getByRole('heading',{name:'Operations ticket issued'}).waitFor();
  await page.getByRole('button',{name:'New mission',exact:true}).click();
  assert.equal(await page.locator(':focus').getAttribute('aria-label'),'Asset');
  for(const route of ['/ops','/executive','/audit','/']) {
   await page.goto(base+route);await page.getByRole('heading',{level:1}).waitFor();
   await page.waitForTimeout(100);
   assert.equal(await page.getByRole('alert').count(),0,`Direct ${route} must choose matching demo role`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${route} at ${width}`);
  }
  await page.getByText('How it works & technical controls',{exact:true}).click();
  await page.getByRole('button',{name:'AUDITOR',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'requires'}).waitFor();
  assert.equal(await page.getByRole('region',{name:'Mission handoff timeline'}).count(),0);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS: zero role selection in guided flow; desktop action in first viewport; save/approve/resume keyboard focus; ticket/duplicate/audit; return restores mission; Back/Forward; direct routes; optional role denial; 320/375/1440px; no browser errors.');
 console.log(`Screenshots: ${out}`);
} finally {await browser.close();}
