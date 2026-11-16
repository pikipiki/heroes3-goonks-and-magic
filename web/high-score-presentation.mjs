export function highScorePresentation(score, language='en') {
 const fr=language==='fr',won=!!score.won;
 return {
  title:won?(fr?'Victoire !':'Victory!'):(fr?'Défaite':'Defeat'),
  queryId:score.queryId,
  lines:[score.name,score.campaign?(fr?`${score.completedScenarios} scénarios terminés`:`${score.completedScenarios} scenarios completed`):'',fr?`${score.days} jours · Score : ${score.score}`:`${score.days} days · Score: ${score.score}`,score.unranked?(fr?'Partie avec codes de triche':'Game with cheats'):''].filter(Boolean),
  ...(won?{scriptDialog:{kind:'extended',queryId:score.queryId,inputLabel:fr?'Nom':'Name',draft:{text:score.playerName||'',selection:0},canCancel:true,choices:[]}}:{}),
 };
}
