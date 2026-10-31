import sharp from 'sharp';
// Discard isolated fragments from neighboring atlas cells before making game assets.
export async function isolatedBuilding(tile){
 const {data,info}=await sharp(tile).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h}=info,seen=new Uint8Array(w*h);let largest=[];
 for(let p=0;p<w*h;p++){
  if(seen[p]||data[p*4+3]<64)continue;
  const component=[p];seen[p]=1;
  for(let i=0;i<component.length;i++){
   const q=component[i],x=q%w,y=Math.floor(q/w);
   for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){if(xx<0||xx>=w||yy<0||yy>=h)continue;const n=yy*w+xx;if(!seen[n]&&data[n*4+3]>=64){seen[n]=1;component.push(n);}}
  }
  if(component.length>largest.length)largest=component;
 }
 const keep=new Uint8Array(w*h);
 for(const q of largest){const x=q%w,y=Math.floor(q/w);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h)keep[yy*w+xx]=1;}}
 for(let p=0;p<keep.length;p++)if(!keep[p])data[p*4+3]=0;
 return sharp(data,{raw:{width:w,height:h,channels:4}}).trim().png().toBuffer();
}

