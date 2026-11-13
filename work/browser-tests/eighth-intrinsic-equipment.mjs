/** Native inventory actions only: random lobby treasures must not alter intrinsic stat controls. */
import assert from 'node:assert/strict';
export async function clearIntrinsicEquipment({state,cmd,wait}) {
 const moved=[];
 for(let n=0;n<19;n++) {
  const s=await state();assert.equal(s.mode,'hero');
  const worn=s.heroWindow.slots.find(a=>a.name&&(a.slot<13||a.slot===18));
  if(!worn)return{state:s,moved};
  assert(worn.movable&&!worn.locked,'Owned starting treasure must be removable through the existing UI');
  const destination=19+s.backpackCount;
  await cmd(62,worn.slot);await wait(()=>!!goonkMobileState.heroWindow?.picked);
  await cmd(62,destination);await wait(slot=>!goonkMobileState.heroWindow?.picked&&!goonkMobileState.heroWindow?.slots.find(a=>a.slot===slot)?.name,worn.slot);
  moved.push({slot:worn.slot,name:worn.name,icon:worn.icon,destination});
 }
 throw Error('Too many worn artifacts in intrinsic fixture');
}
