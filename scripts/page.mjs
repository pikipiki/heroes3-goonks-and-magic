import {inlineBootScreen} from './boot-screen.mjs';
import fs from 'node:fs';
export function renderPage(root){
 let html=fs.readFileSync(root+'/game.html','utf8');
 const relay=process.env.GOONK_LOBBY_RELAY;
 if(relay){
  const url=new URL(relay);
  const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  const testRelay=url.protocol==='ws:'&&loopback&&process.env.GOONK_TEST_ORIGIN;
  if((url.protocol!=='wss:'&&!testRelay)||url.username||url.password||url.search||url.hash||url.pathname!=='/lobby')
   throw new Error('GOONK_LOBBY_RELAY must be a trusted wss://host/lobby URL.');
  html=html.replace('url: "wss://cloud.dos.zone:8443/vcmi-wss"','url: '+JSON.stringify(url.href));
  html=html.replace('const v8Endpoint =','window.goonkOnlineConfigured = true;\n    const v8Endpoint =');
 }
 html=html.replace(/quitGame: \(\) => \{[\s\S]*?\n      \},/, "quitGame: () => { location.href = new URL('./', location.href).href; },");
 html=html.replace('const module = {',"const module = { mainScriptUrlOrBlob: new URL('./vcmiclient.js', location.href).href,");
 html=html.replace(/window\.VCMI_WASM_URL\s*=.*?;/g,"window.VCMI_WASM_URL = './vcmiclient.wasm';").replace(/window\.VCMI_DATA_URL\s*=.*?;/g,"window.VCMI_DATA_URL = './vcmiclient.data';");
 html=html.replace('<meta name="viewport" content="width=device-width, height=device-height, user-scalable=0" />','<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
 html=html.replace('</head>','<link rel="manifest" href="./web/game.webmanifest"><link rel="apple-touch-icon" href="./dosvcmi.png"><meta name="application-name" content="Heroes Goonk"><meta name="apple-mobile-web-app-title" content="Heroes Goonk"><link rel="stylesheet" href="./web/mobile.css"><link rel="stylesheet" href="./web/loading.css"><link rel="stylesheet" href="./web/game-menu.css"><link rel="stylesheet" href="./web/h3-theme.css"><link rel="stylesheet" href="./web/session-recovery.css"><link rel="stylesheet" href="./web/mobile-upgrade.css"><link rel="stylesheet" href="./web/marketplace.css"><link rel="stylesheet" href="./web/online-login.css"><link rel="stylesheet" href="./web/online-lobby.css"><script type="module" src="./web/boot-screen.mjs"></script><script type="module" src="./web/i18n.mjs"></script><script type="module" src="./web/install.mjs"></script><script type="module" src="./web/mobile.mjs"></script><script type="module" src="./web/game-menu.mjs"></script><script type="module" src="./web/session-recovery.mjs"></script></head>');
 html=html.replace('const FS = module.FS;','await window.goonkAssetsReady;\n        const FS = module.FS;\n        if(module._vcmiWebMemoryVersion?.()!==1)throw Error(\'Recharge la page pour mettre à jour le moteur.\');\n        const {installLazyAssets}=await import(\'./web/lazy-assets.mjs\');installLazyAssets(module,new Set(window.goonkAssetURLs.filter(file=>file.size>4096).map(file=>\'/home/web_user/.local/share/vcmi/\'+file.path)));');
 html=html.replace('const OPFS = module.OPFS;', `const OPFS = module.OPFS;
        const {batchGameMount}=await import('./web/game-mount.mjs');
        const restoreGameMount=batchGameMount(OPFS,window.goonkAssetURLs);`);
 html=html.replace('module.canvas = document.getElementById("canvas");',`
 restoreGameMount();
 const {installRuntimeScheduling}=await import('./web/runtime-scheduling.mjs');installRuntimeScheduling(module);
 const {configureMobileBattle}=await import('./web/battle-scene.mjs');configureMobileBattle(FS,window.goonkMobileActive);
 const {getLanguage}=await import('./web/i18n.mjs');const settingsPath='/home/web_user/.config/vcmi/settings.json';let settings={};try{settings=JSON.parse(FS.readFile(settingsPath,{encoding:'utf8'}));}catch{}settings.general={...settings.general,language:getLanguage()==='fr'?'french':'english'};FS.writeFile(settingsPath,JSON.stringify(settings));
 const modSettingsPath='/home/web_user/.config/vcmi/modSettings.json';let modSettings;
 try{modSettings=JSON.parse(FS.readFile(modSettingsPath,{encoding:'utf8'}));}catch{modSettings={activePreset:'default',presets:{default:{mods:['core','vcmi'],settings:{}}}};}
 const preset=modSettings.activePreset||'default';modSettings.presets ||= {};modSettings.presets[preset] ||= {mods:['core','vcmi'],settings:{}};
 modSettings.presets[preset].mods=Array.from(new Set([...(modSettings.presets[preset].mods||[]).filter(id=>id!=='wog'),'goonk','wake-of-gods','third-upgrades','tum-era']));
 modSettings.presets[preset].settings ||= {};
 // Preserve existing presets: old saves may still require the archived hero-paths mod.
 modSettings.presets[preset].settings['wake-of-gods'] ||= {};
 for(const child of ['level8units','creatures','messengersandemissaries','stackexperience'])modSettings.presets[preset].settings['wake-of-gods'][child]=true;
 modSettings.presets[preset].settings['wake-of-gods'].mithril=true;
 modSettings.presets[preset].settings['third-upgrades']={...(modSettings.presets[preset].settings['third-upgrades']||{}),'hota-comp':false,'tow-comp':false,'tow-hota-comp':false};
 FS.writeFile(modSettingsPath,JSON.stringify(modSettings));
 if(typeof module._vcmiEraBridgeVersion!=='function'||module._vcmiEraBridgeVersion()!==2)throw new Error('La version du moteur ne correspond pas aux données du jeu. Recharge la page pour terminer la mise à jour.');
 module.canvas = document.getElementById("canvas");`);
 html=html.replace('document.getElementById("spinner").style.display = "none";', '/* The boot screen waits for the first presented native window. */');
 html=html.replace('<div id="status"></div>', '<div id="status" role="status">Loading Heroes Goonk…</div>');
 html=inlineBootScreen(html);
 // Touch presentation rotates its own canvas; its 800x600 engine must stay intact.
 // Fit the native 4:3 selection panel with room for its outer border.
 // Resize through SDL so mouse input and the rendered buttons share the same geometry.
 html=html.replace('let currentCanvasSize =', 'let fitDesktopSelection = false;let currentCanvasSize =');
 html=html.replace('currentCanvasSize = {\n            width:', `const scale = fitDesktopSelection ? Math.max(1, Math.min(cssWidth * dpi / 840, cssHeight * dpi / 640)) : 1;
          currentCanvasSize = {
            width:`);
 html=html.replace('Math.round(cssWidth * dpi)', 'Math.round(cssWidth * dpi / scale)').replace('Math.round(cssHeight * dpi)', 'Math.round(cssHeight * dpi / scale)');
 html=html.replace('canvasResizeObserver.observe(module.canvas);', `canvasResizeObserver.observe(module.canvas);
        if(!window.goonkMobileActive)window.addEventListener('goonk-state', ({detail}) => {
          const fit = ['lobby', 'load', 'campaign'].includes(detail.mode) || detail.onlineMatch === true;
          if(fit === fitDesktopSelection) return;
          fitDesktopSelection = fit;
          handleResize();
        });`);
 html=html.replace('module._vcmiOnCanvasResize();','if(!window.goonkMobileActive)module._vcmiOnCanvasResize();');
 html=html.replace('module.getWidth = () => currentCanvasSize.width;', 'module.getWidth = () => window.goonkMobileActive ? 800 : currentCanvasSize.width;').replace('module.getHeight = () => currentCanvasSize.height;', 'module.getHeight = () => window.goonkMobileActive ? 600 : currentCanvasSize.height;');
 html=html.replace('module.callMain(["--disable-video"]);', 'module.getGoonkRenderScale = () => window.goonkMobileActive ? 1 : 0;module.callMain(["--disable-video"]);');
 html=html.replace('DOSVCMI(window.Module);', `import {configureMobileSource} from './web/mobile-render.mjs';import {guardOnlineNameKeyboard} from './web/online-login.mjs';guardOnlineNameKeyboard(window);configureMobileSource(document.querySelector('#canvas'),window.goonkMobileActive);if(!window.crossOriginIsolated){const entry=new URL('./',location.href);entry.search=location.search;entry.hash=location.hash;location.replace(entry);}else{DOSVCMI(window.Module);}`);
 return html;
}
