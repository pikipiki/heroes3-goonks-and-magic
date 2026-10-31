export const canCloseTavern=state=>state?.mode==='dialog'&&state.dialogKind==='tavern';
// Preserve the native icon's position but give a finger a stable 44px target.
// Coordinates remain logical game points regardless of framebuffer resolution.
export function nativeCloseTarget(state,layout,width,height){
 const r=state?.dialogCloseRect;
 if(!canCloseTavern(state)||!layout||!r||r.w<=0||r.h<=0)return null;
 const cx=layout.dx+(r.x+r.w/2-layout.x)*layout.scale,cy=layout.dy+(r.y+r.h/2-layout.y)*layout.scale;
 if(cx<0||cy<0||cx>width||cy>height)return null;
 const w=Math.min(width,Math.max(44,r.w*layout.scale)),h=Math.min(height,Math.max(44,r.h*layout.scale));
 return{x:Math.max(0,Math.min(width-w,cx-w/2)),y:Math.max(0,Math.min(height-h,cy-h/2)),w,h};
}
