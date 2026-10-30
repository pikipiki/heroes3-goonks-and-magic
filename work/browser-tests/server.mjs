import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('../vcmi-wasm/emscripten/html5');
const data=path.resolve('../game-data/homm3eng/home/web_user/.local/share/vcmi');
const mime={'.js':'text/javascript','.html':'text/html','.wasm':'application/wasm','.png':'image/png','.json':'application/json'};
http.createServer((req,res)=>{
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy','require-corp');
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/'){
    let html=fs.readFileSync(path.join(root,'game.html'),'utf8');
    html=html.replace(/window\.VCMI_WASM_URL\s*=.*?;/g,"window.VCMI_WASM_URL = '/vcmiclient.wasm';");
    html=html.replace(/window\.VCMI_DATA_URL\s*=.*?;/g,"window.VCMI_DATA_URL = '/vcmiclient.data';");
    // Load original assets into OPFS before the existing runtime mounts it.
    html=html.replace('await cloudSaves;',`await cloudSaves;
      const files = await (await fetch('/test-manifest')).json();
      const base='/home/web_user/.local/share/vcmi';
      await window.opfsList(base);
      for(const file of files){
        const bytes=new Uint8Array(await (await fetch('/test-data/'+encodeURIComponent(file))).arrayBuffer());
        await window.opfsWrite(base,file,0,bytes,bytes.length);
      }
      await window.opfsFlush(base);`);
    html=html.replace('module.canvas = document.getElementById("canvas");',`
      const modSettingsPath='/home/web_user/.config/vcmi/modSettings.json';
      let modSettings;
      try{modSettings=JSON.parse(FS.readFile(modSettingsPath,{encoding:'utf8'}));}catch{modSettings={activePreset:'default',presets:{default:{mods:['vcmi','core'],settings:{}}}};}
      const preset=modSettings.activePreset||'default';
      modSettings.presets ||= {};
      modSettings.presets[preset] ||= {mods:['vcmi','core'],settings:{}};
      modSettings.presets[preset].mods=Array.from(new Set([...(modSettings.presets[preset].mods||[]),'goonk']));
      FS.writeFile(modSettingsPath,JSON.stringify(modSettings));
      module.canvas = document.getElementById("canvas");`);
    res.setHeader('Content-Type','text/html');return res.end(html);
  }
  if(url.pathname==='/test-manifest'){
    const files=[];
    const walk=dir=>{if(!fs.existsSync(path.join(data,dir)))return;for(const e of fs.readdirSync(path.join(data,dir),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())walk(p);else files.push(p);}};
    for(const dir of ['Data','Maps','Mp3','Mods'])walk(dir);
    res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(files));
  }
  const isData=url.pathname.startsWith('/test-data/');
  const base=isData?data:root;
  const relative=decodeURIComponent(isData?url.pathname.slice(11):url.pathname.slice(1));
  const file=path.resolve(base,relative);
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end('Not found');}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT || 8765),'127.0.0.1',()=>console.log('Heroes Goonk: http://127.0.0.1:'+(process.env.PORT || 8765)));
