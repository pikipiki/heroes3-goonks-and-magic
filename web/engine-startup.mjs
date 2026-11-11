// The Emscripten data loader adds a run dependency before awaiting its fetch.
// A rejected or stalled fetch otherwise leaves the engine waiting indefinitely.
// Keep this function self-contained: the site builder injects it in that loader.
export async function fetchEnginePackage(packageName,packageSize,{module=globalThis.Module||{},fetcher=globalThis.fetch,timeoutMs=90000,retries=1}={}){
 let failure;
 for(let attempt=0;attempt<=retries;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await fetcher(packageName,{signal:controller.signal,cache:attempt?'reload':'default'});
   if(!response.ok)throw Error(`Engine data: HTTP ${response.status}`);
   const total=packageSize,chunks=[];let loaded=0;
   const reader=response.body.getReader();
   for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.length;
    module.dataFileDownloads ||= {};module.dataFileDownloads[packageName]={loaded,total};
    globalThis.goonkEngineProgress={loaded,total,attempt};
   }
   if(loaded!==packageSize)throw Error('Engine data download is incomplete.');
   const bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   return bytes.buffer;
  }catch(error){failure=error;}finally{clearTimeout(timer);}
 }
 globalThis.goonkEngineStartupError=failure;
 globalThis.goonkTemporaryBoot?.fail(failure);
 throw failure;
}
