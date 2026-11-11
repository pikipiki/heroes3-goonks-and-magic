import {fetchEnginePackage} from '../web/engine-startup.mjs';
import {inlineBootScreen} from './boot-screen.mjs';
import {versionModuleImports,versionScriptTags,createRuntimeVersion} from './version-runtime.mjs';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {scriptPolicy,applyScriptPolicy,authorizeExternalScripts} from './script-policy.mjs';
import {packSmallAssets} from './asset-packs.mjs';
import {visitBaseGame} from './base-game.mjs';
import {makeManifest} from './assets.mjs';import {renderPage} from './page.mjs';
const root=path.resolve(process.env.GOONK_ENGINE_DIR||'work/vcmi-wasm/emscripten/html5'),data=path.resolve('work/game-data/homm3eng/home/web_user/.local/share/vcmi'),dist=path.resolve('dist');
if(!fs.existsSync(root))throw Error('Extraire le moteur précompilé dans work/vcmi-wasm/emscripten/ avant de construire le site.');
fs.rmSync(dist,{recursive:true,force:true});fs.cpSync(root,dist,{recursive:true});fs.cpSync('web',path.join(dist,'web'),{recursive:true});
// Use the same OPFS worker for the web installer and the engine's startup mount.
fs.copyFileSync('work/vcmi-wasm/lib/html5/opfs-worker.js',path.join(dist,'opfs-worker.js'));
// Public builds include the Goonk/WoG mods and showcase map.
const publicData=path.resolve('work/public-data');fs.rmSync(publicData,{recursive:true,force:true});fs.mkdirSync(publicData+'/Maps',{recursive:true});fs.cpSync('mod',publicData+'/Mods',{recursive:true});for(const file of fs.readdirSync('maps').filter(f=>f.endsWith('.vmap')))fs.copyFileSync('maps/'+file,publicData+'/Maps/'+file);
// Normalize runtime object identifiers and their references without rewriting source fixtures or saves.
execFileSync('python3',['scripts/normalize-map-instances.py',publicData+'/Maps']);
const manifest=makeManifest(publicData,{includeBase:false});
for(const file of manifest.files)file.url='.'+file.url;
for(const file of manifest.files){const target=path.join(dist,decodeURIComponent(file.url));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(publicData,file.path),target);}
const writePack=(url,bytes)=>{const target=path.join(dist,url);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);};
if(fs.existsSync('game-data/manifest.json')){
 // The scenario picker scans the bundled map catalogue. Ship small maps
 // together so private sessions can scan them without hundreds of GETs.
 const mapLimit=512*1024;
 const isPackedMap=file=>file.path.startsWith('Maps/')&&file.size>0&&file.size<=mapLimit&&file.chunks.length===1;
 const base=visitBaseGame('game-data',(file,chunk,bytes)=>{if(isPackedMap(file))return;const target=path.join(dist,'assets/base',chunk.hash+'.bin');if(!fs.existsSync(target)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}});
 for(const file of base.files)for(const chunk of file.chunks)chunk.url='./assets/base/'+chunk.hash+'.bin';
 packSmallAssets(base.files,file=>fs.readFileSync('game-data/chunks/'+file.chunks[0].hash+'.bin'),writePack,{limit:mapLimit,include:isPackedMap});
 manifest.files.unshift(...base.files);
 manifest.requiresImport=false;manifest.bundledBase=true;
}
packSmallAssets(manifest.files,file=>fs.readFileSync(path.join(publicData,file.path)),writePack);
// Bound and report package failures before Emscripten can leave a run dependency hanging.
const loaderPath=path.join(dist,'vcmiclient.data.js');let loader=fs.readFileSync(loaderPath,'utf8');
const loaderStart=loader.indexOf('async function fetchRemotePackage('),loaderEnd=loader.indexOf('      var fetchPromise;',loaderStart);
if(loaderStart<0||loaderEnd<0)throw Error('Unsupported Emscripten data loader');
loader=loader.slice(0,loaderStart)+fetchEnginePackage.toString().replace('fetchEnginePackage','fetchRemotePackage')+'\n'+loader.slice(loaderEnd);fs.writeFileSync(loaderPath,loader);
let html=renderPage(root);const runtimeNames={};
for(const name of ['vcmiclient.data.js','vcmiclient.wasm','vcmiclient.data','vcmiclient.js']){const bytes=fs.readFileSync(path.join(dist,name)),hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16),hashed=name.replace(/(\.[^.]+)$/,'.'+hash+'$1');fs.renameSync(path.join(dist,name),path.join(dist,hashed));runtimeNames[name]=hashed;}
html=html.replace(/vcmiclient\.(?:data\.js|wasm|data|js)/g,name=>runtimeNames[name]);
const moduleFiles=fs.readdirSync(path.join(dist,'web')).filter(name=>/\.(mjs|js)$/.test(name)).sort();
const runtimeVersion=createRuntimeVersion(html,[...moduleFiles.map(name=>['web/'+name,fs.readFileSync(path.join(dist,'web',name))]),...fs.readdirSync(dist).filter(name=>/\.(mjs|js)$/.test(name)).map(name=>[name,fs.readFileSync(path.join(dist,name))])]);
const engineBuild={memoryVersion:1,runtimeVersion,wasm:runtimeNames['vcmiclient.wasm'],sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,runtimeNames['vcmiclient.wasm']))).digest('hex'),mobile:{width:800,height:600},assetCacheBytes:16*1024*1024};manifest.engine=engineBuild;fs.writeFileSync(path.join(dist,'engine-build.json'),JSON.stringify(engineBuild));
for(const name of fs.readdirSync(path.join(dist,'web')).filter(name=>/\.(mjs|js)$/.test(name))){const file=path.join(dist,'web',name);fs.writeFileSync(file,versionModuleImports(fs.readFileSync(file,'utf8'),runtimeVersion));}
html=versionScriptTags(versionModuleImports(html,runtimeVersion),runtimeVersion);
fs.copyFileSync('web/hosting-bootstrap.mjs',path.join(dist,'hosting-bootstrap.mjs'));
let index=inlineBootScreen(fs.readFileSync('web/hosting-index.html','utf8'));let storagePage=fs.readFileSync('web/storage.html','utf8');
index=versionScriptTags(versionModuleImports(index,runtimeVersion),runtimeVersion);storagePage=versionScriptTags(versionModuleImports(storagePage,runtimeVersion),runtimeVersion);
const loadScript=url=>fs.readFileSync(path.join(dist,url.split('?')[0])),gameScripts=authorizeExternalScripts(html,loadScript),indexScripts=authorizeExternalScripts(index,loadScript);
html=gameScripts.html;index=indexScripts.html;const rootScripts=fs.readdirSync(dist).filter(name=>/\.(mjs|js)$/.test(name));
const scriptBases=['https://heroes3-goonks-and-magic.netlify.app','https://pikipiki.github.io/heroes3-goonks-and-magic'];
if(process.env.GOONK_TEST_ORIGIN)scriptBases.push(new URL(process.env.GOONK_TEST_ORIGIN).origin);
const scriptSources=scriptBases.flatMap(base=>[base+'/web/',...rootScripts.map(name=>base+'/'+name)]);
const storageScripts=authorizeExternalScripts(storagePage,loadScript);storagePage=storageScripts.html;
const policy=scriptPolicy([html,index,storagePage],[...gameScripts.hashes,...indexScripts.hashes,...storageScripts.hashes],scriptSources);html=applyScriptPolicy(html,policy);index=applyScriptPolicy(index,policy);
fs.writeFileSync(path.join(dist,'storage.html'),applyScriptPolicy(storagePage,policy));fs.writeFileSync(path.join(dist,'game.html'),html);fs.writeFileSync(path.join(dist,'asset-manifest.json'),JSON.stringify(manifest));
fs.writeFileSync(path.join(dist,'_headers'),'/*\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\n  Content-Security-Policy: '+policy+'\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/asset-manifest.json\n  Cache-Control: no-cache\n');
console.log('Site statique créé dans dist — données Heroes III et mods hébergés.');

