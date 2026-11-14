import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {mediaManifest,mediaRoot,collectCampaignMedia,mediaCohortSha256} from '../scripts/era-bridge/campaigns/import-media.mjs';
import {publishCampaignMedia} from '../scripts/publish-campaign-media.mjs';import {campaignMedia} from '../web/campaign-media-data.mjs';import {sha256} from '../scripts/era-bridge/campaigns/importer.mjs';
import {buildNativeMetadata,metadataFile} from '../scripts/era-bridge/campaigns/build-native-metadata.mjs';
test('original artwork cohort and browser index retain all original image bytes',()=>{
 const actual=collectCampaignMedia(mediaRoot+'/data/zvs/cmp.res',mediaRoot+'/data');
 assert.deepEqual(actual.manifest,JSON.parse(fs.readFileSync(mediaManifest)));assert.equal(actual.manifest.source.cohortSha256,mediaCohortSha256);
 assert.deepEqual(campaignMedia,Object.fromEntries(actual.manifest.images.map(({key,url,width,height})=>[key,{url,width,height}])));
 assert.equal(actual.manifest.images.length,78);assert.equal(actual.manifest.movies.length,4);
 const puzzle=actual.manifest.images.find(i=>i.key==='cmp.res/11_013.bmp');assert.equal(puzzle.width,640);assert.equal(puzzle.height,360);
});
test('site artwork publishing preserves bytes and names assets by their digest',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-campaign-media-'));
 try{publishCampaignMedia(dir);for(const image of JSON.parse(fs.readFileSync(mediaManifest)).images){const bytes=fs.readFileSync(path.join(dir,'web',image.url));assert.equal(bytes.length,image.size);assert.equal(sha256(bytes),image.sha256);}}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('campaign dependency repair metadata is regenerated from verified original H3C files',()=>{
 const {config,inventory}=buildNativeMetadata();assert.deepEqual(JSON.parse(fs.readFileSync(metadataFile)),config);assert.deepEqual(JSON.parse(fs.readFileSync('outputs/wog-priorities-0.4.147/campaign-runtime/original-metadata.json')),inventory);
 assert.deepEqual(config.rules.map(r=>r.id),['zc1']);assert.equal(inventory.originalCampaignsEnabled,false);
});
test('native media path lookup resolves only virtual assets and rejects traversal',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-media-paths-'));
 try{const binary=path.join(dir,'test');execFileSync(process.env.CXX||'c++',['-std=c++17','-Wall','-Wextra','-Werror','tests/native/EraCampaignMedia.test.cpp','-o',binary]);execFileSync(binary);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
