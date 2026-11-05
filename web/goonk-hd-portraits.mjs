import portraits from './goonk-hd-portraits-data.mjs';
const images=new Map();
export const hasHDCreaturePortrait=unit=>!!portraits[String(unit?.key||'').split(':').at(-1).toLowerCase()];
export function hdCreaturePortrait(unit){const key=String(unit?.key||'').split(':').at(-1).toLowerCase(),rect=portraits[key];if(!rect)return null;const image=images.get(rect.file);return image?.complete&&image.naturalWidth?{image,...rect}:null;}
export function paintHDCreature(ctx,portrait,w,h){const z=Math.min(w*.96/portrait.w,h*.96/portrait.h),dw=portrait.w*z,dh=portrait.h*z;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(portrait.image,portrait.x,portrait.y,portrait.w,portrait.h,(w-dw)/2,(h-dh)/2,dw,dh);}
// Three shared sheets cover all 21 forms, decoded while the game initializes.
if(typeof Image!=='undefined')for(const file of new Set(Object.values(portraits).map(p=>p.file))){const image=new Image();images.set(file,image);image.onload=()=>{window.goonkPortraitVersion=(window.goonkPortraitVersion||0)+1;window.dispatchEvent(new Event('goonk-hd-portraits'));};image.src=new URL('./'+file,import.meta.url).href;image.decode?.().catch(()=>{});}
