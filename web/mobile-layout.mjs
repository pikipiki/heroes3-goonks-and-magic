export function fitRegion(viewWidth,viewHeight,region,zoom=1,focus){
 const base=Math.min(viewWidth/region.w,viewHeight/region.h),scale=base*zoom;
 const width=Math.min(region.w,viewWidth/scale),height=Math.min(region.h,viewHeight/scale);
 const cx=focus?.x??region.x+region.w/2,cy=focus?.y??region.y+region.h/2;
 return {x:Math.max(region.x,Math.min(region.x+region.w-width,cx-width/2)),y:Math.max(region.y,Math.min(region.y+region.h-height,cy-height/2)),w:width,h:height,scale,dx:(viewWidth-width*scale)/2,dy:(viewHeight-height*scale)/2};
}
export function scenePoint(x,y,layout){if(x<layout.dx||y<layout.dy||x>layout.dx+layout.w*layout.scale||y>layout.dy+layout.h*layout.scale)return null;return {x:Math.round(layout.x+(x-layout.dx)/layout.scale),y:Math.round(layout.y+(y-layout.dy)/layout.scale)};}
export const buildReason=state=>({0:'Un capitole existe déjà',1:'Un accès à l’eau est nécessaire',2:'Indisponible',4:'Déjà construit',5:'Une construction par jour',6:'Ressources insuffisantes',8:'Prérequis manquants',9:'Construire le logement de base'}[state]||'Prérequis non remplis');
export function affordable(unit,resources=[]){let max=unit.count;unit.cost?.forEach((cost,i)=>{if(cost>0)max=Math.min(max,Math.floor((resources[i]||0)/cost));});return Math.max(0,max);}

// Keep the embedded initiative queue and every battlefield row visible.
export const BATTLE_REGION={x:0,y:0,w:800,h:600};
export const mapDrag=(dx,dy,scale)=>({x:Math.round(-dx/scale),y:Math.round(-dy/scale)});
export function battleHex(point){
 let best,distance=Infinity;
 for(let row=0;row<11;row++)for(let col=1;col<16;col++){const p={x:36+(row%2===0?22:0)+44*col,y:112+42*row};const d=(p.x-point.x)**2+(p.y-point.y)**2;if(d<distance){best=p;distance=d;}}
 return best;
}

export const TOWN_REGION={x:0,y:0,w:800,h:374};
export function fitTown(width,height,focus,whole=false){const r=TOWN_REGION,base=Math.min(width/r.w,height/r.h),cover=Math.max(width/r.w,height/r.h);return fitRegion(width,height,r,whole?1:cover/base,focus);}
