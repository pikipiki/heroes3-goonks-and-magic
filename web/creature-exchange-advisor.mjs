// Pure scoring and tactical recommendation engine for creature exchange.
// Evaluates stats, stack count, special abilities/effects, and team compatibility
// (undead morale penalty, adventure map speed, ranged role synergy).

const HIGH_IMPACT_ABILITY_PATTERNS=[
 /double|deux coups|two attacks|twice|frappe deux/i,
 /resurrect|résurrect|réanim|heal|soin/i,
 /spell|sort|cast|lance|magic/i,
 /breath|souffle|two hex|deux cases/i,
 /drain|vol de vie|life drain|vampir/i,
 /regenerat|régénér/i,
 /petrif|pétrif|paraly|blind|aveugl|death stare|regard mortel|fear|peur/i,
 /ignore.*def|ignor.*déf|joust|joute|charge/i,
 /shoot.*no.*melee|aucune pénalité|no melee penalty|no obstacle/i,
 /magic.*immun|immun.*magi|resist/i
];

function num(value,fallback=0){
 const parsed=Number(value);
 return Number.isFinite(parsed)?parsed:fallback;
}

function isLivingWithMorale(unit){
 if(!unit?.name)return false;
 const flags=unit.nativeFlags||{};
 if(flags.undead||flags.nonLiving||flags.noMorale)return false;
 if(flags.living===true)return true;
 return true;
}

function isUndead(unit){
 return Boolean(unit?.nativeFlags?.undead);
}

function isShooter(unit){
 return Boolean(unit?.shooter||num(unit?.shots)>0);
}

function abilityBonus(unit){
 const flags=unit?.nativeFlags||{};
 const abilities=Array.isArray(unit?.abilities)?unit.abilities.filter(Boolean):[];
 let bonus=0;
 const tags=[];
 if(isShooter(unit)){bonus+=0.22;tags.push('shooter');}
 if(flags.flying){bonus+=0.12;tags.push('flying');}
 if(flags.blocksRetaliation){bonus+=0.18;tags.push('noRetaliation');}
 if(flags.attacksAllAdjacent){bonus+=0.15;tags.push('allAdjacent');}
 if(flags.mindImmune){bonus+=0.08;tags.push('mindImmune');}
 if(flags.chargeImmune){bonus+=0.04;tags.push('chargeImmune');}
 let matchedHighImpact=0;
 for(const text of abilities){
  const s=String(text);
  if(HIGH_IMPACT_ABILITY_PATTERNS.some(rx=>rx.test(s)))matchedHighImpact++;
 }
 const genericCount=Math.min(6,abilities.length);
 bonus+=Math.min(0.24,genericCount*0.035);
 bonus+=Math.min(0.25,matchedHighImpact*0.07);
 const rank=Math.max(0,num(unit?.rank,0));
 if(rank>0)bonus+=Math.min(0.4,rank*0.05);
 return {multiplier:1+bonus,tags,abilityCount:abilities.length,matchedHighImpact,rank};
}

export function scoreCreatureStack(unit){
 if(!unit?.name||num(unit.count)<=0){
  return {total:0,unitPower:0,statPower:0,engineValue:0,effectsMultiplier:1,tags:[],abilityCount:0,rank:0};
 }
 const count=Math.max(1,Math.floor(num(unit.count,1)));
 const attack=Math.max(0,num(unit.attack,1));
 const defense=Math.max(0,num(unit.defense,1));
 const dmgMin=Math.max(1,num(unit.damageMin,1));
 const dmgMax=Math.max(dmgMin,num(unit.damageMax,dmgMin));
 const avgDmg=(dmgMin+dmgMax)/2;
 const health=Math.max(1,num(unit.health,1));
 const speed=Math.max(1,num(unit.speed,3));
 const statFactor=(1+attack*0.05)*(1+defense*0.04);
 const statPower=avgDmg*statFactor*Math.sqrt(health)*(0.75+speed*0.05);
 const engineValue=Math.max(num(unit.fightValue,0),num(unit.aiValue,0));
 const baseUnitPower=engineValue>0?(engineValue*0.55+statPower*4.2):(statPower*8.0);
 const effects=abilityBonus(unit);
 const unitPower=baseUnitPower*effects.multiplier;
 const total=Math.round(unitPower*count);
 return {
  total,
  unitPower:Math.round(unitPower),
  statPower:Math.round(statPower),
  engineValue:Math.round(engineValue),
  effectsMultiplier:Number(effects.multiplier.toFixed(2)),
  tags:effects.tags,
  abilityCount:effects.abilityCount,
  rank:effects.rank
 };
}

