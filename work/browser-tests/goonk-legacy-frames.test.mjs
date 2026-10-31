import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {isolatedBuilding} from './goonk-building-art.mjs';
test('legacy combat cleanup preserves the canvas and erases adjacent poses including hidden RGB',async()=>{
 const data=Buffer.alloc(450*400*4);
 const fill=(x,y,w,h,color)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)data.set(color,(yy*450+xx)*4);};
 fill(160,180,70,75,[255,140,0,255]);fill(171,162,56,5,[140,0,255,255]);fill(240,200,7,30,[255,140,0,255]);fill(80,60,4,4,[255,0,255,0]);
 const png=await sharp(data,{raw:{width:450,height:400,channels:4}}).png().toBuffer();
 const {data:clean,info}=await sharp(await isolatedBuilding(png,{trim:false})).raw().toBuffer({resolveWithObject:true});assert.equal(info.width,450);assert.equal(info.height,400);
 assert.deepEqual([...clean.subarray((200*450+180)*4,(200*450+180)*4+4)],[255,140,0,255]);
 for(const [x,y]of[[180,164],[242,210],[81,61]])assert.deepEqual([...clean.subarray((y*450+x)*4,(y*450+x)*4+4)],[0,0,0,0]);
 const trimmed=await sharp(await isolatedBuilding(png)).metadata();assert.equal(trimmed.width,70);assert.equal(trimmed.height,75);
});
