export function mapOverviewGeometry(map,width,height){
 const r=map?.rect;if(!r||!(r.w>0)||!(r.h>0)||!(width>0)||!(height>0))return null;
 const scale=Math.min(width/r.w,height/r.h);return{x:(width-r.w*scale)/2,y:(height-r.h*scale)/2,w:r.w*scale,h:r.h*scale};
}
export function mapOverviewTarget(map,x,y,width,height){
 const g=mapOverviewGeometry(map,width,height);if(!g||!Number.isFinite(x)||!Number.isFinite(y)||x<g.x||y<g.y||x>g.x+g.w||y>g.y+g.h)return null;
 return{x:map.rect.x+Math.min(map.rect.w-1,Math.floor((x-g.x)/g.w*map.rect.w)),y:map.rect.y+Math.min(map.rect.h-1,Math.floor((y-g.y)/g.h*map.rect.h))};
}
export function mapOverviewViewport(map,layout,width,height){
 const g=mapOverviewGeometry(map,width,height),v=map?.view,a=map?.viewport;if(!g||!(v?.w>0)||!(v?.h>0)||!a||!layout||!(map.width>0)||!(map.height>0))return null;
 const left=Math.max(layout.x,v.x),top=Math.max(layout.y,v.y),right=Math.min(layout.x+layout.w,v.x+v.w),bottom=Math.min(layout.y+layout.h,v.y+v.h);if(right<=left||bottom<=top)return null;
 const clamp=(n,max)=>Math.max(0,Math.min(max,n));
 const x=clamp(a.x+(left-v.x)/v.w*a.w,map.width),y=clamp(a.y+(top-v.y)/v.h*a.h,map.height),x2=clamp(a.x+(right-v.x)/v.w*a.w,map.width),y2=clamp(a.y+(bottom-v.y)/v.h*a.h,map.height);if(x2<=x||y2<=y)return null;
 return{x:g.x+x/map.width*g.w,y:g.y+y/map.height*g.h,w:Math.max(1,(x2-x)/map.width*g.w),h:Math.max(1,(y2-y)/map.height*g.h)};
}
export function paintMapOverview(ctx,source,map,layout){
 const w=ctx.canvas.width,h=ctx.canvas.height,g=mapOverviewGeometry(map,w,h);if(!g)return;
 const r=map.rect,sx=source.width/800,sy=source.height/600;ctx.save();ctx.fillStyle='#080906';ctx.fillRect(0,0,w,h);ctx.imageSmoothingEnabled=false;
 const atlas=typeof window!=='undefined'&&window.goonkMinimapLevel===map.level?window.goonkMinimapAtlas:null;
 if(atlas)ctx.drawImage(atlas,0,0,atlas.width,atlas.height,g.x,g.y,g.w,g.h);
 else ctx.drawImage(source,r.x*sx,r.y*sy,r.w*sx,r.h*sy,g.x,g.y,g.w,g.h);
 const area=mapOverviewViewport(map,layout,w,h);if(area){ctx.strokeStyle='#000';ctx.lineWidth=5;ctx.strokeRect(area.x,area.y,area.w,area.h);ctx.strokeStyle='#ffe894';ctx.lineWidth=2;ctx.strokeRect(area.x,area.y,area.w,area.h);}ctx.restore();
}
