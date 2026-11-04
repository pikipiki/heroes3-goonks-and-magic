import{test}from'node:test';import assert from'node:assert/strict';import{versionModuleImports,versionScriptTags,createRuntimeVersion}from'../scripts/version-runtime.mjs';
test('A release versions its top-level scripts and each nested static or dynamic module',()=>{
 const source=`import{read}from '../opfs-worker.js';\nimport './startup.mjs';\nconst load=()=>import('./lazy-assets.mjs');\nconst assets='./sprites.png';\nconst other='https://example.org/lib.js';`;
 const result=versionModuleImports(source,'abcdef');for(const name of ['../opfs-worker.js','./startup.mjs','./lazy-assets.mjs'])assert(result.includes(name+'?v=abcdef'));assert(result.includes("'./sprites.png'"));assert(result.includes("'https://example.org/lib.js'"));
 const html='<script type="module" src="./web/install.mjs"></script><link href="./web/mobile.css">';assert.equal(versionScriptTags(html,'abcdef'),'<script type="module" src="./web/install.mjs?v=abcdef"></script><link href="./web/mobile.css">');
});

test('JavaScript-only releases invalidate worker/module cache keys even when WASM is unchanged',()=>{
 const html='<script src="./engine.unchanged.js"></script>',modules=[['web/install.mjs','old'],['opfs-worker.js','old']];const initial=createRuntimeVersion(html,modules);
 assert.equal(createRuntimeVersion(html,[...modules].reverse()),initial);
 assert.notEqual(createRuntimeVersion(html,[modules[0],['opfs-worker.js','new protocol']]),initial);
 assert.notEqual(createRuntimeVersion(html,[['web/install.mjs','new'],modules[1]]),initial);
});