fs.writeFileSync(path.join(dist,'index.html'),index);
fs.copyFileSync('web/hosting-bootstrap.mjs',path.join(dist,'hosting-bootstrap.mjs'));
// Stamp HTML so a CDN-injected snippet cannot invalidate the whole cache install.
const htmlVersions={};
for(const file of ['index.html','game.html','storage.html']){
 const target=path.join(dist,file),content=fs.readFileSync(target,'utf8');
 const version=crypto.createHash('sha256').update(content).digest('hex').slice(0,24);
 htmlVersions[file]=version;
 fs.writeFileSync(target,content.replace(/<head>/i,'<head><meta name="goonk-release" content="'+version+'">'));
}
// Hash the final files, including integrity attributes and the generated manifest.
const shellFiles=['index.html','game.html','storage.html','asset-manifest.json','engine-build.json',
 'hosting-bootstrap.mjs','opfs-worker.js','mini-lz4.js','dialogs.js','dosvcmi.png',...Object.values(runtimeNames),
 ...fs.readdirSync(path.join(dist,'web'),{recursive:true,withFileTypes:true})
   .filter(entry=>entry.isFile()&&entry.name!=='coi-serviceworker.js'&&!entry.name.endsWith('.html'))
   .map(entry=>path.relative(dist,path.join(entry.parentPath,entry.name)).split(path.sep).map(encodeURIComponent).join('/'))];
const shellHashes=Object.fromEntries(shellFiles.sort().map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,decodeURIComponent(file)))).digest('base64')]));
const worker=fs.readFileSync('web/coi-serviceworker.js','utf8');
const shellId=crypto.createHash('sha256').update(worker).update(JSON.stringify(shellHashes)).digest('hex').slice(0,24);
fs.writeFileSync(path.join(dist,'coi-serviceworker.js'),worker.replace('/* OFFLINE_RELEASE */ null',JSON.stringify({id:shellId,files:shellHashes,htmlVersions})));
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
