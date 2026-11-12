import {setLanguage} from '../web/i18n.mjs';
setLanguage('fr');
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import path from 'node:path';import {pathToFileURL,fileURLToPath}from'node:url';
const project=process.env.TUM_PROJECT_ROOT||fileURLToPath(new URL('../',import.meta.url));
const {RESOURCE_TYPES,compactResource,resourceDescriptors,resourceIconURL,formatResourceCost}=await import(pathToFileURL(path.join(project,'web/resources.mjs')));
const base=RESOURCE_TYPES.map(([key,name],id)=>({id,key,name,scope:'core'}));
const mithril={id:7,key:'mithril',name:'Mithril',scope:'wake-of-gods.mithril',icon:'mithril/small.png'};
test('seven-resource baseline, labels, icons and rounding stay unchanged',()=>{
 assert.deepEqual(RESOURCE_TYPES.map(x=>x[0]),['wood','mercury','ore','sulfur','crystal','gems','gold']);assert.equal(formatResourceCost([1,2,3,4,5,6,7],base),'1 bois · 2 mercure · 3 minerai · 4 soufre · 5 cristaux · 6 gemmes · 7 or');
 for(const[n,label]of [[0,'0'],[999,'999'],[1000,'1k'],[1499,'1,4k'],[999999,'999,9k'],[1250000,'1,2M']])assert.equal(compactResource(n),label);
 const descriptors=resourceDescriptors([1,2,3,4,5,6,7]);assert.equal(descriptors.length,7);assert.ok(descriptors.every(x=>resourceIconURL(x).endsWith('/h3-theme/resource-'+x.key+'.png')));
});
test('Mithril amounts and recruitment/building costs use registered metadata',()=>{
 const metadata=[...base,mithril];const rows=resourceDescriptors([1,2,3,4,5,6,20000,12],metadata);assert.equal(rows[7].name,'Mithril');assert.equal(rows[7].value,12);assert.equal(rows[7].scope,'wake-of-gods.mithril');
 assert.equal(formatResourceCost([0,0,0,0,0,0,5000,3],metadata),'5000 or · 3 Mithril');assert.equal(formatResourceCost([0,0,0,0,0,0,0,-2],metadata),'-2 Mithril');
 assert.equal(formatResourceCost([0,0,0,0,0,0,0,0],metadata),'');
});
test('non-contiguous engine IDs still align amounts and costs by the native registry order',()=>{
 const metadata=[...base,{...mithril,id:12}];const rows=resourceDescriptors([0,0,0,0,0,0,7,9],metadata);assert.equal(rows[7].id,12);assert.equal(rows[7].value,9);assert.equal(formatResourceCost([0,0,0,0,0,0,0,2],metadata),'2 Mithril');
});
test('Mithril icon uses actual owning-mod manifest URL, not another mods matching filename',()=>{
 const entries=[{path:'Mods/other/content/sprites/mithril/small.png',url:'wrong.png'},{path:'Mods/wake-of-gods/Mods/mithril/content/sprites/mithril/small.png',url:'original-mithril.png'}];
 assert.equal(resourceIconURL({...mithril,baseline:false},entries),'original-mithril.png');assert.equal(resourceIconURL({...mithril,scope:'missing',baseline:false},entries),'');
 const png=fs.readFileSync(path.join(project,'mod/wake-of-gods/Mods/mithril/content/sprites/mithril/small.png'));assert.equal(png.subarray(1,4).toString(),'PNG');assert.equal(png.readUInt32BE(16),20);assert.equal(png.readUInt32BE(20),18);
});
test('unknown extra resources remain visible as named counts and costs instead of undefined',()=>{
 const rows=resourceDescriptors([0,0,0,0,0,0,0,4]);assert.equal(rows[7].name,'Ressource 8');assert.equal(rows[7].value,4);assert.equal(resourceIconURL(rows[7]),'');assert.equal(formatResourceCost([0,0,0,0,0,0,0,4]),'4 Ressource 8');
 assert.equal(resourceDescriptors([1,2,3,4,5,6,7],null).length,7);
});