function minArmySpeed(units){
 const speeds=units.filter(u=>u?.name&&num(u.count)>0).map(u=>Math.max(1,num(u.speed,4)));
 return speeds.length?Math.min(...speeds):0;
}

function teamCompatibility(candidate,currentUnits,resultingUnits,candidateScore,language='fr'){
 const fr=language==='fr';
 const notes=[];
 let synergyDelta=0;

 // 1. Undead / living morale compatibility
 const hadUndead=currentUnits.some(isUndead);
 const hasLivingBefore=currentUnits.some(isLivingWithMorale);
 const hasUndeadAfter=resultingUnits.some(isUndead);
 const hasLivingAfter=resultingUnits.some(isLivingWithMorale);

 if(isUndead(candidate)&&hasLivingAfter){
  if(!hadUndead){
   const penalty=Math.round(candidateScore*0.18);
   synergyDelta-=penalty;
   notes.push({kind:'warn',text:fr?'Mort-vivant dans une armée vivante (−1 Moral à l’équipe)':'Undead in a living army (−1 team Morale)'});
  }else{
   notes.push({kind:'neutral',text:fr?'Mort-vivant (pénalité de moral déjà active)':'Undead (morale penalty already active)'});
  }
 }else if(hadUndead&&!hasUndeadAfter&&hasLivingAfter){
  const bonus=Math.round(candidateScore*0.12);
  synergyDelta+=bonus;
  notes.push({kind:'good',text:fr?'Supprime la pénalité de moral des morts-vivants (+1 Moral)':'Removes undead morale penalty (+1 Morale)'});
 }else if(hasLivingBefore&&isLivingWithMorale(candidate)&&!hadUndead){
  notes.push({kind:'good',text:fr?'Compatible avec le moral de l’équipe':'Compatible with team morale'});
 }

 // 2. Adventure map speed impact (slowest unit sets hero movement)
 const speedBefore=minArmySpeed(currentUnits);
 const speedAfter=minArmySpeed(resultingUnits);
 if(speedBefore>0&&speedAfter>0){
  const diff=speedAfter-speedBefore;
  if(diff<=-2){
   const penalty=Math.round(candidateScore*Math.min(0.18,Math.abs(diff)*0.04));
   synergyDelta-=penalty;
   notes.push({kind:'warn',text:fr?`Ralentit le déplacement sur carte (vitesse min ${speedBefore} → ${speedAfter})`:`Slows map movement (min speed ${speedBefore} → ${speedAfter})`});
  }else if(diff>=2){
   const bonus=Math.round(candidateScore*Math.min(0.15,diff*0.04));
   synergyDelta+=bonus;
   notes.push({kind:'good',text:fr?`Accélère le déplacement sur carte (vitesse min ${speedBefore} → ${speedAfter})`:`Boosts map movement (min speed ${speedBefore} → ${speedAfter})`});
  }
 }

 // 3. Ranged tactical synergy
 const shootersBefore=currentUnits.filter(isShooter).length;
 const shootersAfter=resultingUnits.filter(isShooter).length;
 if(isShooter(candidate)&&shootersBefore===0){
  const bonus=Math.round(candidateScore*0.15);
  synergyDelta+=bonus;
  notes.push({kind:'good',text:fr?'Apporte un premier tireur à l’équipe':'Adds the army’s first ranged unit'});
 }else if(shootersBefore>0&&shootersAfter===0){
  const penalty=Math.round(candidateScore*0.12);
  synergyDelta-=penalty;
  notes.push({kind:'warn',text:fr?'Supprimerait votre seul tireur':'Would remove your only ranged unit'});
 }

 return {synergyDelta,notes};
}

