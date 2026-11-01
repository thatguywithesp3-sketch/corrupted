const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const order=JSON.parse(fs.readFileSync('logos.json','utf8'));
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2 });
  await p.goto('file://'+process.cwd()+'/logos.html'); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(800);
  for (const o of order) { await p.locator('#'+o.id).screenshot({ path: 'png/'+o.id+'.png', omitBackground: true }); }
  await b.close();
})();
