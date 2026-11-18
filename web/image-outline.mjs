const masks=new WeakMap();
// Cache a tinted alpha silhouette, then dilate it by a few screen pixels.
export function paintBuildingOutline(ctx,picture,x,y,w,h,color='#ff453d',crop=null){
 let mask=masks.get(picture);if(!mask){mask=document.createElement('canvas');mask.width=picture.naturalWidth||picture.width;mask.height=picture.naturalHeight||picture.height;const c=mask.getContext('2d');c.drawImage(picture,0,0);c.globalCompositeOperation='source-in';c.fillStyle=color;c.fillRect(0,0,mask.width,mask.height);masks.set(picture,mask);}
 const draw=(image,dx=0,dy=0)=>{if(crop){const [sx,sy,sw,sh]=crop,iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;ctx.drawImage(image,sx*iw,sy*ih,sw*iw,sh*ih,x+dx,y+dy,w,h);}else ctx.drawImage(image,x+dx,y+dy,w,h);};
 for(const [dx,dy]of [[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,-2],[-2,2],[2,2]])draw(mask,dx,dy);
 draw(picture);
}
