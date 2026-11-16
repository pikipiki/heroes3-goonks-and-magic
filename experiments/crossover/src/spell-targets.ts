import type {NativeUnit} from './native-bridge.js';
export function eligibleSpellTarget(unit:NativeUnit,kind:string,ids:number[]|undefined,revive=false):boolean{
 if(unit.auxiliary||unit.stackId===undefined||unit.stackId<0||['none','ground'].includes(kind))return false;
 if(ids&&!ids.includes(unit.stackId))return false;
 if(['ally','teleport','sacrifice'].includes(kind)&&unit.owner!==0)return false;
 if(kind==='enemy'&&unit.owner!==1)return false;
 return revive?unit.hp<=0||!!ids:unit.hp>0;
}
export function spellTargetHint(target:string,revive=false):string{
 if(revive)return 'Choisis une troupe alliée tombée, surlignée en doré.';
 if(target==='ally')return 'Choisis une troupe alliée surlignée en vert.';
 if(target==='enemy')return 'Choisis un ennemi surligné en rouge.';
 if(target==='teleport')return 'Choisis une troupe alliée, puis sa destination.';
 if(target==='sacrifice')return 'Choisis une troupe tombée, puis une troupe à sacrifier.';
 if(target==='ground')return 'Choisis un point sur le terrain.';
 return 'Choisis une troupe surlignée sur le terrain.';
}
