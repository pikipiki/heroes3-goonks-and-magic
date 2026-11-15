import {authorizeExternalScripts,inlineScriptHashes} from '../../../scripts/script-policy.mjs';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {gzipSync,gunzipSync} from 'node:zlib';
export function compressClassicEngine(output){
 const metadata=JSON.parse(fs.readFileSync(path.join(output,'engine-build.json'))),wasm=metadata.wasm;
 const files=fs.readdirSync(output),runtime=files.find(f=>/^vcmiclient\.[a-f0-9]+\.js$/.test(f)),loader=files.find(f=>/^vcmiclient\.data\.[a-f0-9]+\.js$/.test(f)),data=files.find(f=>/^vcmiclient\.[a-f0-9]+\.data$/.test(f));
 if(!runtime||!loader||!data)throw Error('Classic engine compression inputs missing');
 const runtimePath=path.join(output,runtime),loaderPath=path.join(output,loader);let js=fs.readFileSync(runtimePath,'utf8'),load=fs.readFileSync(loaderPath,'utf8');
 const anchor='async function instantiateAsync(binary,binaryFile,imports){';if(!js.includes(anchor))throw Error('WASM streaming anchor changed');
 js=js.replace(anchor,anchor+`if(!binary){const compressed=await fetch(binaryFile+'.gz',{credentials:"same-origin"});if(!compressed.ok)throw Error('Moteur indisponible: '+compressed.status);const decoded=new Response(compressed.body.pipeThrough(new DecompressionStream('gzip')),{headers:{'Content-Type':'application/wasm'}});return WebAssembly.instantiateStreaming(decoded,imports);}`);
 if(!load.includes('fetcher(packageName,')||!load.includes('const reader=response.body.getReader();'))throw Error('Native package fetch anchor changed');
 load=load.replace('fetcher(packageName,',"fetcher(packageName+'.gz',").replace('const reader=response.body.getReader();',"const reader=response.body.pipeThrough(new DecompressionStream('gzip')).getReader();");
 fs.writeFileSync(runtimePath,js);fs.writeFileSync(loaderPath,load);
 const renames=[];for(const old of [runtime,loader]){const digest=crypto.createHash('sha256').update(fs.readFileSync(path.join(output,old))).digest('hex').slice(0,16),fresh=old.replace(/\.[a-f0-9]+\.js$/,'.'+digest+'.js');fs.renameSync(path.join(output,old),path.join(output,fresh));renames.push([old,fresh]);}
 for(const file of files.filter(name=>name.endsWith('.html'))){const filename=path.join(output,file);let html=fs.readFileSync(filename,'utf8');for(const [old,fresh]of renames)html=html.replaceAll(old,fresh);
  const authorized=authorizeExternalScripts(html,src=>fs.readFileSync(path.join(output,new URL(src,'https://offline.invalid/').pathname)));html=authorized.html;
  const hashes=[...authorized.hashes,...inlineScriptHashes(html)].join(' ');html=html.replace(/script-src [^;"]*/,sources=>sources+' '+hashes);fs.writeFileSync(filename,html);
 }
 for(const file of [wasm,data]){const original=fs.readFileSync(path.join(output,file)),compressed=gzipSync(original,{level:9});if(!gunzipSync(compressed).equals(original))throw Error('Compressed engine integrity mismatch');fs.writeFileSync(path.join(output,file+'.gz'),compressed);fs.unlinkSync(path.join(output,file));}
 metadata.compressedWasm=wasm+'.gz';metadata.compressedWasmSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(output,wasm+'.gz'))).digest('hex');fs.writeFileSync(path.join(output,'engine-build.json'),JSON.stringify(metadata));
}
