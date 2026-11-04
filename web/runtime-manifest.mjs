// The engine filename is content-addressed; data must target that same engine.
export function assertRuntimeManifest(manifest,wasmURL,baseURL){
 const engine=manifest?.engine;
 const fail=()=>{const error=new Error('Le moteur et les données ne sont pas de la même version. Recharge la page.');error.code='RUNTIME_DATA_MISMATCH';throw error;};
 if(!engine||typeof engine.wasm!=='string'||typeof engine.sha256!=='string'||!/^[a-f0-9]{64}$/.test(engine.sha256))fail();
 const name=engine.wasm.match(/^vcmiclient\.([a-f0-9]{16})\.wasm$/);
 if(!name||!engine.sha256.startsWith(name[1])||typeof wasmURL!=='string')fail();
 let filename;try{filename=new URL(wasmURL,baseURL).pathname.split('/').pop();}catch{fail();}
 if(filename!==engine.wasm)fail();
 return engine;
}
