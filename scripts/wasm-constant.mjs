// Read a tiny exported ABI version function without instantiating the game.
// Parsing is deliberately limited to a local-free i32 constant return.
export function exportedI32Constant(bytes,name,importedFunctions=0){
 const data=Buffer.from(bytes),fail=message=>{throw new Error('Invalid WASM ABI constant: '+message);};
 const byte=s=>{if(s.p>=s.end)fail('truncated section');return data[s.p++];};
 const uint=s=>{let n=0,m=1;for(let i=0;i<5;i++){const b=byte(s);n+=(b&127)*m;if(!(b&128)){if(n>0xffffffff)fail('integer overflow');return n;}m*=128;}fail('invalid integer');};
 if(data.length<8||data.readUInt32LE(0)!==0x6d736100||data.readUInt32LE(4)!==1)fail('header');
 const sections=new Map(),s={p:8,end:data.length};while(s.p<s.end){const kind=byte(s),length=uint(s),end=s.p+length;if(end>s.end)fail('section size');if(kind)sections.set(kind,{p:s.p,end});s.p=end;}
 const exports=sections.get(7);if(!exports)fail('missing exports');let index;
 for(let i=0,n=uint(exports);i<n;i++){const length=uint(exports),end=exports.p+length;if(end>exports.end)fail('export name');const label=data.subarray(exports.p,end).toString('utf8');exports.p=end;const kind=byte(exports),value=uint(exports);if(label===name){if(kind!==0)fail('export is not a function');index=value-importedFunctions;}}
 if(!Number.isInteger(index)||index<0)fail('missing defined function');const code=sections.get(10);if(!code)fail('missing code');const count=uint(code);if(index>=count)fail('function index');
 for(let i=0;i<count;i++){const size=uint(code),body={p:code.p,end:code.p+size};if(body.end>code.end)fail('body size');code.p=body.end;if(i!==index)continue;if(uint(body)!==0||byte(body)!==0x41)fail('expected local-free i32.const');let value=0,bits=0,last;do{last=byte(body);value|=(last&127)<<bits;bits+=7;if(bits>35)fail('i32 overflow');}while(last&128);if(bits<32&&(last&64))value|=~0<<bits;if(data[body.p]===0x0f)body.p++;if(byte(body)!==0x0b||body.p!==body.end)fail('unexpected instructions');return value|0;}
 fail('missing body');
}
