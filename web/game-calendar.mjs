export function gameDate(day){
 if(!Number.isInteger(day)||day<1)return null;
 const weekday=(day-1)%7+1,week=Math.floor((day-1)/7)%4+1,month=Math.floor((day-1)/28)+1;
 return {weekday,week,month,untilNextWeek:8-weekday};
}
export function createGameCalendar(root){
 const calendar=document.createElement('div');calendar.className='mobile-calendar';calendar.hidden=true;calendar.setAttribute('role','status');
 const date=document.createElement('span'),next=document.createElement('span');next.className='calendar-next-week';calendar.append(date,next);root.querySelector('.mobile-top').append(calendar);
 return state=>{
  const value=gameDate(state.day),visible=!!value&&state.mode!=='battle'&&state.resources?.length===7;
  calendar.hidden=!visible;root.dataset.hasCalendar=String(visible);if(!visible)return;
  const label=`Jour ${value.weekday}/7 · Semaine ${value.week} · Mois ${value.month}`,remaining=value.untilNextWeek===1?'Nouvelle semaine demain':`Nouvelle semaine dans ${value.untilNextWeek} j`;
  if(date.textContent!==label)date.textContent=label;if(next.textContent!==remaining)next.textContent=remaining;
  calendar.title=`Jour ${state.day} de la partie. ${label}. ${remaining}.`;
 };
}
