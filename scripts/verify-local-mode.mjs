import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../web/package.json',import.meta.url));
const {chromium}=require('playwright');
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage();page.setDefaultTimeout(10000);
 // Deterministic service-outage check, not a substitute for the real Java suite.
 await page.route('**/api/**',route=>route.abort());
 await page.goto(process.env.UI_URL||'http://localhost:5174');
 await page.getByRole('alert').filter({hasText:'No token set'}).waitFor();
 await page.getByText('How it works & technical controls',{exact:true}).click();
 await page.getByRole('button',{name:'PLANNER',exact:true}).click();
 await page.getByRole('alert').filter({hasText:'Cannot reach the local service'}).waitFor();
 for(const name of ['Operations tickets','Overview','History & evidence','Mission workspace']) {
  await page.getByRole('link',{name,exact:true}).click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('groundops.role')),'PLANNER');
 }
 const roles=await page.evaluate(()=>JSON.parse(atob(localStorage.getItem('groundops.token').split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).roles);
 assert.deepEqual(roles,['PLANNER']);
 assert.equal(await page.getByRole('region',{name:'Mission handoff timeline'}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Resume delivery',exact:true}).count(),0);
 await page.getByRole('button',{name:'OPS',exact:true}).click();
 await page.getByRole('link',{name:'Mission workspace',exact:true}).click();
 assert.equal(await page.evaluate(()=>localStorage.getItem('groundops.role')),'OPS');
 assert.equal(await page.getByRole('button',{name:'Save mission',exact:true}).isDisabled(),true);
 console.log('PASS: local mode does not orchestrate roles; explicit JWT persona persists across routes; no synthetic timeline; no-token and unavailable-service feedback remain visible.');
} finally {await browser.close();}
