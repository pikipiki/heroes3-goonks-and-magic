/** Original campaign ERM syntax only. Compiling a program never executes it. */
import crypto from 'node:crypto';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=(message,source)=>{throw new Error(`${source??'ERM'}: ${message}`);};
export const campaignReceivers=new Set('IF VR UN HE OW OB HO TR TM FU LE MO CD CH DW CA DO GR MC MA WG HT BA BF BU BM BG QW PO MW MT BH CE'.split(' '));
export function splitOutside(text,separator='/'){
 const result=[];let start=0,quote='';
 for(let i=0;i<text.length;i++){const c=text[i];if(quote){if(c===quote)quote='';continue;}if(c==='^'||c==='@'||c==='$'){quote=c;continue;}if(c===separator){result.push(text.slice(start,i));start=i+1;}}
 if(quote)fail('Unterminated '+quote+' literal');result.push(text.slice(start));return result;
}
export function parseOperand(raw){
 const token=raw.trim();let text=token,access='read',comparison='';
 if(text.startsWith('?')){access='write';text=text.slice(1);}
 else {const m=/^(>=|<=|=>|=<|<>|><|=|>|<)/.exec(text);if(m){access='compare';comparison=m[1].replace('=>','>=').replace('=<','<=').replace('><','<>');text=text.slice(m[1].length);}}
 if(text.startsWith('d')&&text.length>1){if(access!=='read')fail('Relative operand cannot also query/compare');access='relative';text=text.slice(1);}
 const base={raw:token,access,...(comparison?{comparison}:{})};
 if(!text)return {...base,kind:'default'};
 if(text.startsWith('^')&&text.endsWith('^'))return {...base,kind:'string',text:text.slice(1,-1)};
 if(/^@[^@]+@$/.test(text)||/^\$[^$]+\$$/.test(text))return {...base,kind:'macro',name:text.slice(1,-1)};
 if(/^[+-]?\d+$/.test(text)){const n=Number(text);if(!Number.isSafeInteger(n)||n< -2147483648||n>4294967295)fail('Integer outside source32 domain '+text);return {...base,kind:'number',number:n>2147483647?n-4294967296:n};}
 if(/^c[+-]?\d+$/.test(text))return {...base,kind:'day',offset:Number(text.slice(1))};
 const variable=/^(-?)([vxywze])(.+)$/.exec(text);if(variable){const index=parseOperand(variable[3]);if(!['number','variable','macro','fast'].includes(index.kind)||index.access!=='read')fail('Invalid variable index '+text);return {...base,kind:'variable',space:variable[2],index,negate:!!variable[1]};}
 if(/^-?[a-z]$/.test(text))return {...base,kind:'fast',name:text.replace('-',''),negate:text.startsWith('-')};
 fail('Unsupported operand '+JSON.stringify(token));
}
export function parseConditions(raw, junction='all'){
 if(!raw)return [];
 const parsed=splitOutside(raw).map(group=>({any:splitOutside(group,'|').map(value=>{
  const m=/^(.+?)(>=|<=|=>|=<|<>|><|=|>|<)(.+)$/.exec(value.trim());
  if(m)return{left:parseOperand(m[1]),comparison:m[2].replace('=>','>=').replace('=<','<=').replace('><','<>'),right:parseOperand(m[3])};
  const flag=parseOperand(value);if(flag.kind!=='number')fail('Flag condition must be numeric '+value);return{flag:Math.abs(flag.number),expected:flag.number>=0};
 })}));
 return junction==='any'?[{any:parsed.flatMap(group=>group.any)}]:parsed;
}
function parseArguments(raw){
 const parts=[];
 for(const segment of splitOutside(raw)){
  const at=segment.indexOf('^');
  if(at>0){const prefix=segment.slice(0,at).trim().replace(/:$/,'');if(prefix)parts.push(parseOperand(prefix));parts.push(parseOperand(segment.slice(at)));}
  else parts.push(parseOperand(segment));
 }
 return parts;
}
export function parseOperations(body,receiver){
 const result=[];let i=0;
 while(i<body.length){while(/\s/.test(body[i]??'')&&i<body.length)i++;if(i===body.length)break;
  const code=body[i++];if(!/[A-Z+*:%&|\-]/.test(code))fail('Unsupported operation '+code+' in '+receiver);
  const start=i;let quote='',argumentStart=true;
  while(i<body.length){const c=body[i];if(quote){if(c===quote)quote='';i++;argumentStart=false;continue;}if(c==='^'||c==='@'||c==='$'){quote=c;i++;continue;}
   if(/[A-Z]/.test(c))break;
   if(receiver==='VR'&&/[+*:%&|\-]/.test(c)&&!argumentStart)break;
   if(/\s/.test(c)){let next=i;while(/\s/.test(body[next]??'')&&next<body.length)next++;if(next<body.length&&/[A-Z+*:%&|\-]/.test(body[next]))break;}
   if(c==='/')argumentStart=true;else if(!/\s/.test(c))argumentStart=false;i++;
  }
  if(quote)fail('Unterminated operation literal');
  const rawArgs=body.slice(start,i);result.push({code,args:['FU','DO'].includes(receiver)&&!rawArgs.trim()?[]:parseArguments(rawArgs)});
 }
 return result;
}
export function tokenizeErm(bytes,{encoding='utf-8',source='ERM'}={}){
 bytes=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);const text=bytes.toString('latin1'),decoder=new TextDecoder(encoding),tokens=[];let i=0,line=1,eligible=true;
 while(i<text.length){const c=text[i];if(c==='\n'){i++;line++;eligible=true;continue;}if(eligible&&/[\t\r ]/.test(c)){i++;continue;}if(!eligible||!/^![!?#$]/.test(text.slice(i,i+2))){eligible=false;i++;continue;}
  const offset=i,firstLine=line;let quoted=false,terminated=false;i+=2;
  while(i<text.length){const ch=text[i++];if(ch==='\n')line++;if(ch==='^')quoted=!quoted;if(ch===';'&&!quoted){terminated=true;break;}}
  if(!terminated)fail('Unterminated instruction at line'+firstLine,source);
  const raw=bytes.subarray(offset,i);tokens.push({statement:decoder.decode(raw),offset,endOffset:i,line:firstLine,sha256:sha(raw)});eligible=true;
 }
 return tokens;
}
export function compileErm(bytes,{source='ERM',encoding='utf-8'}={}){
 const tokens=tokenizeErm(bytes,{source,encoding}),blocks=[],initializers=[];let current=null;
 for(const token of tokens){try{
  const m=/^!([!?#$])([A-Za-z]{2})([^:;]*)(?::([\s\S]*))?;$/.exec(token.statement);if(!m)fail('Invalid statement '+token.statement);
  const kind=m[1],receiver=m[2].toUpperCase(),at=m[3].search(/[&|]/),selectorText=at<0?m[3]:m[3].slice(0,at),conditionText=at<0?'':m[3].slice(at+1),selectors=splitOutside(selectorText).filter(s=>s.trim()).map(parseOperand),conditions=parseConditions(conditionText,m[3][at]==='|'?'any':'all');
  const record={receiver,selectors,conditions,source:{line:token.line,offset:token.offset,endOffset:token.endOffset,sha256:token.sha256}};
  if(kind==='?'||kind==='$'){current={...record,kind:kind==='?'?'trigger':'post-trigger',commands:[]};blocks.push(current);continue;}
  if(!campaignReceivers.has(receiver))fail('Unbound receiver '+receiver);
  const command={...record,operations:parseOperations(m[4]??'',receiver)};
  if(kind==='#')initializers.push({...command,visibleBlocks:blocks.length});else {if(!current)fail('Receiver before first trigger');current.commands.push(command);}
 }catch(e){fail('line'+token.line+' '+e.message,source);}}
 return{schemaVersion:1,contract:'source-campaign-erm-ast-v1',source,encoding,sha256:sha(Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes)),initializers,blocks};
}
