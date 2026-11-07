import{test}from'node:test';import assert from'node:assert/strict';import{ROOT}from'../web/asset-cache.mjs';import{storageSummary,isGameData,removeGameData,removeOfflineShell,withStorageMaintenance,holdGameStorage,formatStorage,ASSET_INDEX,isStorageUnavailable,missingManifestBytes,hasStorageQuota,isStorageFailed,markStorageFailed,clearStorageFailed,STORAGE_FAILED_KEY,isMobileDevice,defaultReserveBytes}from'../web/game-storage.mjs';
const file=(name,length=30)=>[ROOT+'/'+name,{isDir:false,length}];
test('Storage accounts separately for game files, saves and settings',()=>{const value=storageSummary(Object.fromEntries([file('Data/a',100),file('Mods/m/a',50),file('Saves/manual.vsgm1',20),file('saves/auto.vcgm1',10),file('config/settings.json',5),[ROOT+'/Data',{isDir:true,length:0}]]));assert.deepEqual(value,{gameBytes:150,saveBytes:30,otherBytes:5,gameFiles:2,saveFiles:2});assert.equal(formatStorage(1.5*1048576),'1.5 MB');assert.equal(formatStorage(1.5*1048576,'fr'),'1,5 Mo');});
test('Cleanup removes only game data and preserves saves, preferences and unrelated data byte-for-byte',async()=>{const entries=Object.fromEntries([file('Data/a',100),file('Maps/x',20),file('Mods/m/a',30),file('Mp3/song',40),file('Saves/manual.vsgm1'),file('config/settings.json'),file('Mods/../Saves/victim'),file('../other'),['Data/relative',{length:50}]]),removed=[],events=[],settings=new Map([[ASSET_INDEX,'index'],['heroes-goonk.audio-muted','true'],['unrelated','keep']]);const result=await removeGameData({opfs:{list:async()=>entries,unlink:async(root,path)=>{assert.equal(root,ROOT);removed.push(path);},flush:async()=>events.push('flush')},storage:{removeItem:key=>settings.delete(key)}});assert.deepEqual(removed,['Data/a','Maps/x','Mods/m/a','Mp3/song']);assert.equal(result.removedBytes,190);assert.deepEqual(events,['flush']);assert(!settings.has(ASSET_INDEX));assert.equal(settings.get('heroes-goonk.audio-muted'),'true');assert.equal(settings.get('unrelated'),'keep');for(const path of ['Saves/a','Config/x','Mods/../../Saves/a','Data//x','/another/Data/a'])assert(!isGameData(path));});
test('A failed deletion is flushed, invalidates the cache index, and never deletes a save',async()=>{const removed=[];let flushed=false,invalidated=false;await assert.rejects(removeGameData({opfs:{list:async()=>Object.fromEntries([file('Data/a'),file('Data/b'),file('Saves/auto')]),unlink:async(root,path)=>{removed.push(path);if(path.endsWith('b'))throw Error('disk error');},flush:async()=>{flushed=true;}},storage:{removeItem:()=>invalidated=true}}),/disk error/);assert(flushed&&invalidated);assert.deepEqual(removed,['Data/a','Data/b']);});
test('Cleanup refuses to mutate files while another game tab holds the lock',async()=>{let mutated=false;await assert.rejects(withStorageMaintenance({request:async(name,options,fn)=>{assert.equal(options.mode,'exclusive');assert(options.ifAvailable);return fn(null);}},()=>{mutated=true;}),/autres onglets/);assert(!mutated);await assert.rejects(withStorageMaintenance(null,()=>{mutated=true;}),/réglages du navigateur/);assert(!mutated);assert.equal(await withStorageMaintenance({request:async(n,o,fn)=>fn({})},async()=>7),7);});
test('Cached page return reacquires the storage lock and preserves a live game',async()=>{
 let releases=0,acquires=0,reloaded=false;const target=new EventTarget();target.localStorage={getItem:()=> 'same-index'};target.location={reload:()=>reloaded=true};
 await holdGameStorage({target,locks:{request:async(n,o,fn)=>{assert.equal(o.mode,'shared');acquires++;await fn();releases++;}}});
 assert.equal(acquires,1);target.dispatchEvent(new Event('pagehide'));await Promise.resolve();await Promise.resolve();assert.equal(releases,1);
 const back=new Event('pageshow');Object.defineProperty(back,'persisted',{value:true});target.dispatchEvent(back);await Promise.resolve();assert.equal(acquires,2);assert(!reloaded);
 target.dispatchEvent(new Event('pagehide'));await Promise.resolve();await Promise.resolve();assert.equal(releases,2);
});
test('A storage cleanup while the page was cached requires a safe reload',async()=>{
 let index='before',reloaded=false;const target=new EventTarget();target.localStorage={getItem:()=>index};target.location={reload:()=>reloaded=true};
 await holdGameStorage({target,locks:{request:async(n,o,fn)=>fn()}});target.dispatchEvent(new Event('pagehide'));index=null;
 const back=new Event('pageshow');Object.defineProperty(back,'persisted',{value:true});target.dispatchEvent(back);await Promise.resolve();assert(reloaded);
});

