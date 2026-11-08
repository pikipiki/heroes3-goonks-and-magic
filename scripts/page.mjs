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
 const hostedEndpoint=process.env.GOONK_HOSTED_ENDPOINT;
 if(hostedEndpoint){
  const url=new URL(hostedEndpoint), publicKey=process.env.GOONK_PUSH_PUBLIC_KEY;
  const testURL=url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&process.env.GOONK_TEST_ORIGIN;
  if((url.protocol!=='https:'&&!testURL)||url.username||url.password||url.search||url.hash||
    url.pathname!=='/hosted/turn-notifications'||!/^[A-Za-z0-9_-]{87}$/.test(publicKey??''))
   throw new Error('Configure a trusted hosted notification endpoint and public VAPID key.');
  const poolEndpoint=process.env.GOONK_HOSTED_POOL_ENDPOINT;
  const pool=poolEndpoint ? new URL(poolEndpoint) : null;
  const testPool=pool?.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(pool.hostname)&&process.env.GOONK_TEST_ORIGIN;
  if(pool&&((pool.protocol!=='https:'&&!testPool)||pool.username||pool.password||pool.search||pool.hash||
    pool.pathname!=='/hosted/turn-notifications'))
   throw new Error('Configure a trusted dedicated match creation endpoint.');
  html=html.replace('const v8Endpoint =','window.goonkHostedAlerts = '+JSON.stringify({endpoint:url.href,poolEndpoint:pool?.href,publicKey})+';\n    const v8Endpoint =');
 }
 html=html.replace(/quitGame: \(\) => \{[\s\S]*?\n      \},/, "quitGame: () => { location.href = new URL('./', location.href).href; },");
 html=html.replace('const module = {',"const module = { mainScriptUrlOrBlob: new URL('./vcmiclient.js', location.href).href,");
 html=html.replace(/window\.VCMI_WASM_URL\s*=.*?;/g,"window.VCMI_WASM_URL = './vcmiclient.wasm';").replace(/window\.VCMI_DATA_URL\s*=.*?;/g,"window.VCMI_DATA_URL = './vcmiclient.data';");
 html=html.replace('<meta name="viewport" content="width=device-width, height=device-height, user-scalable=0" />','<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />');
 html=html.replace('document.addEventListener("contextmenu", (event) => {\n      event.preventDefault();', 'document.addEventListener("contextmenu", (event) => {\n      if (!event.target.closest?.("[data-hosted-seat-code]")) event.preventDefault();');
 html=html.replace('</head>','<link rel="manifest" href="./web/game.webmanifest"><link rel="apple-touch-icon" href="./dosvcmi.png"><meta name="application-name" content="Heroes Goonk"><meta name="apple-mobile-web-app-title" content="Heroes Goonk"><link rel="stylesheet" href="./web/mobile.css"><link rel="stylesheet" href="./web/loading.css"><link rel="stylesheet" href="./web/game-menu.css"><link rel="stylesheet" href="./web/h3-theme.css"><link rel="stylesheet" href="./web/session-recovery.css"><link rel="stylesheet" href="./web/mobile-upgrade.css"><link rel="stylesheet" href="./web/marketplace.css"><link rel="stylesheet" href="./web/online-login.css"><link rel="stylesheet" href="./web/online-lobby.css"><script type="module" src="./web/boot-screen.mjs"></script><script type="module" src="./web/i18n.mjs"></script><script type="module" src="./web/install.mjs"></script><script type="module" src="./web/mobile.mjs"></script><script type="module" src="./web/game-menu.mjs"></script><script type="module" src="./web/session-recovery.mjs"></script></head>');
 html=html.replace('const module = {', `const module = {
      onAbort: error => { if(window.goonkTemporaryBoot)window.goonkTemporaryBoot.fail(error); },`);
 html=html.replace('const FS = module.FS;','const {temporary=false}=await window.goonkAssetsReady;\n        const FS = module.FS;\n        if(module._vcmiWebMemoryVersion?.()!==1)throw Error(\'Recharge la page pour mettre à jour le moteur.\');\n        if(!temporary){const {installLazyAssets,prefetchGameAssets}=await import(\'./web/lazy-assets.mjs\');installLazyAssets(module,new Set(window.goonkAssetURLs.filter(file=>file.size>4096).map(file=>\'/home/web_user/.local/share/vcmi/\'+file.path)));const combatAudio=[\'Mp3/COMBAT01.ogg\',\'Mp3/COMBAT02.ogg\',\'Mp3/COMBAT03.ogg\',\'Mp3/COMBAT04.ogg\',\'Mp3/Win Battle.ogg\',\'Mp3/LoseCombat.ogg\'];void prefetchGameAssets(module,combatAudio).catch(()=>{});}');
 html=html.replace('const OPFS = module.OPFS;', `const OPFS = module.OPFS;
        const {batchGameMount}=await import('./web/game-mount.mjs');
        const restoreGameMount=temporary?null:batchGameMount(OPFS,window.goonkAssetURLs);`);
 html=html.replaceAll('FS.mount(OPFS, {','if(!temporary)FS.mount(OPFS, {');
 html=html.replace('        await new Promise(resolve => {\n          OPFS.syncFsOnProgress', `        if(temporary){
          const {mountTemporaryAssets}=await import('./web/temporary-assets.mjs');
          const {default:startupReads,gameplayReads=[]}=await import('./web/temporary-startup.mjs');
          const temporaryAssets=mountTemporaryAssets(module,window.goonkAssetURLs,{onFetch:bytes=>window.goonkTemporaryBoot.progress(bytes)});
          window.goonkTemporaryAssets=temporaryAssets;
          await window.goonkTemporaryBoot.start();
          await temporaryAssets.prefetch(startupReads,{onPlan:bytes=>window.goonkTemporaryBoot.plan(bytes)}).catch(error=>console.warn('Temporary prefetch incomplete',error));
          void temporaryAssets.prefetch(gameplayReads,{concurrency:6,trackProgress:false,reserveBytes:32*1024*1024}).catch(()=>{});
          await window.goonkTemporaryBoot.launching();
        }else await new Promise(resolve => {
          OPFS.syncFsOnProgress`);
 html=html.replace('module.canvas = document.getElementById("canvas");',`
 restoreGameMount?.();
 module.goonkTemporaryStorage=temporary;
 const {installRuntimeScheduling}=await import('./web/runtime-scheduling.mjs');installRuntimeScheduling(module);
 const {configureMobileBattle}=await import('./web/battle-scene.mjs');configureMobileBattle(FS,window.goonkMobileActive);
 const {getLanguage}=await import('./web/i18n.mjs');const settingsPath='/home/web_user/.config/vcmi/settings.json';let settings={};try{settings=JSON.parse(FS.readFile(settingsPath,{encoding:'utf8'}));}catch{}settings.general={...settings.general,language:getLanguage()==='fr'?'french':'english'};settings.gameTweaks={...settings.gameTweaks,skipBattleIntroMusic:true};FS.writeFile(settingsPath,JSON.stringify(settings));
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
 html=html.replace('onRuntimeInitialized: async () => {', 'onRuntimeInitialized: async () => { try {');
 html=html.replace('module.callMain(["--disable-video"]);\n      },', `module.callMain(["--disable-video"]);
        } catch(error) {
          if(!window.goonkTemporaryBoot)throw error;
          window.goonkTemporaryBoot.fail(error);
        }
      },`);
 html=html.replace('module.callMain(["--disable-video"]);', 'module.getGoonkRenderScale = () => window.goonkMobileActive ? 1 : 0;module.callMain(["--disable-video"]);');
 html=html.replace('DOSVCMI(window.Module);', `import {configureMobileSource} from './web/mobile-render.mjs';import {guardOnlineNameKeyboard} from './web/online-login.mjs';guardOnlineNameKeyboard(window);configureMobileSource(document.querySelector('#canvas'),window.goonkMobileActive);if(!window.crossOriginIsolated){const entry=new URL('./',location.href);entry.search=location.search;entry.hash=location.hash;location.replace(entry);}else{DOSVCMI(window.Module).catch(error=>{if(!window.goonkTemporaryBoot)throw error;window.goonkTemporaryBoot.fail(error);});}`);
 return html;
}
