import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const isUiModule=path=>(/^web\/.*\.mjs$/.test(path)&&!path.startsWith('web/ui/'))||(/^src\/.*\.[cm]?[jt]sx?$/.test(path)&&!path.startsWith('src/ui/'));
export function requiresUiLibrary(path,source){return isUiModule(path)&&(/(?:createElement\(|innerHTML\s*=|insertAdjacentHTML\()/u.test(source)&&/(?:<(?:button|header|footer|dialog|form)\b|createElement\(['"](?:button|dialog|header|footer)['"])/u.test(source)||/\.[jt]sx$/.test(path)&&/<(?:[A-Z][\w.]*|button|header|footer|dialog|form|section|main|div)\b/u.test(source));}
export const importsUiLibrary=source=>/from\s*['"][^'"]*\/ui\/(?:material-components|components|primitives|screen|action-dock|menu|heroes-kit|game-components)(?:\.[cm]?[jt]sx?)?['"]/u.test(source);
export function muiOnlyViolations(files,read){return files.filter(file=>/^(?:src\/ui\/(?:game\/.*\.[jt]sx|heroes-kit\.mjs|fitted-text\.jsx)|docs\/design-prototypes\/material3\/(?:design-system\.mjs|component-inventory\.mjs|game-component-examples\.jsx))$/.test(file)).filter(file=>{const source=read(file);return /<[a-z][\w-]*(?:\s|\/?>)|\b(?:h|createElement)\s*\(\s*['"][a-z]|\bdocument\.createElement\s*\(|\.innerHTML\s*=|\bcomponent\s*[:=]\s*['"](?:button|input|select|textarea|dialog)['"]/u.test(source);});}
// Native adapters may keep canvas/host/data nodes, but visible action controls
// must be produced by the MUI adapter rather than a new native button factory.
export function nativeActionViolations(files,read){return files.filter(file=>/^web\/.*\.mjs$/.test(file)&&!file.startsWith('web/ui/')).filter(file=>/document\.createElement\(\s*['"]button['"]\s*\)/u.test(read(file)));}
export function violations(files,read){return files.filter(file=>{if(!isUiModule(file))return false;const source=read(file);return requiresUiLibrary(file,source)&&!importsUiLibrary(source);});}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const staged=process.argv.includes('--staged'),args=staged?['diff','--cached','--name-only','--diff-filter=ACMR','-z']:['diff','HEAD','--name-only','--diff-filter=ACMR','-z'];
 const files=execFileSync('git',args,{encoding:'utf8'}).split('\0').filter(Boolean);
 const read=file=>staged?execFileSync('git',['show',':'+file],{encoding:'utf8',maxBuffer:32*1024*1024}):fs.readFileSync(file,'utf8');
 const broken=[...violations(files,read),...muiOnlyViolations(files,read),...nativeActionViolations(files,read)];
 if(broken.length){console.error('UI : réutilise web/ui/components.mjs avant de créer ou modifier un écran. Consulte docs/ui-components.md.\n'+broken.map(file=>' - '+file).join('\n'));process.exitCode=1;}
 else if(files.some(file=>/^web\//.test(file)))console.log('UI : imports de la bibliothèque commune vérifiés. La validation visuelle et les tests mobiles restent nécessaires.');
}
