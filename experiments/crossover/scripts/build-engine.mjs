import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),source=root+'vendor/openbw';
if(!process.env.WASI_SDK)throw Error('Set WASI_SDK to an extracted official wasi-sdk-33.0 directory.');
const compiler=path.join(process.env.WASI_SDK,'bin/clang++');
const inputs=fs.readdirSync(source,{recursive:true}).filter(f=>fs.statSync(path.join(source,f)).isFile()).sort();
const sourceSha256=crypto.createHash('sha256');
for(const file of inputs)sourceSha256.update(file+'\0').update(fs.readFileSync(path.join(source,file)));
const fingerprint=sourceSha256.digest('hex');
const upstream=JSON.parse(fs.readFileSync(root+'UPSTREAM.json'));
const compilerVersion=execFileSync(compiler,['--version'],{encoding:'utf8'}).split('\n')[0];
if(compilerVersion!==upstream.compilerVersion)throw Error('Use the pinned wasi-sdk-33.0 compiler.');
if(fingerprint!==upstream.sourceTreeSha256)throw Error('Vendored source tree differs from the pinned snapshot.');
const adapter=root+'native/openbw-crossover.cpp';
const adapterSha256=crypto.createHash('sha256').update(fs.readFileSync(adapter)).digest('hex');
const out=root+'public/starcraft/openbw.wasm';
fs.mkdirSync(path.dirname(out),{recursive:true});
const flags=['-std=c++17','-O2','-fno-exceptions','-mexec-model=reactor','-DOPENBW_NO_EXCEPTIONS','-DOPENBW_ENABLE_UI','-DOPENBW_NO_SDL_IMAGE','-DOPENBW_NO_SDL_MIXER','-I'+source,'-I'+source+'/ui','-ffile-prefix-map='+root+'=crossover','-ffile-prefix-map='+source+'=openbw','-Wl,-z,stack-size=8388608','-Wl,--strip-debug'];
const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'goonk-openbw-'));
const adapted=path.join(workspace,'openbw');
try {
 fs.cpSync(source,adapted,{recursive:true});
 const hookFile=path.join(adapted,'bwgame.h'),text=fs.readFileSync(hookFile,'utf8');
 const needle='\t\tdamage += fp8::integer(target->acid_spore_count);';
 if(text.split(needle).length!==2)throw Error('Pinned native damage hook changed.');
 let transformed=text.replace(needle,needle+'\n\t\tdamage = fp8::from_raw(::crossover_weapon_contact(target, source_unit, damage.raw_value));');
 const speedStart=transformed.indexOf('\tfp8 get_modified_unit_speed(const unit_t* u, fp8 base_speed) const {');
 const speedEnd=transformed.indexOf('\tfp8 get_modified_unit_acceleration(',speedStart);
 const speedSection=transformed.slice(speedStart,speedEnd);
 const speedReturn='\t\treturn speed.as_signed();';
 if(speedStart<0||speedEnd<0||speedSection.split(speedReturn).length!==2)throw Error('Pinned native movement hook changed.');
 transformed=transformed.slice(0,speedStart)+speedSection.replace(speedReturn,'\t\treturn fp8::from_raw(::crossover_movement_speed(u,speed.as_signed().raw_value));')+transformed.slice(speedEnd);
 const terrainNeedle='\t\t\tfor (size_t i = 0; i != game_st.gfx_tiles.size(); ++i) {\n\t\t\t\ttile_id tile_id = game_st.gfx_tiles[i];';
 if(transformed.split(terrainNeedle).length!==2)throw Error('Pinned terrain initialization changed.');
 const arena=`
   if (::crossover_arena_requested) {
    tile_id floor;bool found=false;
    for (auto tile:game_st.gfx_tiles) {
     if(tile.group_index()>=game_st.cv5.size())continue;
     const auto & group=game_st.cv5.at(tile.group_index());
     const auto mega=group.mega_tile_index[tile.subtile_index()];
     const auto flags=game_st.mega_tile_flags.at(mega);
     if((flags&tile_t::flag_walkable)&&!(flags&tile_t::flag_partially_walkable)&&!(group.flags&tile_t::flag_unbuildable)){floor=tile;found=true;break;}
    }
    if(found)for(auto & tile:game_st.gfx_tiles)tile=floor;
   }
 `;
 transformed=transformed.replace(terrainNeedle,arena+terrainNeedle);fs.writeFileSync(hookFile,transformed);
 const entry=path.join(workspace,'openbw-crossover.cpp');fs.writeFileSync(entry,fs.readFileSync(adapter,'utf8').replaceAll('../vendor/openbw',adapted));
 execFileSync(compiler,[...flags.map(flag=>flag.startsWith('-I'+source)?flag.replace(source,adapted):flag),'-ffile-prefix-map='+workspace+'=crossover-adapter',entry,adapted+'/web/wasm_backend.cpp','-o',out+'.tmp'],{stdio:'inherit'});
}finally{fs.rmSync(workspace,{recursive:true,force:true});}
fs.renameSync(out+'.tmp',out);
fs.chmodSync(out,0o644);
const module=await WebAssembly.compile(fs.readFileSync(out));
const sha256=crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex');
fs.writeFileSync(root+'public/starcraft/engine-build.json',JSON.stringify({engine:'OpenBW',upstream:upstream.commit,sdk:'wasi-sdk-33.0',compiler:compilerVersion,sourceTreeSha256:fingerprint,adapterSha256,buildScriptSha256:crypto.createHash('sha256').update(fs.readFileSync(fileURLToPath(import.meta.url))).digest('hex'),sha256,bytes:fs.statSync(out).size,exports:WebAssembly.Module.exports(module).map(v=>v.name)},null,2)+'\n');
console.log('OpenBW WASM: '+sha256);
