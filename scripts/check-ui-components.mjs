import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const isUiModule=path=>/^web\/.*\.mjs$/.test(path)&&!path.startsWith('web/ui/');
export function requiresUiLibrary(path,source){return isUiModule(path)&&/(?:createElement\(|innerHTML\s*=|insertAdjacentHTML\()/u.test(source)&&/(?:<(?:button|header|footer|dialog|form)\b|createElement\(['"](?:button|dialog|header|footer)['"])/u.test(source);}
export const importsUiLibrary=source=>/from\s*['"][^'"]*\/ui\/(?:components|primitives|screen|action-dock|menu)\.mjs['"]/u.test(source);
export function violations(files,read){return files.filter(file=>{if(!isUiModule(file))return false;const source=read(file);return requiresUiLibrary(file,source)&&!importsUiLibrary(source);});}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const staged=process.argv.includes('--staged'),args=staged?['diff','--cached','--name-only','--diff-filter=ACMR','-z']:['diff','HEAD','--name-only','--diff-filter=ACMR','-z'];
 const files=execFileSync('git',args,{encoding:'utf8'}).split('\0').filter(Boolean);
 const broken=violations(files,file=>staged?execFileSync('git',['show',':'+file],{encoding:'utf8',maxBuffer:32*1024*1024}):fs.readFileSync(file,'utf8'));
 if(broken.length){console.error('UI : réutilise web/ui/components.mjs avant de créer ou modifier un écran. Consulte docs/ui-components.md.\n'+broken.map(file=>' - '+file).join('\n'));process.exitCode=1;}
 else if(files.some(file=>/^web\//.test(file)))console.log('UI : bibliothèque commune vérifiée. Titres + croix ; actions en bas/en colonne droite ; règles Material 3.');
}
