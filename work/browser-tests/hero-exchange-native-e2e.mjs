import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const fixture=execFileSync('python3',['-c',`import io,json,sys,zipfile
out=io.BytesIO()
with zipfile.ZipFile('maps/000-Goonk.vmap') as src, zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as dst:
 for name in src.namelist():
  data=src.read(name)
  if name=='header.json':
   header=json.loads(data)
   header['name']='Hero exchange fixture'
   header['teams']=[['red','blue']]
   header['players']['tan']={'canPlay':'AIOnly','allowedFactions':{'anyOf':['core:castle']}}
   data=json.dumps(header).encode()
  if name=='objects.json':
   objects=json.loads(data)
   hero=next(obj for obj in objects if obj.get('instanceName')=='goonkHero')
   hero['options']['artifacts']={'rightHand':'core:centaurAxe'}
   hero['options']['army']=[{'type':'core:pikeman','amount':6}]
   def newHero(name, owner, heroType, x, y, amount):
    return {**hero,'instanceName':name,'x':x,'y':y,'options':{'owner':owner,'type':heroType,'army':[{'type':'core:pikeman','amount':amount}]}}
   objects.append(newHero('exchangeAlly','blue','core:christian',10,11,4))
   objects.append(newHero('distantHero','red','core:orrin',16,8,3))
   objects.append(newHero('enemyHero','tan','core:edric',27,30,10))
   data=json.dumps(objects).encode()
  dst.writestr(name,data)
sys.stdout.buffer.write(out.getvalue())`]);

