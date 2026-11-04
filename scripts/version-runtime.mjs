import crypto from 'node:crypto';
// Keep every static module in the same release, including the shared OPFS worker.
export function versionModuleImports(source,version){
 return source.replace(/(\b(?:from\s*|import\s*\(\s*|import\s*)['"])(\.{1,2}\/[^'"\s]+\.(?:mjs|js))(['"])/g,(_all,before,url,after)=>before+url+'?v='+version+after);
}
export function versionScriptTags(html,version){
 return html.replace(/(<script\b[^>]*\bsrc=["'])(\.\/[^"']+\.(?:mjs|js))(["'])/g,(_all,before,url,after)=>before+url+'?v='+version+after);
}

export function createRuntimeVersion(html,modules){
 const hash=crypto.createHash('sha256').update(html);
 for(const [name,bytes]of [...modules].sort(([a],[b])=>a.localeCompare(b)))hash.update(name+'\0').update(bytes).update('\0');
 return hash.digest('hex').slice(0,16);
}
