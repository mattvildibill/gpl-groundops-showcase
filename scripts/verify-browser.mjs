import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../web/package.json', import.meta.url));
const { chromium } = require('playwright');
const base = process.env.UI_URL || 'http://localhost:5173';
const out = process.env.SCREENSHOT_DIR || '/tmp/gpl-browser-check';
await mkdir(out, {recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
const page = await browser.newPage({viewport:{width:1440,height:1000},timezoneId:'America/Denver',reducedMotion:'reduce'});
page.setDefaultTimeout(10000);
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
const role=async name=>{if (!await page.getByRole('button',{name,exact:true}).isVisible()) await page.getByText('How it works & technical controls',{exact:true}).click();await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed').then(x=>assert.equal(x,'true'));};
const nav=async name=>{await page.getByRole('link',{name,exact:true}).click(); await page.waitForFunction(n=>[...document.querySelectorAll('nav a')].some(a=>a.textContent===n && a.getAttribute('aria-current')==='page'),name); await page.getByRole('main').getByRole('heading',{level:1}).waitFor(); await page.evaluate(()=>document.fonts.ready);};
try {
 await page.goto(base);
 await page.getByText('Edit mission details',{exact:true}).click();
 await page.getByText('Times: America/Denver. Stored in UTC.',{exact:true}).waitFor();
 const localValue = async offset => page.evaluate(ms=>{const d=new Date(Date.now()+ms);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);},offset);
 const start = page.getByLabel('Start (local time)',{exact:true});
 const end = page.getByLabel('End (local time)',{exact:true});
 for (const [startOffset,endOffset,feedback] of [
   [-3600000,3600000,'future'], [7200000,3600000,'after start'],
   [3600000,4200000,'between 30 minutes'], [3600000,28800000,'between 30 minutes'],
   [15*86400000,15*86400000+3600000,'14 days']
 ]) {
   await start.fill(await localValue(startOffset)); await end.fill(await localValue(endOffset));
   await page.getByRole('button',{name:'Save mission',exact:true}).click();
   await page.getByRole('alert').filter({hasText:feedback}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Approve mission',exact:true}).count(),0);
 }
 await start.fill(await localValue(3600000)); await end.fill(await localValue(10800000));
 await page.getByRole('combobox').selectOption('CRITICAL');
 await page.getByRole('textbox',{name:'Notes',exact:true}).fill('short');
 await page.getByRole('button',{name:'Save mission',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Critical'}).waitFor();
 await page.getByRole('textbox',{name:'Notes',exact:true}).fill('Synthetic coastal survey with time-sensitive cloud coverage.');
 await page.getByRole('button',{name:'Save mission',exact:true}).click();
 await page.getByRole('button',{name:'Approve mission',exact:true}).click();
 await page.getByText('Approved · awaiting handoff',{exact:true}).waitFor();
 const timeline = page.getByRole('region',{name:'Mission handoff timeline'});
 await timeline.getByText('Approved · awaiting handoff',{exact:true}).waitFor();
 await page.screenshot({path:`${out}/handoff-pending.png`,fullPage:true});
 await timeline.getByRole('button',{name:'Resume delivery',exact:true}).click();
 await timeline.getByText('Recovered',{exact:false}).waitFor();
 await timeline.getByText('History & technical evidence',{exact:true}).click();
 await timeline.getByRole('button',{name:'Try duplicate delivery',exact:true}).click();
 await timeline.getByRole('status').filter({hasText:'Duplicate delivery ignored'}).waitFor();
 await page.screenshot({path:`${out}/handoff-recovered.png`,fullPage:true});
 await role('OPS'); await nav('Operations tickets');
 await page.getByRole('link',{name:'Trace handoff'}).waitFor();
 await page.screenshot({path:`${out}/ops-tasking.png`,fullPage:true});
 await page.getByRole('link',{name:'Trace handoff'}).click();
 await page.getByText('Task issued for AURORA-7',{exact:true}).waitFor();
 await role('OPS');
 await page.getByRole('alert').filter({hasText:'requires'}).waitFor();
 await role('AUDITOR');
 await page.getByText('Task issued for AURORA-7',{exact:true}).waitFor();
 assert.equal(await page.getByText('Draft created for AURORA-7',{exact:true}).count(),0);
 await page.getByRole('textbox',{name:'Action',exact:true}).fill('ops_task_created');
 await page.getByRole('textbox',{name:'Actor',exact:true}).fill('DEMO-PLANNER');
 await page.getByRole('button',{name:'Apply Filters',exact:true}).click();
 await page.getByText('Task issued for AURORA-7',{exact:true}).waitFor();
 assert.equal(await page.getByText('Approved window for AURORA-7',{exact:true}).count(),0);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.getByText('Draft created for AURORA-7',{exact:true}).waitFor();
 await page.screenshot({path:`${out}/audit-trail.png`,fullPage:true});
 await role('EXEC'); await nav('Overview');
 await page.getByText('100%',{exact:true}).waitFor();
 await page.screenshot({path:`${out}/executive-summary.png`,fullPage:true});
 await role('PLANNER'); await nav('Mission workspace');
 await page.screenshot({path:`${out}/mission-planner.png`,fullPage:true});
 for (const width of [320,375,768,1440]) {
   await page.setViewportSize({width,height:900});
   for (const [name,r] of [['Mission workspace','PLANNER'],['Operations tickets','OPS'],['History & evidence','AUDITOR'],['Overview','EXEC']]) {
     await role(r); await nav(name);
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),`${name} overflows at ${width}`);
   }
 }
 await role('PLANNER'); await nav('Mission workspace');await page.setViewportSize({width:375,height:812});
 await page.screenshot({path:`${out}/mission-planner-mobile.png`,fullPage:true});
 await page.getByRole('button',{name:'Reset scenario',exact:true}).click();
 await page.getByRole('button',{name:'Save mission',exact:true}).waitFor();
 // Shared consumer: two pending plans drain together; old mission feedback must not leak.
 await page.getByText('Edit mission details',{exact:true}).click();
 for (const asset of ['AURORA-7','BOREALIS-4']) {
   if (asset === 'BOREALIS-4') await page.getByRole('button',{name:'New mission',exact:true}).click();
   await page.getByRole('textbox',{name:'Asset',exact:true}).fill(asset);
   await page.getByRole('button',{name:'Save mission',exact:true}).click();
   await page.getByRole('button',{name:'Approve mission',exact:true}).click();
 }
 await page.getByText('Browser scenario control · 2 queued approval(s).',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Resume delivery',exact:true}).click();
 await page.getByRole('region',{name:'Mission handoff timeline'}).getByRole('combobox',{name:'Mission'}).selectOption({label:'AURORA-7 · PLN-1001'});
 await page.getByRole('region',{name:'Mission handoff timeline'}).getByText('Recovered',{exact:false}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Resume delivery',exact:true}).count(),0);
 await page.getByRole('region',{name:'Mission handoff timeline'}).getByText('History & technical evidence',{exact:true}).click();
 await page.getByRole('button',{name:'Try duplicate delivery',exact:true}).click();
 await page.getByRole('region',{name:'Mission handoff timeline'}).getByRole('combobox',{name:'Mission'}).selectOption({label:'BOREALIS-4 · PLN-1002'});
 assert.equal(await page.getByText('Duplicate delivery ignored.',{exact:false}).count(),0);
 await role('AUDITOR');
 assert.equal(await page.getByRole('region',{name:'Mission handoff timeline'}).count(),0);
 await page.goto(`${base}/audit`); await page.getByRole('heading',{name:'Mission history & evidence'}).waitFor();
 await page.keyboard.press('Tab');
 assert.equal(await page.locator(':focus').textContent(),'Skip to mission workspace');
 assert.deepEqual(errors,[]);
 console.log('PASS: past/reversed/short/long/out-of-horizon/critical constraint feedback; create → approve → pending → resume → ticket → duplicate replay → trace; role denial/reload; audit reset; summary; reset scenario; direct route; keyboard skip link; 4 views × 4 widths; no page errors.');
 console.log(`Screenshots: ${out}`);
} catch(e) { await page.screenshot({path:`${out}/failure.png`,fullPage:true}); console.error(await page.locator('body').innerText()); throw e; }
finally {await browser.close();}
