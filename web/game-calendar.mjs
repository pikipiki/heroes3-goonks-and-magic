import {getLanguage} from './i18n.mjs';
export function gameDate(day){
 if(!Number.isInteger(day)||day<1)return null;
 const weekday=(day-1)%7+1,week=Math.floor((day-1)/7)%4+1,month=Math.floor((day-1)/28)+1;
 return {weekday,week,month,untilNextWeek:8-weekday};
}
export const canViewWeeklyRecruits=state=>['map','town','fort'].includes(state.mode);
export function createGameCalendar(root){
 const calendar=document.createElement('button');calendar.type='button';calendar.className='mobile-calendar';calendar.dataset.ui='weekly-recruits';calendar.hidden=true;
 const date=document.createElement('span'),next=document.createElement('span');
 const compactDate=document.createElement('span'),compactNext=document.createElement('span');
 next.className='calendar-next-week';compactDate.className='calendar-compact';compactNext.className='calendar-compact calendar-next-week';
 calendar.append(date,next,compactDate,compactNext);root.querySelector('.mobile-top').append(calendar);
 return (state,expanded=false)=>{
  const value=gameDate(state.day),visible=!!value&&!['menu','load','lobby','campaign','connecting','hero','battle'].includes(state.mode)&&state.resources?.length>=7;
  calendar.hidden=!visible;root.dataset.hasCalendar=String(visible);if(!visible)return;
  const english=getLanguage()==='en',daysLeft=7-value.weekday,englishDays=daysLeft===1?'1 day left':`${daysLeft} days left`,label=english?`Day ${value.weekday}/7 · Week ${value.week} · Month ${value.month}`:`Jour ${value.weekday}/7 · Semaine ${value.week} · Mois ${value.month}`,remaining=english?(value.weekday===7?'Last day of the week':`${englishDays} this week`):value.weekday===7?'Dernier jour de la semaine':`Encore ${daysLeft} j cette semaine`;
  const recruits=canViewWeeklyRecruits(state);
  calendar.disabled=!recruits;
  if(recruits){calendar.setAttribute('aria-haspopup','dialog');calendar.setAttribute('aria-expanded',String(expanded));}
  else{calendar.removeAttribute('aria-haspopup');calendar.removeAttribute('aria-expanded');}
  const days=value.untilNextWeek;
  const recruitLabel=english?(days===1?'Recruits in 1 day':`Recruits in ${days} days`):(days===1?'Recrues dans 1 jour':`Recrues dans ${days} jours`);
  const status=recruits?recruitLabel:remaining;
  if(date.textContent!==label)date.textContent=label;if(next.textContent!==status)next.textContent=status;
  if(state.mode==='map'){
   const shortDate=english?`Day ${value.weekday}/7 · W${value.week} · M${value.month}`:`Jour ${value.weekday}/7 · S${value.week} · M${value.month}`;
   const shortNext=english?(value.weekday===7?'Last day':englishDays):value.weekday===7?'Dernier jour':`Encore ${daysLeft} j`;
   if(compactDate.textContent!==shortDate)compactDate.textContent=shortDate;
   const compactStatus=recruits?recruitLabel:shortNext;
   if(compactNext.textContent!==compactStatus)compactNext.textContent=compactStatus;
  }
  calendar.title=english?`Game day ${state.day}. ${label}. ${status}.`:`Jour ${state.day} de la partie. ${label}. ${status}.`;
 };
}
