let runtime;
const load=()=>runtime ||= import('./radar-runtime.mjs');
const charts=new WeakMap();
export function useRadarChart(host,model){
 let record=charts.get(host);if(!record){record={model,disposed:false};record.observer=new ResizeObserver(()=>paint());charts.set(host,record);record.observer.observe(host);}
 record.model=model;
 function paint(){if(!host.isConnected||!host.clientWidth||!host.clientHeight)return;const current=record.model;void load().then(module=>{if(record.disposed||!host.isConnected||record.model!==current)return;module.renderRadar(host,{...current,height:host.clientHeight});});}
 paint();
 return()=>{record.disposed=true;record.observer.disconnect();void runtime?.then(module=>module.disposeRadar(host));charts.delete(host);};
}
