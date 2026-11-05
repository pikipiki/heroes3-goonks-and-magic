import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ROOT} from '../web/asset-cache.mjs';
import {batchGameMount} from '../web/game-mount.mjs';

test('Startup batches cached assets while saves, settings and failed entries use the normal reader',async()=>{
 const requests=[],fallback=[];
 const mount={mountpoint:ROOT,opts:{root:ROOT}};
 const config={mountpoint:'/config',opts:{root:'/config'}};
 const paths=['/Mods/demo/large','/Mods/demo/small','/Saves/local.vsgm1'];
 const workerEntries=Object.fromEntries(paths.map(path=>[ROOT+path,{length:1}]));
 const opfs={
  getRemoteSet(_mount,callback){callback(null,{type:'remote',entries:{}});},
  loadRemoteEntry(_mount,path,callback){fallback.push(path);callback(null,{fallback:true});},
  callWorker(type,payload,callback){
   requests.push({type,payload});
   if(type==='list')callback(null,workerEntries);
   else if(type==='mount-files')callback(null,[{blob:new Blob(['data'])},null]);
   else callback(null,{});
  }
 };
 const original=opfs.loadRemoteEntry;
 const restore=batchGameMount(opfs,[{path:paths[0].slice(1),size:8192},{path:paths[1].slice(1),size:64}]);
 const list=mount=>new Promise(resolve=>opfs.getRemoteSet(mount,(_,result)=>resolve(result)));
 const read=(mount,path)=>new Promise(resolve=>opfs.loadRemoteEntry(mount,path,(_,entry)=>resolve(entry)));
 assert.deepEqual((await list(config)).entries,{});
 assert.equal((await list(mount)).entries[ROOT+paths[2]].path,ROOT+paths[2]);
 const [large,small,save]=await Promise.all(paths.map(path=>read(mount,ROOT+path)));
 assert.equal(await large.blob.text(),'data');
 assert.equal(small.fallback,true);assert.equal(save.fallback,true);
 assert.deepEqual(fallback.sort(),[ROOT+paths[1],ROOT+paths[2]].sort());
 assert.deepEqual(requests[1],{type:'mount-files',payload:{root:ROOT,files:[{path:paths[0],lazy:true},{path:paths[1],lazy:false}]}});
 restore();assert.equal(opfs.loadRemoteEntry,original);assert.equal(requests.at(-1).type,'release-mount');
});
