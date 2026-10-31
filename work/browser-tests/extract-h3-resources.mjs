import{frame}from'./extract-h3-controls.mjs';import sharp from'sharp';
const names=['wood','mercury','ore','sulfur','crystal','gems','gold'];
for(let id=0;id<names.length;id++){const {png}=await frame('SMALRES.DEF',id);await sharp(png).trim().png().toFile(new URL('../../web/h3-theme/resource-'+names[id]+'.png',import.meta.url).pathname);}console.log('Seven original Heroes III resource icons extracted.');
