// Bounded Heroes III DEF frame reader for original creature portraits.
export function readDefFrame(bytes,index){
 const fail=message=>{throw new Error('Invalid DEF: '+message);};
 const u32=p=>{if(!Number.isInteger(p)||p<0||p+4>bytes.length)fail('32-bit read outside file');return bytes.readUInt32LE(p);};
 const u16=p=>{if(p<0||p+2>bytes.length)fail('16-bit read outside file');return bytes.readUInt16LE(p);};
 const byte=p=>{if(p<0||p>=bytes.length)fail('byte outside file');return bytes[p];};
 if(!Buffer.isBuffer(bytes)||!Number.isInteger(index)||index<0)fail('expected buffer and frame index');
 let p=784;const offsets=[],names=[];const groups=u32(12);if(groups>1024)fail('too many groups');
 for(let g=0;g<groups;g++){const count=u32(p+4);if(count>100000)fail('too many frames');p+=16;if(p+13*count>bytes.length)fail('frame names outside file');for(let i=0;i<count;i++)names.push(bytes.subarray(p+13*i,p+13*(i+1)).toString('latin1').replace(/\0.*$/,''));p+=13*count;for(let i=0;i<count;i++)offsets.push(u32(p+i*4));p+=count*4;}
 const f=offsets[index];if(f===undefined)fail('missing frame '+index);
 const format=u32(f+4),fullWidth=u32(f+8),fullHeight=u32(f+12),width=u32(f+16),height=u32(f+20),left=u32(f+24),top=u32(f+28),base=f+32;
 if(format>3||!fullWidth||!fullHeight||fullWidth>4096||fullHeight>4096||width+left>fullWidth||height+top>fullHeight)fail('invalid dimensions or format');
 const indices=Buffer.alloc(fullWidth*fullHeight);let cursor=base;
 for(let y=0;y<height;y++){
  if(format===1)cursor=base+u32(base+y*4);
  if(format===2&&y===0)cursor=base+u16(base);
  let x=0;while(x<width){
   if(format===3&&x%32===0)cursor=base+u16(base+2*(y*Math.ceil(width/32)+Math.floor(x/32)));
   if(format===0){indices[(y+top)*fullWidth+x+++left]=byte(cursor++);continue;}
   const c=byte(cursor++),code=format===1?c:c>>5,count=format===1?byte(cursor++)+1:(c&31)+1;
   if(x+count>width||(format===3&&Math.floor(x/32)!==Math.floor((x+count-1)/32)))fail('run exceeds row/chunk');
   for(let n=0;n<count;n++)indices[(y+top)*fullWidth+x+++left]=code===(format===1?255:7)?byte(cursor++):code;
  }
 }
 const reserved=[[0,255,255],[255,150,255],[255,100,255],[255,50,255],[255,0,255],[255,255,0],[180,0,255],[0,255,0]],alpha=[0,64,64,128,128,0,128,64],rgba=Buffer.alloc(fullWidth*fullHeight*4);
 for(let i=0;i<indices.length;i++){const color=indices[i];if(!color)continue;const rgb=[...bytes.subarray(16+color*3,19+color*3)];if(rgb.length!==3)fail('missing palette');if(color<8&&rgb.every((v,j)=>Math.abs(v-reserved[color][j])<8))rgba[i*4+3]=alpha[color];else {bytes.copy(rgba,i*4,16+color*3,19+color*3);rgba[i*4+3]=255;}}
 return {width:fullWidth,height:fullHeight,rgba,name:names[index]};
}

// Heroes III reserves two portrait frames before indexed creatures. TUM's
// custom frame names independently encode the ERA ID, so refuse mismatches.
export function readCreaturePortrait(bytes,eraId){
 if(!Number.isSafeInteger(eraId)||eraId<0)throw new TypeError('Nonnegative ERA creature ID required');
 const image=readDefFrame(bytes,eraId+2);
 if(eraId>=197&&!new RegExp('^CPr[SL]'+eraId+'X[.]','i').test(image.name))throw new Error('Portrait name does not match ERA creature '+eraId+': '+image.name);
 return image;
}