function buildDetailReasons(candidate,candScore,targetUnit,targetScore,compatNotes,language='fr'){
 const fr=language==='fr';
 const reasons=[];
 const dmg=`${num(candidate.damageMin,1)}–${num(candidate.damageMax,1)}`;
 reasons.push(fr
  ?`Stats : ATQ ${num(candidate.attack,0)} · DEF ${num(candidate.defense,0)} · DÉG ${dmg} · PV ${num(candidate.health,0)} · VIT ${num(candidate.speed,0)}`
  :`Stats: ATK ${num(candidate.attack,0)} · DEF ${num(candidate.defense,0)} · DMG ${dmg} · HP ${num(candidate.health,0)} · SPD ${num(candidate.speed,0)}`);
 reasons.push(fr
  ?`Effectif : ×${num(candidate.count,0)} (score puissance ${candScore.total.toLocaleString('fr-FR')})`
  :`Count: ×${num(candidate.count,0)} (power score ${candScore.total.toLocaleString('en-US')})`);
 if(candScore.tags.length||candScore.abilityCount>0){
  const labels={
   shooter:fr?'Tireur':'Shooter',
   flying:fr?'Vol':'Flying',
   noRetaliation:fr?'Sans riposte':'No retaliation',
   allAdjacent:fr?'Attaque circulaire':'All adjacent',
   mindImmune:fr?'Immun. esprit':'Mind immune',
   chargeImmune:fr?'Anti-charge':'Charge immune'
  };
  const tagText=candScore.tags.map(t=>labels[t]).filter(Boolean);
  const extra=Math.max(0,candScore.abilityCount-tagText.length);
  if(extra>0)tagText.push(fr?`+${extra} capacité${extra>1?'s':''}`:`+${extra} abilit${extra>1?'ies':'y'}`);
  reasons.push((fr?'Effets : ':'Effects: ')+tagText.join(', '));
 }
 if(targetUnit){
  reasons.push(fr
   ?`Comparé à : ${targetUnit.name} ×${targetUnit.count} (score ${targetScore.total.toLocaleString('fr-FR')})`
   :`Compared to: ${targetUnit.name} ×${targetUnit.count} (score ${targetScore.total.toLocaleString('en-US')})`);
 }
 for(const note of compatNotes)reasons.push(note.text);
 return reasons;
}

