import {chromium,webkit} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {silenceTestAudio} from './silent-audio.mjs';
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:760,height:1000}});await silenceTestAudio(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  // Serve the exact committed native screenshots locally before publication.
  await page.route('https://cdn.jsdelivr.net/**/captures/*.jpg',route=>route.fulfill({path:path.resolve('docs/design-prototypes/material3/captures',new URL(route.request().url()).pathname.split('/').at(-1)),contentType:'image/jpeg'}));
  await page.setContent('<!doctype html><meta charset=utf-8>'+fs.readFileSync('docs/design-prototypes/material3/prototypes.html','utf8'));
  const data=await page.locator('#heroes-real-gallery').evaluate(r=>r.realCaptureGallery.data);
  assert.equal(data.samples.length,96);
  for(const screen of new Set(data.samples.map(s=>s.screen)))for(const viewport of ['360x640','320x568','640x360','568x280']){
   await page.selectOption('[data-screen]',screen);await page.selectOption('[data-viewport]',viewport);
   const images=await page.locator('#heroes-real-gallery img').evaluateAll(async nodes=>{await Promise.all(nodes.map(n=>n.decode()));return nodes.map(n=>({width:n.naturalWidth,height:n.naturalHeight,alt:n.alt}));});
   const [width,height]=viewport.split('x').map(Number);
   for(const image of images){assert.equal(image.width,width);assert.equal(image.height,height);assert(image.alt.includes('capture native'));}
  }
  assert.deepEqual(errors,[]);console.log('PASS',name,'96 genuine native images, screen/format selection and exact dimensions');
 }finally{await browser.close();}
}
