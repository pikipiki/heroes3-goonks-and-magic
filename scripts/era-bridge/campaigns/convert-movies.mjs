/** Lossless decode of the four pinned, silent original animations. Never execute Windows code. */
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {mediaRoot,mediaManifest} from './import-media.mjs';import {sha256} from './importer.mjs';
export const movieManifest=mediaRoot+'/config/era-campaigns/movies.json';
export function checkCampaignMovies(){
 const result=JSON.parse(fs.readFileSync(movieManifest)),original=JSON.parse(fs.readFileSync(mediaManifest));
 if(result.contract!=='source-campaign-movies-v1'||result.movies.length!==4)throw Error('Invalid original movie cohort');
 for(const m of result.movies){
  const dimensions={'cmp.res/11_out.avi':[160,120,6],'cmp.res/11_shield.avi':[150,112,21],'cmp.res/11_sun.avi':[80,80,5],'cmp.res/11_sword.avi':[55,200,8]};if(JSON.stringify(dimensions[m.key])!==JSON.stringify([m.width,m.height,m.frameCount]))throw Error('Changed original movie dimensions');
  const source=original.movies.find(s=>s.key===m.key);if(!source||source.sha256!==m.sourceSha256||sha256(fs.readFileSync(path.join(mediaRoot,source.path)))!==m.sourceSha256)throw Error('Changed original movie');
  if(m.fpsNumerator!==15||m.fpsDenominator!==1||m.audioStreams!==0||m.frames.length!==m.frameCount||!/^era-campaign\/movies\/11_(sun|out|sword|shield)$/.test(m.animation))throw Error('Changed original movie timing');
  for(const f of [m.browser,...m.frames,m.nativeDefinition])if(!/^(?:Sprites\/era-campaign\/movies\/|data\/zvs\/cmp\.res\/derived\/)[a-z0-9_\/.]+$/.test(f.path)||f.path.includes('..')||sha256(fs.readFileSync(path.join(mediaRoot,f.path)))!==f.sha256)throw Error('Changed decoded movie asset');
  if(m.browser.url!=='campaign-media/'+m.browser.sha256+'.png')throw Error('Invalid browser movie URL');
  const png=fs.readFileSync(path.join(mediaRoot,m.browser.path));let controls=0,loops=-1,declaredFrames=0;
  if(png.readUInt32BE(16)!==m.width||png.readUInt32BE(20)!==m.height)throw Error('Changed browser movie dimensions');
  for(let offset=8;offset<png.length;){const size=png.readUInt32BE(offset),kind=png.toString('ascii',offset+4,offset+8),data=offset+8;if(data+size+4>png.length)throw Error('Truncated browser animation');if(kind==='acTL'){declaredFrames=png.readUInt32BE(data);loops=png.readUInt32BE(data+4);}if(kind==='fcTL'){controls++;if(png.readUInt16BE(data+20)!==1||png.readUInt16BE(data+22)!==15)throw Error('Changed browser animation cadence');}offset+=size+12;}
  if(controls!==m.frameCount||declaredFrames!==m.frameCount||loops!==0)throw Error('Changed browser animation loop');
 }
 return result;
}
export function convertCampaignMovies(){
 const original=JSON.parse(fs.readFileSync(mediaManifest)),movies=[];
 for(const source of original.movies){
  const input=path.join(mediaRoot,source.path);if(sha256(fs.readFileSync(input))!==source.sha256)throw Error('Changed original movie bytes');
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',input])),stream=probe.streams.find(s=>s.codec_type==='video');
  if(probe.streams.length!==1||stream.r_frame_rate!=='15/1'||!stream.nb_frames)throw Error('Unadmitted original movie format or audio');
  const name=path.basename(source.key,'.avi'),animation='era-campaign/movies/'+name,folder='Sprites/'+animation;fs.mkdirSync(path.join(mediaRoot,folder),{recursive:true});
  execFileSync('ffmpeg',['-v','error','-y','-i',input,'-pix_fmt','rgba','-fps_mode','passthrough','-start_number','0',path.join(mediaRoot,folder,'%03d.png')]);
  const frames=Array.from({length:Number(stream.nb_frames)},(_,i)=>{const p=folder+'/'+String(i).padStart(3,'0')+'.png';return{path:p,sha256:sha256(fs.readFileSync(path.join(mediaRoot,p)))}});
  const definition={basepath:animation+'/',images:frames.map((f,i)=>({group:0,frame:i,file:path.basename(f.path)}))};const defPath='Sprites/'+animation+'.json';fs.writeFileSync(path.join(mediaRoot,defPath),JSON.stringify(definition)+'\n');
  const browserPath='data/zvs/cmp.res/derived/'+name+'.png';fs.mkdirSync(path.dirname(path.join(mediaRoot,browserPath)),{recursive:true});
  execFileSync('ffmpeg',['-v','error','-y','-i',input,'-pix_fmt','rgba','-plays','0','-f','apng',path.join(mediaRoot,browserPath)]);
  const raw=execFileSync('ffmpeg',['-v','error','-i',input,'-f','rawvideo','-pix_fmt','rgba','-'],{maxBuffer:16*1024*1024});
  const decoded=execFileSync('ffmpeg',['-v','error','-ignore_loop','1','-i',path.join(mediaRoot,browserPath),'-f','rawvideo','-pix_fmt','rgba','-'],{maxBuffer:16*1024*1024});
  if(!raw.equals(decoded))throw Error('Animation conversion changed decoded pixels');
  for(const [index,frame]of frames.entries())frame.rgbaSha256=sha256(raw.subarray(index*stream.width*stream.height*4,(index+1)*stream.width*stream.height*4));
  const browserSha=sha256(fs.readFileSync(path.join(mediaRoot,browserPath)));
  movies.push({key:source.key,sourceSha256:source.sha256,width:stream.width,height:stream.height,frameCount:frames.length,fpsNumerator:15,fpsDenominator:1,audioStreams:0,decodedRgbaSha256:sha256(raw),animation,frames,nativeDefinition:{path:defPath,sha256:sha256(fs.readFileSync(path.join(mediaRoot,defPath)))},browser:{path:browserPath,sha256:browserSha,url:'campaign-media/'+browserSha+'.png'}});
 }
 const manifest={schemaVersion:1,contract:'source-campaign-movies-v1',conversion:'Original decoded RGBA pixels, frame order and15fps retained; silent, looping APNG and native PNG frames.',movies};fs.writeFileSync(movieManifest,JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync('web/campaign-movie-data.mjs','// Generated lossless presentation of the original silent AVI frames.\nexport const campaignMovieMedia='+JSON.stringify(Object.fromEntries(movies.map(m=>[m.key,{url:m.browser.url,width:m.width,height:m.height,frames:m.frameCount,fps:15}])),null,2)+';\n');
 return checkCampaignMovies();
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))process.argv.includes('--check')?checkCampaignMovies():convertCampaignMovies();
