import portraits from './goonk-hd-portraits-data.mjs';
import castlePortraits from './castle-hd-portraits-data.mjs';
import factionPortraits from './faction-hd-portraits-data.mjs';

const images = new Map();
function portraitRect(unit) {
  const key = String(unit?.key || '').toLowerCase();
  if (key.startsWith('goonk:') || !key.includes(':')) return portraits[key.split(':').at(-1)];
  return castlePortraits[key] || factionPortraits[key];
}

function loadSheet(file) {
  if (images.has(file)) return images.get(file);
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  images.set(file, image);
  image.src = new URL('./' + file, import.meta.url).href;
  void image.decode().then(() => {
    window.goonkPortraitVersion = (window.goonkPortraitVersion || 0) + 1;
    window.dispatchEvent(new Event('goonk-hd-portraits'));
  }).catch(() => {});
  return image;
}

export const hasHDCreaturePortrait = unit => !!portraitRect(unit);
export function hdCreaturePortrait(unit) {
  const rect = portraitRect(unit);
  if (!rect) return null;
  const image = loadSheet(rect.file);
  return image?.complete && image.naturalWidth ? { image, ...rect } : null;
}

export function paintHDCreature(ctx,portrait,w,h){const z=Math.min(w*.96/portrait.w,h*.96/portrait.h),dw=portrait.w*z,dh=portrait.h*z;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(portrait.image,portrait.x,portrait.y,portrait.w,portrait.h,(w-dw)/2,(h-dh)/2,dw,dh);}

// Keep the Goonk sheets ready at boot. Other factions load their sheets on demand.
for (const file of new Set(Object.values(portraits).map(p => p.file))) loadSheet(file);
