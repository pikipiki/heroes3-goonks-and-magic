import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const reference=JSON.parse(fs.readFileSync(new URL('./h3-animation-reference.json',import.meta.url),'utf8'));
const families={pink:['gnoll'],lancer:['pikeman','halberdier'],archer:['archer'],fart:['ogre','ogre','orc'],vomit:['ogre','ogre','beholder'],blue:['cyclops'],fire:['mage']};
export function motionProfile(key,royal=false){const family=families[key];if(!family)throw Error('Unknown Goonk family '+key);const movement=reference.creatures[family[royal?1:0]||family[0]],shot=reference.creatures[family[2]||family[royal?1:0]||family[0]];return {movement,shot};}
const sample=(frames,count)=>Array.from({length:count},(_,i)=>frames[Math.floor(i*frames.length/count)%frames.length]);
const segment=(from,to,count)=>Array.from({length:count},(_,i)=>Math.round(from+(to-from)*(count===1?1:i/(count-1))));
export function actionTimeline(frames,count,impact=Math.floor(count/2)){
 if(count<2)return[frames[0]];
 // Anticipation, impact, recovery: holds change timing, never crossfade two bodies.
 const release=Math.min(6,frames.length-1),before=segment(0,release,impact+1),after=segment(release,frames.length-1,count-impact);
 return [...before,...after.slice(1)].map(i=>frames[i]);
}
export function applyMotionProfile(config,stem,key,royal=false){
 const {movement:m,shot}=motionProfile(key,royal),walk=Array.from({length:12},(_,i)=>`goonk/${stem}-v3-walk-${i}.png`),attack=Array.from({length:12},(_,i)=>`goonk/${stem}-v3-attack-${i}.png`),idle=Array.from({length:32},(_,i)=>`goonk/${stem}-v3-idle-${i}.png`),shoot=shot.groups[15];
 const groups=new Map(config.sequences.map(s=>[s.group,s]));
 const set=(group,frames)=>groups.set(group,{...(groups.get(group)||{group,generateShadow:1,generateOverlay:1}),frames});
 set(0,sample(walk,m.groups[0]));set(1,sample(idle,m.groups[1]));set(2,sample(idle,m.groups[2]));
 for(const group of [7,8])set(group,sample(idle,m.groups[group]));
 for(const group of [11,12,13])set(group,actionTimeline(attack,m.groups[group]||m.groups[12]));
 for(const group of [14,15,16]){if(shoot)set(group,actionTimeline(attack,shot.groups[group]||shoot,shot.climax-1));else groups.delete(group);}
 for(const group of [17,18,19])set(group,actionTimeline(attack,shoot||m.groups[12],shoot?shot.climax-1:Math.floor(m.groups[12]/2)));
 const start=m.groups[20],end=m.groups[21];
 if(start)set(20,[...sample(idle,Math.max(1,start-1)),walk[0]].slice(-start));else groups.delete(20);
 if(end)set(21,[walk.at(-1),...sample(idle,Math.max(0,end-2)),idle[0]].slice(-end));else groups.delete(21);
 config.sequences=[...groups.values()].sort((a,b)=>a.group-b.group);return config;
}
export function applyCreatureTiming(creature,key,royal=false){const {movement,shot}=motionProfile(key,royal);creature.graphics.timeBetweenFidgets=movement.fidget;creature.graphics.animationTime={walk:movement.walk,attack:shot.attack,idle:reference.idleFramesPerSecond};if(creature.graphics.missile)creature.graphics.missile.attackClimaxFrame=shot.climax;}
export function rebuildMotionProfiles(imageDir){
 const file=path.resolve(imageDir,'../../config/creatures.json'),creatures=JSON.parse(fs.readFileSync(file));
 for(const creature of Object.values(creatures)){
  const stem=path.basename(creature.graphics.animation),royal=stem.endsWith('-evo'),key=stem.replace(/-evo$/,'');const config=path.join(imageDir,stem+'.json');
  fs.writeFileSync(config,JSON.stringify(applyMotionProfile(JSON.parse(fs.readFileSync(config)),stem,key,royal),null,2)+'\n');applyCreatureTiming(creature,key,royal);
 }
 fs.writeFileSync(file,JSON.stringify(creatures,null,2)+'\n');return creatures;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){rebuildMotionProfiles(path.resolve(process.argv[2]||'../../mod/goonk/Content/Sprites/goonk'));console.log('Native-style animation profiles applied to 14 Goonks');}
