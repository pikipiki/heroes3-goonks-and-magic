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
// Public builds include the Goonk/WoG mods and showcase map.
const publicData=path.resolve('work/public-data');fs.rmSync(publicData,{recursive:true,force:true});fs.mkdirSync(publicData+'/Maps',{recursive:true});fs.cpSync('mod',publicData+'/Mods',{recursive:true});for(const file of fs.readdirSync('maps').filter(f=>f.endsWith('.vmap')))fs.copyFileSync('maps/'+file,publicData+'/Maps/'+file);
// Normalize runtime object identifiers and their references without rewriting source fixtures or saves.
execFileSync('python3',['scripts/normalize-map-instances.py',publicData+'/Maps']);
const manifest=makeManifest(publicData,{includeBase:false});
for(const file of manifest.files)file.url='.'+file.url;
for(const file of manifest.files){const target=path.join(dist,decodeURIComponent(file.url));fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(publicData,file.path),target);}
if(fs.existsSync('game-data/manifest.json')){
 const base=visitBaseGame('game-data',(_file,chunk,bytes)=>{const target=path.join(dist,'assets/base',chunk.hash+'.bin');if(!fs.existsSync(target)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);}});
 manifest.files.unshift(...base.files.map(file=>({...file,chunks:file.chunks.map(chunk=>({...chunk,url:'./assets/base/'+chunk.hash+'.bin'}))})));
 manifest.requiresImport=false;manifest.bundledBase=true;
}
packSmallAssets(manifest.files,file=>fs.readFileSync(path.join(publicData,file.path)),(url,bytes)=>{const target=path.join(dist,url);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);});
let html=renderPage(root);const runtimeNames={};
for(const name of ['vcmiclient.data.js','vcmiclient.wasm','vcmiclient.data','vcmiclient.js']){const bytes=fs.readFileSync(path.join(dist,name)),hash=crypto.createHash('sha256').update(bytes).digest('hex').slice(0,16),hashed=name.replace(/(\.[^.]+)$/,'.'+hash+'$1');fs.renameSync(path.join(dist,name),path.join(dist,hashed));runtimeNames[name]=hashed;}
html=html.replace(/vcmiclient\.(?:data\.js|wasm|data|js)/g,name=>runtimeNames[name]);
const moduleFiles=fs.readdirSync(path.join(dist,'web')).filter(name=>/\.(mjs|js)$/.test(name)).sort();
const runtimeVersion=createRuntimeVersion(html,[...moduleFiles.map(name=>['web/'+name,fs.readFileSync(path.join(dist,'web',name))]),...fs.readdirSync(dist).filter(name=>/\.(mjs|js)$/.test(name)).map(name=>[name,fs.readFileSync(path.join(dist,name))])]);
const engineBuild={memoryVersion:1,runtimeVersion,wasm:runtimeNames['vcmiclient.wasm'],sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dist,runtimeNames['vcmiclient.wasm']))).digest('hex'),mobile:{width:800,height:600},assetCacheBytes:16*1024*1024};manifest.engine=engineBuild;fs.writeFileSync(path.join(dist,'engine-build.json'),JSON.stringify(engineBuild));
for(const name of fs.readdirSync(path.join(dist,'web')).filter(name=>/\.(mjs|js)$/.test(name))){const file=path.join(dist,'web',name);fs.writeFileSync(file,versionModuleImports(fs.readFileSync(file,'utf8'),runtimeVersion));}
html=versionScriptTags(versionModuleImports(html,runtimeVersion),runtimeVersion);
fs.copyFileSync('web/hosting-bootstrap.mjs',path.join(dist,'hosting-bootstrap.mjs'));
let index=fs.readFileSync('web/hosting-index.html','utf8');let storagePage=fs.readFileSync('web/storage.html','utf8');
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
fs.copyFileSync('web/coi-serviceworker.js',path.join(dist,'coi-serviceworker.js'));
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