export function adviseCreatureExchange(candidate,heroRoster=[],language='fr'){
 const fr=language==='fr';
 if(!candidate?.name||num(candidate.count)<=0)return null;
 const candScore=scoreCreatureStack(candidate);
 const occupied=heroRoster.filter(u=>u?.name&&num(u.count)>0);

 // Case 1: Same creature already in hero's army → merge!
 const mergeSlot=occupied.find(u=>u.id!==undefined&&candidate.id!==undefined?u.id===candidate.id:u.name===candidate.name);
 if(mergeSlot){
  const targetScore=scoreCreatureStack(mergeSlot);
  const headline=fr?`Conseillé : fusionner avec ${mergeSlot.name} ×${mergeSlot.count}`:`Recommended: merge with ${mergeSlot.name} ×${mergeSlot.count}`;
  return {
   verdict:'recommended',
   action:'merge',
   targetSlot:mergeSlot.slot??null,
   targetUnit:mergeSlot,
   candidateScore:candScore.total,
   targetScore:targetScore.total,
   netDelta:candScore.total,
   deltaPercent:targetScore.total>0?Math.round((candScore.total/targetScore.total)*100):100,
   headline,
   shortBadge:fr?'Fusion':'Merge',
   reasons:buildDetailReasons(candidate,candScore,mergeSlot,targetScore,[{kind:'good',text:fr?'Même créature : renfort gratuit sans prendre d’emplacement':'Same creature: free reinforcement using no extra slot'}],language)
  };
 }

 // Case 2: Empty slot available (< 7 stacks)
 const emptySlot=heroRoster.find(u=>!u?.name||num(u.count)<=0);
 if(emptySlot){
  const resulting=[...occupied,candidate];
  const compat=teamCompatibility(candidate,occupied,resulting,candScore.total,language);
  const netDelta=candScore.total+compat.synergyDelta;
  const verdict=netDelta>0?'recommended':netDelta>-candScore.total*0.15?'neutral':'not-recommended';
  const headline=verdict==='recommended'
   ?(fr?'Conseillé : ajouter dans un emplacement libre':'Recommended: add to an empty slot')
   :verdict==='neutral'
    ?(fr?'Mitigé : emplacement libre mais impact équipe':'Mixed: empty slot, but team trade-off')
    :(fr?'Déconseillé : pénalise trop votre équipe':'Not recommended: hurts team synergy');
  return {
   verdict,
   action:'add',
   targetSlot:emptySlot.slot??null,
   targetUnit:null,
   candidateScore:candScore.total,
   targetScore:0,
   netDelta,
   deltaPercent:100,
   headline,
   shortBadge:verdict==='recommended'?(fr?'Ajouter':'Add'):verdict==='neutral'?(fr?'Mitigé':'Mixed'):(fr?'Éviter':'Skip'),
   reasons:buildDetailReasons(candidate,candScore,null,null,compat.notes,language)
  };
 }

 // Case 3: Full 7-slot army → evaluate swapping against every slot and pick best net gain
 let best=null;
 for(const slot of occupied){
  const slotScore=scoreCreatureStack(slot);
  const resulting=occupied.map(u=>u===slot?candidate:u);
  const compat=teamCompatibility(candidate,occupied,resulting,candScore.total,language);
  const netDelta=(candScore.total-slotScore.total)+compat.synergyDelta;
  const deltaPercent=slotScore.total>0?Math.round((netDelta/slotScore.total)*100):100;
  if(!best||netDelta>best.netDelta){
   best={slot,slotScore,compat,netDelta,deltaPercent};
  }
 }
 if(!best)return null;
 const verdict=best.deltaPercent>=8?'recommended':best.deltaPercent>=-8?'neutral':'not-recommended';
 const sign=best.deltaPercent>0?'+':'';
 const headline=verdict==='recommended'
  ?(fr?`Conseillé : échanger contre ${best.slot.name} ×${best.slot.count} (${sign}${best.deltaPercent} %)`:`Recommended: swap for ${best.slot.name} ×${best.slot.count} (${sign}${best.deltaPercent}%)`)
  :verdict==='neutral'
   ?(fr?`Équilibré : proche de ${best.slot.name} ×${best.slot.count} (${sign}${best.deltaPercent} %)`:`Even trade: similar to ${best.slot.name} ×${best.slot.count} (${sign}${best.deltaPercent}%)`)
   :(fr?`Déconseillé : plus faible que ${best.slot.name} ×${best.slot.count} (${sign}${best.deltaPercent} %)`:`Not recommended: weaker than ${best.slot.name} ×${best.slot.count} (${sign}${best.deltaPercent}%)`);
 return {
  verdict,
  action:'swap',
  targetSlot:best.slot.slot??null,
  targetUnit:best.slot,
  candidateScore:candScore.total,
  targetScore:best.slotScore.total,
  netDelta:best.netDelta,
  deltaPercent:best.deltaPercent,
  headline,
  shortBadge:verdict==='recommended'?`${sign}${best.deltaPercent}%`:verdict==='neutral'?'≈':`${best.deltaPercent}%`,
  reasons:buildDetailReasons(candidate,candScore,best.slot,best.slotScore,best.compat.notes,language)
 };
}
