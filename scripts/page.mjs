import fs from 'node:fs';
export function renderPage(root){
 let html=fs.readFileSync(root+'/game.html','utf8');
 html=html.replace(/quitGame: \(\) => \{[\s\S]*?\n      \},/, "quitGame: () => { location.href = new URL('./', location.href).href; },");
 html=html.replace('const module = {',"const module = { mainScriptUrlOrBlob: new URL('./vcmiclient.js', location.href).href,");
 html=html.replace(/window\.VCMI_WASM_URL\s*=.*?;/g,"window.VCMI_WASM_URL = './vcmiclient.wasm';").replace(/window\.VCMI_DATA_URL\s*=.*?;/g,"window.VCMI_DATA_URL = './vcmiclient.data';");
 html=html.replace('<meta name="viewport" content="width=device-width, height=device-height, user-scalable=0" />','<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
 html=html.replace('</head>','<meta name="application-name" content="Heroes Goonk"><meta name="apple-mobile-web-app-title" content="Heroes Goonk"><link rel="stylesheet" href="./web/mobile.css"><link rel="stylesheet" href="./web/loading.css"><link rel="stylesheet" href="./web/game-menu.css"><link rel="stylesheet" href="./web/h3-theme.css"><link rel="stylesheet" href="./web/session-recovery.css"><script type="module" src="./web/install.mjs"></script><script type="module" src="./web/mobile.mjs"></script><script type="module" src="./web/game-menu.mjs"></script><script type="module" src="./web/session-recovery.mjs"></script></head>');
 html=html.replace('const FS = module.FS;','await window.goonkAssetsReady;\n        const FS = module.FS;');
 html=html.replace('module.canvas = document.getElementById("canvas");',`
 const {installRuntimeScheduling}=await import('./web/runtime-scheduling.mjs');installRuntimeScheduling(module);
 const {configureMobileBattle}=await import('./web/battle-scene.mjs');configureMobileBattle(FS,window.goonkMobileActive);
 const modSettingsPath='/home/web_user/.config/vcmi/modSettings.json';let modSettings;
 try{modSettings=JSON.parse(FS.readFile(modSettingsPath,{encoding:'utf8'}));}catch{modSettings={activePreset:'default',presets:{default:{mods:['core','vcmi'],settings:{}}}};}
 const preset=modSettings.activePreset||'default';modSettings.presets ||= {};modSettings.presets[preset] ||= {mods:['core','vcmi'],settings:{}};
 modSettings.presets[preset].mods=Array.from(new Set([...(modSettings.presets[preset].mods||[]).filter(id=>id!=='wog'),'goonk','wake-of-gods','third-upgrades','tum-era']));
 modSettings.presets[preset].settings ||= {};
 modSettings.presets[preset].settings['wake-of-gods'] ||= {};
 for(const child of ['level8units','creatures','messengersandemissaries','stackexperience'])modSettings.presets[preset].settings['wake-of-gods'][child]=true;
 modSettings.presets[preset].settings['wake-of-gods'].mithril=true;
 modSettings.presets[preset].settings['third-upgrades']={...(modSettings.presets[preset].settings['third-upgrades']||{}),'hota-comp':false,'tow-comp':false,'tow-hota-comp':false};
 FS.writeFile(modSettingsPath,JSON.stringify(modSettings));
 if(typeof module._vcmiEraBridgeVersion!=='function'||module._vcmiEraBridgeVersion()!==2)throw new Error('La version du moteur ne correspond pas aux données du jeu. Recharge la page pour terminer la mise à jour.');
 module.canvas = document.getElementById("canvas");`);
 // Touch presentation rotates its own canvas; its 1600x1200 engine must stay intact.
 html=html.replace('module._vcmiOnCanvasResize();','if(!window.goonkMobileActive)module._vcmiOnCanvasResize();');
 html=html.replace('module.getWidth = () => currentCanvasSize.width;', 'module.getWidth = () => window.goonkMobileActive ? 1600 : currentCanvasSize.width;').replace('module.getHeight = () => currentCanvasSize.height;', 'module.getHeight = () => window.goonkMobileActive ? 1200 : currentCanvasSize.height;');
 html=html.replace('module.callMain(["--disable-video"]);', 'module.getGoonkRenderScale = () => window.goonkMobileActive ? 2 : 1;module.callMain(["--disable-video"]);');
 html=html.replace('DOSVCMI(window.Module);', `import {configureMobileSource} from './web/mobile-render.mjs';configureMobileSource(document.querySelector('#canvas'),window.goonkMobileActive);if(!window.crossOriginIsolated){const entry=new URL('./',location.href);entry.search=location.search;entry.hash=location.hash;location.replace(entry);}else{DOSVCMI(window.Module);}`);
 return html;
}
