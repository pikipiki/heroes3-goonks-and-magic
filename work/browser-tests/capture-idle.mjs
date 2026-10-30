import {chromium} from 'playwright-core';
import fs from 'node:fs';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
const page=browser.contexts()[0].pages().at(-1);
fs.mkdirSync('../idle-capture',{recursive:true});
const start=Date.now();
for(let i=0;i<60;i++){
 await page.screenshot({path:'../idle-capture/'+String(i).padStart(3,'0')+'.png',clip:{x:155,y:125,width:170,height:570}});
 await new Promise(r=>setTimeout(r,Math.max(0,(i+1)*100-(Date.now()-start))));
}
console.log('60 frames captured');process.exit(0);