test('Offline cleanup removes only this app’s registration and release caches', async()=>{
 const scope=new URL('https://pikipiki.github.io/heroes3-goonks-and-magic/');
 const ours='heroes-goonk-shell:'+scope.pathname+':old';
 const another='heroes-goonk-shell:/another-project/:old';
 const deleted=[];
 let unregistered=false;
 const count=await removeOfflineShell({
  scope,
  serviceWorker:{getRegistration:async()=>({scope:scope.href,unregister:async()=>{unregistered=true;}})},
  cacheStorage:{keys:async()=>[ours,another,'unrelated'],delete:async name=>deleted.push(name)},
 });
 assert.equal(count,1);
 assert(unregistered);
 assert.deepEqual(deleted,[ours]);
});

test('Low browser quota and Android/Safari storage errors switch cleanly to temporary mode without rejecting warm installs',()=>{
 const manifest={files:[{path:'Data/a',size:400*1048576,hash:'h1'},{path:'Mods/b',size:250*1048576,hash:'h2'}]};
 const cold={getItem:()=>null};
 const warm={getItem:()=>JSON.stringify({'Data/a':{hash:'h1',size:400*1048576},'Mods/b':{hash:'h2',size:250*1048576}})};
 assert.equal(missingManifestBytes(manifest,cold),650*1048576);
 assert.equal(missingManifestBytes(manifest,warm),0);
 // Chrome Android at >90% disk usage caps origin quota below 650 MB even with ~7 GB free on disk.
 assert.equal(hasStorageQuota({quota:200*1048576,usage:0},missingManifestBytes(manifest,cold)),false);
 // A warm install needs 0 new bytes and must still launch even if quota later shrank.
 assert.equal(hasStorageQuota({quota:200*1048576,usage:650*1048576},missingManifestBytes(manifest,warm)),true);
 assert.equal(hasStorageQuota({quota:900*1048576,usage:100*1048576},missingManifestBytes(manifest,cold)),true);
 for(const err of [
  Object.assign(new Error('Failed to execute write'),{name:'QuotaExceededError'}),
  new Error('The quota has been exceeded.'),
  new Error('Unknown transient reason'),
  new Error('FILE_ERROR_NO_SPACE'),
 ])assert.equal(isStorageUnavailable(err),true);
 assert.equal(isStorageUnavailable(new Error('Données incomplètes ou altérées')),false);
});

test('Storage failure flag remembers quota or write failure and bypasses repeated downloads until cleared',()=>{
 const storage=new Map(),session=new Map();
 const wrap=m=>({getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)});
 const st=wrap(storage),ss=wrap(session);
 assert.equal(isStorageFailed(st,ss),false);
 markStorageFailed(st,ss);
 assert.equal(isStorageFailed(st,ss),true);
 assert.equal(storage.get(STORAGE_FAILED_KEY),'true');
 assert.equal(session.get(STORAGE_FAILED_KEY),'true');
 clearStorageFailed(st,ss);
 assert.equal(isStorageFailed(st,ss),false);
 assert.equal(storage.has(STORAGE_FAILED_KEY),false);
 assert.equal(session.has(STORAGE_FAILED_KEY),false);
});

test('Mobile devices require larger quota headroom and reject missing quota on cold install',()=>{
 const androidNav={userAgent:'Mozilla/5.0 (Linux; Android 10; VOG-L29) AppleWebKit/537.36 Chrome/134.0 Mobile Safari/537.36',userAgentData:{mobile:true}};
 const desktopNav={userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',userAgentData:{mobile:false}};
 assert.equal(isMobileDevice(androidNav),true);
 assert.equal(isMobileDevice(desktopNav),false);
 assert.equal(defaultReserveBytes(androidNav),256*1024*1024);
 assert.equal(defaultReserveBytes(desktopNav),128*1024*1024);
 // Cold install with missing/undefined quota rejects on mobile to avoid 660MB failure
 assert.equal(hasStorageQuota(null,650*1048576,defaultReserveBytes(androidNav)),false);
 // But warm install with 0 bytes needed always passes
 assert.equal(hasStorageQuota(null,0,defaultReserveBytes(androidNav)),true);
 // When remaining quota is 800 MB, mobile with 256 MB reserve needs 650 + 256 = 906 MB -> rejects
 assert.equal(hasStorageQuota({quota:800*1048576,usage:0},650*1048576,defaultReserveBytes(androidNav)),false);
 // Desktop with 128 MB reserve needs 650 + 128 = 778 MB <= 800 MB -> accepts
 assert.equal(hasStorageQuota({quota:800*1048576,usage:0},650*1048576,defaultReserveBytes(desktopNav)),true);
});
