import fs from 'node:fs';
export function renderPage(root){
 let html=fs.readFileSync(root+'/game.html','utf8');
 html=html.replace(/window\.VCMI_WASM_URL\s*=.*?;/g,"window.VCMI_WASM_URL = '/vcmiclient.wasm';").replace(/window\.VCMI_DATA_URL\s*=.*?;/g,"window.VCMI_DATA_URL = '/vcmiclient.data';");
 html=html.replace('</head>','<script type="module" src="/web/install.mjs"></script></head>');
 html=html.replace('const FS = module.FS;','await window.goonkAssetsReady;\n        const FS = module.FS;');
 html=html.replace('module.canvas = document.getElementById("canvas");',`
 const modSettingsPath='/home/web_user/.config/vcmi/modSettings.json';let modSettings;
 try{modSettings=JSON.parse(FS.readFile(modSettingsPath,{encoding:'utf8'}));}catch{modSettings={activePreset:'default',presets:{default:{mods:['core','vcmi'],settings:{}}}};}
 const preset=modSettings.activePreset||'default';modSettings.presets ||= {};modSettings.presets[preset] ||= {mods:['core','vcmi'],settings:{}};
 modSettings.presets[preset].mods=Array.from(new Set([...(modSettings.presets[preset].mods||[]),'goonk','wog']));
 FS.writeFile(modSettingsPath,JSON.stringify(modSettings));
 module.canvas = document.getElementById("canvas");`);
 return html;
}
