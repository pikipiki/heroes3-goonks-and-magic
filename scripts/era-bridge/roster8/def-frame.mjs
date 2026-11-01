/** Bounded independent H3 DEF frame decoder. Format layouts are corroborated by
 * native VCMI CDefFile.cpp. Color conversion follows ScalableImage.cpp. */
export function decodeDefFrame(bytes,index){
 const u32=p=>{if(p<0||p+4>bytes.length)throw new Error('Truncated DEF');return bytes.readUInt32LE(p);},u16=p=>{if(p<0||p+2>bytes.length)throw new Error('Truncated DEF');return bytes.readUInt16LE(p);},byte=p=>{if(p<0||p>=bytes.length)throw new Error('Truncated DEF');return bytes[p];};
 let p=784;const frames=[],groups=u32(12);if(groups>256)throw new Error('Invalid DEF group count');for(let g=0;g<groups;g++){const count=u32(p+4);if(count>100000)throw new Error('Invalid DEF frame count');p+=16;const names=p;p+=13*count;for(let i=0;i<count;i++)frames.push({offset:u32(p+i*4),name:bytes.subarray(names+i*13,names+i*13+13).toString('latin1').split('\0')[0]});p+=4*count;}
 if(!frames[index])throw new Error('Missing DEF frame '+index);const f=frames[index].offset,format=u32(f+4),fullWidth=u32(f+8),fullHeight=u32(f+12),width=u32(f+16),height=u32(f+20),left=bytes.readInt32LE(f+24),top=bytes.readInt32LE(f+28),base=f+32;
 if(!fullWidth||!fullHeight||fullWidth>1024||fullHeight>1024||width>fullWidth||height>fullHeight||left<0||top<0||left+width>fullWidth||top+height>fullHeight||format>3)throw new Error('Invalid DEF frame layout');
 const indices=Buffer.alloc(fullWidth*fullHeight);let cursor=base;
 for(let y=0;y<height;y++){if(format===1)cursor=base+u32(base+y*4);if(format===2&&y===0)cursor=base+u16(base);let x=0;while(x<width){if(format===3&&x%32===0)cursor=base+u16(base+2*(y*Math.ceil(width/32)+Math.floor(x/32)));if(format===0){indices[(y+top)*fullWidth+x+left]=byte(cursor++);x++;continue;}const token=byte(cursor++),code=format===1?token:token>>5,length=format===1?byte(cursor++)+1:(token&31)+1;if(x+length>width||(format===3&&Math.floor(x/32)!==Math.floor((x+length-1)/32)))throw new Error('DEF run exceeds row/chunk');for(let n=0;n<length;n++)indices[(y+top)*fullWidth+(x++)+left]=code===(format===1?255:7)?byte(cursor++):code;}}
 const specialSource=[[0,255,255],[255,150,255],[255,100,255],[255,50,255],[255,0,255],[255,255,0],[180,0,255],[0,255,0]],alpha=[0,64,64,128,128,0,128,64],rgba=Buffer.alloc(fullWidth*fullHeight*4);
 for(let i=0;i<indices.length;i++){const c=indices[i];if(!c)continue;const rgb=[...bytes.subarray(16+c*3,19+c*3)],special=c<8&&rgb.every((v,n)=>Math.abs(v-specialSource[c][n])<8);if(special)rgba[i*4+3]=alpha[c];else{bytes.copy(rgba,i*4,16+c*3,19+c*3);rgba[i*4+3]=255;}}
 return {width:fullWidth,height:fullHeight,rgba,name:frames[index].name};
}
/** Native SND reader corresponds to VCMI CArchiveLoader.cpp:143-174. */
export function readSoundArchive(bytes){
 if(!Buffer.isBuffer(bytes)||bytes.length<4)throw new Error('Invalid SND header');const count=bytes.readUInt32LE(0),end=4+count*48;if(count>100000||end>bytes.length)throw new Error('Invalid SND directory');const entries=new Map();
 for(let i=0;i<count;i++){const p=4+i*48,raw=bytes.subarray(p,p+40).toString('latin1').split('\0')[0],name=raw+'.wav',offset=bytes.readUInt32LE(p+40),size=bytes.readUInt32LE(p+44);if(!raw||/[\\/]/.test(raw)||entries.has(name.toLowerCase())||offset<end||offset+size>bytes.length)throw new Error('Invalid SND entry '+name);entries.set(name.toLowerCase(),{name,offset,size});}
 return {names:[...entries.values()].map(e=>e.name),extract(name){const e=entries.get(name.toLowerCase());if(!e)throw new Error('Missing SND resource '+name);return Buffer.from(bytes.subarray(e.offset,e.offset+e.size));}};
}
export function readCreatureAnimationRows(text){
 const rows=[];for(const [i,line]of text.split(/\r?\n/).entries()){const c=line.split('\t');if(c.length<25||!c.slice(0,24).every(v=>/^-?\d+(?:\.\d+)?$/.test(v.trim())))continue;const n=c.slice(0,24).map(Number);rows.push({id:rows.length,sourceLine:i+1,timeBetweenFidgets:n[0],animationTime:{walk:n[1],attack:n[2],idle:10},missile:{offset:{upperX:n[4],upperY:n[5],middleX:n[6],middleY:n[7],lowerX:n[8],lowerY:n[9]},frameAngles:n.slice(10,22),attackClimaxFrame:n[23]},referenceName:c[24]});}if(!rows.length)throw new Error('No CRANIM rows');return rows;
}