const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,bypassCSP:true});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const origin=process.env.GOONK_TEST_ORIGIN||'http://127.0.0.1:8783';
 const wait=(predicate,arg)=>page.waitForFunction(predicate,arg,{timeout:180000});
 const command=(...args)=>page.evaluate(a=>Module._vcmiMobileCommand(...a),[...args,...Array(6-args.length).fill(0)]);
 await page.addInitScript(map=>{
  let module;
  Object.defineProperty(window,'Module',{configurable:true,get:()=>module,set:value=>{
   module=value;
   let main;
   Object.defineProperty(module,'callMain',{configurable:true,set:run=>main=run,get:()=>function(...args){
    module.FS.writeFile('/home/web_user/.local/share/vcmi/Maps/HeroExchangeFixture.vmap',Uint8Array.from(atob(map),char=>char.charCodeAt(0)));
    return main.apply(module,args);
   }});
  }});
 },fixture.toString('base64'));
 await page.goto(origin+'/game.html?mobile=1');
 await wait(()=>window.goonkMobileState?.mode==='menu'&&window.goonkSessionRecovery?.phase==='done');
 await command(20,1);
 await wait(()=>!goonkMobileState.mapsLoading&&goonkMobileState.maps?.some(map=>map.name==='Hero exchange fixture'));
 const index=await page.evaluate(()=>goonkMobileState.maps.find(map=>map.name==='Hero exchange fixture').index);
 await page.locator('[data-setting=mobile-map-select] .lobby-choice-card').tap();
 await page.locator(`.lobby-picker [data-choice-value="${index}"]`).tap();
 await wait(()=>goonkMobileState.selectedMap==='Hero exchange fixture'&&goonkMobileState.lobbyReady);
 await page.locator('.lobby-footer [data-ui=begin]').tap();
 await wait(()=>goonkMobileState.mode==='map'&&goonkMobileState.turn&&goonkMobileState.heroes?.length===2);
 const exchange=page.locator('[data-ui=hero-exchange]');
 const endTurn=page.locator('[data-ui=endturn]');
 const viewports=[{width:390,height:844},{width:844,height:390},{width:568,height:320}];
 const resize=async size=>{
  await page.setViewportSize(size);
  await wait(({width,height})=>Math.abs(document.querySelector('#mobile-app').clientWidth-width)<2&&Math.abs(document.querySelector('#mobile-app').clientHeight-height)<2,size);
 };
 const badges=visible=>page.waitForFunction(expected=>{
  const source=document.querySelector('#canvas'),sample=document.createElement('canvas');
  sample.width=source.width;sample.height=source.height;
  const ctx=sample.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(source,0,0);
  const pixels=ctx.getImageData(0,0,sample.width,sample.height).data;
  let matches=0;
  for(let i=0;i<pixels.length;i+=4)
   if(pixels[i]===119&&pixels[i+1]===29&&pixels[i+2]===27)matches++;
  return expected?matches>=250:matches===0;
 },visible,{timeout:15000});
 const pair=await page.evaluate(()=>({
  nearby:goonkMobileState.heroes.find(hero=>hero.name!=='Orrin'),
  distant:goonkMobileState.heroes.find(hero=>hero.name==='Orrin'),
 }));
 assert(pair.nearby&&pair.distant);
 await command(4,pair.distant.index);
 await wait(id=>goonkMobileState.heroId===id&&!goonkMobileState.exchangePartners?.length,pair.distant.id);
 await badges(false);
 const wideEndTurn=[];
 for(const size of viewports){
  await resize(size);
  assert.equal(await exchange.count(),0,'The Exchange button is absent when the other heroes are distant');
  wideEndTurn.push((await endTurn.boundingBox()).width);
 }
 await command(4,pair.nearby.index);
 await wait(()=>goonkMobileState.exchangePartners?.some(hero=>hero.name==='Christian'));
 await badges(true);
 for(const [i,size] of viewports.entries()){
  await resize(size);
  const action=await exchange.boundingBox(),end=await endTurn.boundingBox();
  assert(action.x+action.width<=end.x&&Math.abs(action.y-end.y)<1,'Exchange is on the left of End turn');
  assert(action.height>=44&&end.height>=44&&end.y+end.height<=size.height+1,'Both actions fit and are tappable');
  assert(end.width>0&&end.width<wideEndTurn[i],'End turn gives space to the Exchange button only when needed');
 }
 assert(await exchange.isEnabled(),'Adjacent heroes can meet this turn');
 await exchange.tap();
 await wait(()=>goonkMobileState.mode==='hero-exchange'&&goonkMobileState.heroExchange?.heroes.length===2);
 const heroes=await page.evaluate(()=>goonkMobileState.heroExchange.heroes);
 const axeSide=heroes.findIndex(hero=>hero.army.slots[0]?.count===6);
 assert(axeSide!==-1,'One hero has the six-creature test army');
 const otherSide=1-axeSide;
 assert.equal(heroes[otherSide].owned,false,'The nearby hero belongs to a different allied player');
 const axe=heroes[axeSide].slots.find(item=>item.slot===3&&item.name);
 assert(axe?.destinations?.length,'The test weapon can be transferred: '+JSON.stringify(heroes[axeSide].slots.filter(item=>item.name)));
 const backpack=heroes[otherSide].slots.find(item=>item.backpack&&!item.name);
 const slot=(side,index)=>page.locator(`[data-exchange-slot="${side}:${index}"]`);
 await page.setViewportSize({width:390,height:844});
 await slot(axeSide,axe.slot).tap();
 assert(await slot(otherSide,backpack.slot).isEnabled());
 await slot(otherSide,backpack.slot).tap();
 await page.locator('[data-exchange-confirm]').tap();
 await wait(({otherSide,id})=>goonkMobileState.heroExchange.heroes[otherSide].slots.some(item=>item.id===id&&item.backpack),{otherSide,id:axe.id});
 await page.setViewportSize({width:844,height:390});
 await page.locator('[data-exchange-tab=troops]').tap();
 await slot(axeSide,0).tap();
 await slot(otherSide,0).tap();
 const quantity=page.locator('[data-exchange-quantity]');
 assert.equal(await quantity.getAttribute('max'),'5','The source hero keeps at least one creature');
 await quantity.fill('2');
 await page.locator('[data-exchange-confirm]').tap();
 await wait(({axeSide,otherSide})=>goonkMobileState.heroExchange.heroes[axeSide].army.slots[0].count===4&&
  goonkMobileState.heroExchange.heroes[otherSide].army.slots[0].count===6,{axeSide,otherSide});
 await page.locator('[data-exchange-close]').tap();
 await wait(()=>goonkMobileState.mode==='map');
 assert(await endTurn.isEnabled(),'Closing releases the exchange query and returns to the map');
 assert.deepEqual(errors,[]);
 console.log('PASS native ally meeting, map badges, contextual End turn layout, artefact gift and troop split');
}finally{await browser.close();}
