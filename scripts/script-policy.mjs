import crypto from 'node:crypto';
const digest=bytes=>'sha256-'+crypto.createHash('sha256').update(bytes).digest('base64');
export function inlineScriptHashes(html){
 const hashes=[];
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/(?:^|\s)src\s*=/i.test(match[1])||!match[2].trim())continue;
  hashes.push("'"+digest(match[2])+"'");
 }
 return hashes;
}
export function authorizeExternalScripts(html,readFile){
 const hashes=[];
 html=html.replace(/<script\b([^>]*)>/gi,(tag,attrs)=>{
  const src=attrs.match(/(?:^|\s)src\s*=\s*(["'])(.*?)\1/i)?.[2];if(!src)return tag;
  if(/^(https?:)?\/\//i.test(src))throw Error('External script must be bundled before authorization: '+src);
  const hash=digest(readFile(src));hashes.push("'"+hash+"'");
  return '<script'+attrs.replace(/\s+integrity\s*=\s*(["']).*?\1/gi,'')+' integrity="'+hash+'">';
 });
 return{html,hashes};
}
export function scriptPolicy(documents,externalHashes=[],scriptSources=[]){
 // Authorize only bundled application paths on explicitly configured origins.
 return "script-src 'unsafe-eval' 'wasm-unsafe-eval' "+[...new Set([...documents.flatMap(inlineScriptHashes),...externalHashes,...scriptSources])].join(' ')+"; worker-src 'self' blob:";
}
export function applyScriptPolicy(html,policy){
 return html.replace(/<head>/i,'<head>\n  <meta charset="utf-8">\n  <meta http-equiv="Content-Security-Policy" content="'+policy+'">');
}
