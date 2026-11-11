const masks=new WeakMap();
// Cache a tinted alpha silhouette, then dilate it by a few screen pixels.
export function paintBuildingOutline(ctx,picture,x,y,w,h,color='#ff453d'){
 let mask=masks.get(picture);if(!mask){mask=document.createElement('canvas');mask.width=picture.naturalWidth||picture.width;mask.height=picture.naturalHeight||picture.height;const c=mask.getContext('2d');c.drawImage(picture,0,0);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,mask.width,mask.height);masks.set(picture,mask);}
 for(const [dx,dy]of [[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,-2],[-2,2],[2,2]])ctx.drawImage(mask,x+dx,y+dy,w,h);
 ctx.drawImage(picture,x,y,w,h);
}
