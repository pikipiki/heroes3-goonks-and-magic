let language='en';try{language=localStorage.getItem('heroes-goonk.language')==='fr'?'fr':'en';}catch{}
export const getLanguage=()=>language;
let dictionary={};if(typeof window!=='undefined')try{const response=await fetch(new URL('./i18n-dictionary.json',import.meta.url));dictionary=await response.json();}catch(error){console.error('Translation catalogue unavailable',error);}
// Keep the same translation rules available to DOM text and canvas renderers.
export function createTranslator(catalogue){
 const reverse=Object.fromEntries(Object.entries(catalogue).map(([fr,en])=>[en,fr]));
 const tokens=Object.entries(catalogue).sort((a,b)=>b[0].length-a[0].length),back=Object.entries(reverse).sort((a,b)=>b[0].length-a[0].length);
 return(value,lang='en')=>{
  const text=String(value??''),table=lang==='fr'?reverse:catalogue,entries=lang==='fr'?back:tokens;
  if(table[text])return table[text];
  let result=text;
  for(const [a,b]of entries){
   // Short resource names such as French “or” must not rewrite English prose.
   if(a.length<3||!result.includes(a))continue;
   result=result.replaceAll(a,(match,offset,whole)=>{const before=whole[offset-1],after=whole[offset+match.length];return before&&/\p{L}/u.test(before)||after&&/\p{L}/u.test(after)?match:b;});
  }
  // HP labels are often embedded in a live stat line rather than separate nodes.
  const from=lang==='fr'?'HP':'PV',to=lang==='fr'?'PV':'HP';
  return result.replace(new RegExp('(^|[^\\p{L}\\p{N}_])'+from+'(?=$|[^\\p{L}\\p{N}_])','gu'),(_,prefix)=>prefix+to);
 };
}
const translateText=createTranslator(dictionary);
export function translate(value,lang=language){return translateText(value,lang);}
let redraw=()=>{};
export function setLanguage(value){language=value==='fr'?'fr':'en';try{localStorage.setItem('heroes-goonk.language',language);}catch{}if(typeof document!=='undefined'){document.documentElement.lang=language;redraw();window.dispatchEvent(new CustomEvent('goonk-language',{detail:{language}}));}return language;}
if(typeof document!=='undefined'){
 document.documentElement.lang=language;const originals=new WeakMap(),attributes=new WeakMap(),cache=new Map();
 const text=value=>{const key=language+':'+value;if(cache.has(key))return cache.get(key);if(cache.size>3000)cache.clear();const t=translate(value);cache.set(key,t);return t;};
 const visit=node=>{if(node.nodeType===3){if(node.parentElement?.closest('script,style,code,[translate=no]'))return;const old=originals.get(node);let raw=node.nodeValue;if(old&&raw===old.last)raw=old.raw;const next=text(raw);originals.set(node,{raw,last:next});if(node.nodeValue!==next)node.nodeValue=next;}else if(node.nodeType===1){if(node.matches('script,style,code,[translate=no]'))return;for(const key of ['aria-label','title','placeholder']){if(!node.hasAttribute(key))continue;let records=attributes.get(node);if(!records){records={};attributes.set(node,records);}const old=records[key],value=node.getAttribute(key),raw=old&&old.last===value?old.raw:value,next=text(raw);records[key]={raw,last:next};if(next!==value)node.setAttribute(key,next);}for(const child of node.childNodes)visit(child);}};
 redraw=()=>{cache.clear();visit(document.body);};
 const start=()=>{visit(document.body);new MutationObserver(records=>{for(const record of records){if(record.type==='childList'){for(const node of record.addedNodes)visit(node);}else visit(record.target);}}).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}
