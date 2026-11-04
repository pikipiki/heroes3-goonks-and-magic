const destinations=new Map([[20,'lobby'],[23,'load'],[47,'campaign']]);
export function createMenuLaunch({onChange=()=>{},clock=()=>Date.now(),timeout=25000}={}){let pending=null;const clear=()=>{pending=null;onChange(null);};return{
 begin(action,mode){if(!destinations.has(action)||mode!=='menu')return true;if(pending)return false;pending={action,at:clock(),failed:false};onChange(pending);return true;},
 observe(state){if(!pending&&state.mode==='connecting'){pending={action:destinations.has(state.launchAction)?state.launchAction:20,at:clock(),failed:false};onChange(pending);}if(!pending)return;if(state.mode===destinations.get(pending.action)&&state.lobbyReady||['map','town','battle','dialog'].includes(state.mode))clear();},
 tick(){if(pending&&!pending.failed&&clock()-pending.at>=timeout){pending={...pending,failed:true};onChange(pending);}},clear,
 get pending(){return pending;}
};}
export function restartLaunchURL(href,action){const url=new URL(href);for(const key of ['new-game','choose-save','new-campaign','custom-game'])url.searchParams.delete(key);url.searchParams.set(action===23?'choose-save':action===47?'new-campaign':'new-game','1');return url.href;}
