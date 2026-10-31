import {chromium} from 'playwright-core';
import readline from 'node:readline';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
const context=browser.contexts()[0];
let page=context.pages().at(-1)||await context.newPage();
await page.setViewportSize({width:1024,height:768});
const logs=[];
page.on('console',m=>logs.push(m.type()+': '+m.text()));
page.on('pageerror',e=>logs.push('PAGEERROR '+e.message));
console.log('READY',await browser.version());
for await(const line of readline.createInterface({input:process.stdin})){
  try{
    const c=JSON.parse(line); let result;
    if(c.op==='newpage'){await page.close().catch(()=>{});page=await context.newPage();await page.setViewportSize({width:1024,height:768});page.on('console',m=>logs.push(m.type()+': '+m.text()));page.on('pageerror',e=>logs.push('PAGEERROR '+e.message));}
    if(c.op==='viewport')await page.setViewportSize({width:c.width,height:c.height});
    if(c.op==='clickText')await page.getByRole('button',{name:c.text,exact:true}).click();
    if(c.op==='goto')result=await page.goto(c.url,{waitUntil:'domcontentloaded',timeout:30000});
    if(c.op==='click')await page.mouse.click(c.x,c.y,{clickCount:c.count||1});
    if(c.op==='key')await page.keyboard.press(c.key,{delay:100});
    if(c.op==='type')await page.keyboard.type(c.text,{delay:100});
    if(c.op==='screenshot')await page.screenshot({path:c.path});
    if(c.op==='eval')result=await page.evaluate(c.code);
    if(c.op==='logs')result=logs.slice(-(c.count||30));
    console.log(JSON.stringify({ok:true,result:c.op==='goto'?result?.status():result}));
  }catch(e){console.log(JSON.stringify({ok:false,error:e.message}));}
}
