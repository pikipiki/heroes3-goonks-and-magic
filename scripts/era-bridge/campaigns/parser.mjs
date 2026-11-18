/** Original campaign ERM syntax only. Compiling a program never executes it. */
import crypto from 'node:crypto';
import {createLocalBindings} from './local-bindings.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=(message,source)=>{throw new Error(`${source??'ERM'}: ${message}`);};
export const campaignReceivers=new Set('IF VR UN HE OW OB HO TR TM FU LE MO CD CH DW CA DO GR MC MA WG HT BA BF BU BM BG QW PO MW MT BH CE SN'.split(' '));
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
 const named=/^(-?)([is])\^([\s\S]*)\^$/.exec(text);if(named){if(named[1]&&named[2]==='s')fail('Cannot negate a named string');return {...base,kind:'named',space:named[2],name:named[3],negate:!!named[1]};}
 const variable=/^(-?)([vxywze])(.+)$/.exec(text);if(variable){const index=parseOperand(variable[3]);if(!['number','variable','macro','fast','named'].includes(index.kind)||index.access!=='read')fail('Invalid variable index '+text);return {...base,kind:'variable',space:variable[2],index,negate:!!variable[1]};}
 if(/^-?[a-z]$/.test(text))return {...base,kind:'fast',name:text.replace('-',''),negate:text.startsWith('-')};
 fail('Unsupported operand '+JSON.stringify(token));
}
function firstOutside(text,match){
 let quote='';
 for(let i=0;i<text.length;i++){
  const c=text[i];if(quote){if(c===quote)quote='';continue;}
  if(c==='^'||c==='@'||c==='$'){quote=c;continue;}
  const found=match(text.slice(i));if(found)return {index:i,match:found};
 }
 return null;
}
export function parseConditions(raw, junction='all'){
 if(!raw)return [];
 const parsed=splitOutside(raw).map(group=>({any:splitOutside(group,'|').map(value=>{
  const token=value.trim(),found=firstOutside(token,text=>/^(>=|<=|=>|=<|<>|><|=|>|<)/.exec(text));
  if(found){const op=found.match[0];return{left:parseOperand(token.slice(0,found.index)),comparison:op.replace('=>','>=').replace('=<','<=').replace('><','<>'),right:parseOperand(token.slice(found.index+op.length))};}
  const flag=parseOperand(value);if(flag.kind!=='number')fail('Flag condition must be numeric '+value);return{flag:Math.abs(flag.number),expected:flag.number>=0};
 })}));
 return junction==='any'?[{any:parsed.flatMap(group=>group.any)}]:parsed;
}
export function parseServiceOperand(raw){
 const token=raw.trim();if(token==='d')return {raw:token,access:'relative',kind:'number',number:0,modifier:'+'};
 const match=/^d(<<|>>|[+*:%&|~\-])?([\s\S]+)$/.exec(token);
 if(!match)return parseOperand(token);
 const value=parseOperand(match[2]);if(value.access!=='read')fail('Invalid service modifier operand '+token);
 return {...value,raw:token,access:'relative',modifier:match[1]??'+'};
}
function parseArguments(raw,receiver){
 if(receiver==='SN')return splitOutside(raw).map(parseServiceOperand);
 const parts=[];
 for(const segment of splitOutside(raw)){
  const at=segment.indexOf('^');
  if(at>0&&!/^(?:\?|d|>=|<=|<>|=|>|<)?-?[is]$/.test(segment.slice(0,at).trim())){const prefix=segment.slice(0,at).trim().replace(/:$/,'');if(prefix)parts.push(parseOperand(prefix));parts.push(parseOperand(segment.slice(at)));}
  else parts.push(parseOperand(segment));
 }
 return parts;
}
export function parseOperations(body,receiver){
 const result=[];let i=0;
 while(i<body.length){while(/\s/.test(body[i]??'')&&i<body.length)i++;if(i===body.length)break;
  const code=body[i++];if(!/[A-Z+*:%&|\-]/.test(code))fail('Unsupported operation '+code+' in '+receiver);
  if(receiver==='SN'&&code!=='W')fail('Unbound receiver SN operation '+code);
  const start=i;let quote='',argumentStart=true;
  while(i<body.length){const c=body[i];if(quote){if(c===quote)quote='';i++;argumentStart=false;continue;}if(c==='^'||c==='@'||c==='$'){quote=c;i++;continue;}
   if(/[A-Z]/.test(c))break;
   if(receiver==='VR'&&/[+*:%&|\-]/.test(c)&&!argumentStart)break;
   if(/\s/.test(c)){let next=i;while(/\s/.test(body[next]??'')&&next<body.length)next++;if(next<body.length&&/[A-Z+*:%&|\-]/.test(body[next]))break;}
   if(c==='/')argumentStart=true;else if(!/\s/.test(c))argumentStart=false;i++;
  }
  if(quote)fail('Unterminated operation literal');
  const rawArgs=body.slice(start,i);result.push({code,args:['FU','DO','SN'].includes(receiver)&&!rawArgs.trim()?[]:parseArguments(rawArgs,receiver)});
 }
 return result;
}
export function tokenizeErm(bytes,{encoding='utf-8',source='ERM'}={}){
 bytes=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);const text=bytes.toString('latin1'),decoder=new TextDecoder(encoding),tokens=[];let i=0,line=1;
 while(i<text.length){const c=text[i];if(c==='\n'){i++;line++;continue;}if(!/^![!?#$][A-Za-z]{2}/.test(text.slice(i,i+4))){i++;continue;}
  const offset=i,firstLine=line;let quoted=false,terminated=false;i+=2;
  while(i<text.length){const ch=text[i++];if(ch==='\n')line++;if(ch==='^')quoted=!quoted;if(ch===';'&&!quoted){terminated=true;break;}}
  if(!terminated)fail('Unterminated instruction at line'+firstLine,source);
  const raw=bytes.subarray(offset,i);tokens.push({statement:decoder.decode(raw),offset,endOffset:i,line:firstLine,sha256:sha(raw)});
 }
 return tokens;
}
function bindIdentifiers(statement,bindings){
 let output=statement.slice(0,2),quote='';
 for(let i=2;i<statement.length;){
  const c=statement[i];
  if(quote){output+=c;i++;if(c===quote)quote='';continue;}
  if(c==='^'||c==='@'||c==='$'){quote=c;output+=c;i++;continue;}
  const found=c==='('?/^\(([A-Za-z_][A-Za-z0-9_]*)\)/.exec(statement.slice(i)):null;
  if(found&&Object.hasOwn(bindings,found[1])){output+=String(bindings[found[1]]);i+=found[0].length;}
  else{output+=c;i++;}
 }
 return output;
}
export function compileErm(bytes,{source='ERM',encoding='utf-8',bindings={},dialect='auto'}={}){
 if(!bindings||typeof bindings!=='object'||Array.isArray(bindings))fail('Invalid identifier bindings',source);
 const bound=Object.fromEntries(Object.entries(bindings).sort(([a],[b])=>a<b?-1:a>b?1:0));
 for(const[name,value]of Object.entries(bound))if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)||!Number.isSafeInteger(value)||value< -2147483648||value>4294967295)fail('Invalid identifier binding '+name,source);
 if(!['auto','wog358','era3'].includes(dialect))fail('Unknown ERM dialect '+dialect,source);
 const erm2=Buffer.from(bytes).subarray(0,5).toString()==='ZVSE2',era3=dialect==='era3'||dialect==='auto'&&erm2,lowerLocals=erm2?createLocalBindings(bound):null;
 if(erm2&&dialect==='wog358')fail('ZVSE2 requires the ERA3 call dialect',source);
 const tokens=tokenizeErm(bytes,{source,encoding}),blocks=[],initializers=[],flows=new Map();let current=null,modern=erm2;
 const stackFor=commands=>{if(!flows.has(commands))flows.set(commands,[]);return flows.get(commands);};
 const target=(command,index)=>{command.operations[0].args[0].number=index;};
 const jump=(record,code)=>({...record,receiver:'__flow',selectors:[],operations:[{code,args:[{kind:'number',access:'read',number:0}]}]});
 for(const token of tokens){try{
  const lowered=lowerLocals?lowerLocals(token.statement):bindIdentifiers(token.statement,bound);
  for(const statement of Array.isArray(lowered)?lowered:[lowered]){
  if(statement===null)continue;
  const m=/^!([!?#$])([A-Za-z]{2})([^:;]*)(?::([\s\S]*))?;$/.exec(statement);if(!m)fail('Invalid statement '+token.statement);
  const kind=m[1],receiver=m[2].toUpperCase(),at=firstOutside(m[3],text=>/^[&|]/.exec(text))?.index??-1,selectorText=at<0?m[3]:m[3].slice(0,at),conditionText=at<0?'':m[3].slice(at+1),selectors=splitOutside(selectorText).filter(s=>s.trim()).map(parseOperand),conditions=parseConditions(conditionText,m[3][at]==='|'?'any':'all');
  const record={receiver,selectors,conditions,source:{line:token.line,offset:token.offset,endOffset:token.endOffset,sha256:token.sha256}};
  if(kind==='?'||kind==='$'){
   if([...flows.values()].some(stack=>stack.length))fail('Structured condition crosses a trigger declaration');
   current={...record,kind:kind==='?'?'trigger':'post-trigger',commands:[]};blocks.push(current);continue;
  }
  const commands=kind==='#'?initializers:current?.commands;
  if(!commands)fail('Receiver before first trigger');
  if(['if','el','en'].includes(m[2])){
   if(kind==='#')record.visibleBlocks=blocks.length;
   if(selectors.length||m[4]!==undefined)fail('Structured control takes conditions only');
   modern=true;const stack=stackFor(commands);
   if(m[2]==='if'){
    const branch=jump(record,'F');commands.push(branch);stack.push({branch,ends:[],hasElse:false});
   }else{
    if(!stack.length)fail('Structured '+m[2]+' without if');const frame=stack.at(-1);
    if(m[2]==='el'){
     if(frame.hasElse)fail('Structured branch after else');
     const end=jump({...record,conditions:[]},'J');commands.push(end);frame.ends.push(end);target(frame.branch,commands.length);
     frame.hasElse=!conditions.length;
     if(conditions.length){frame.branch=jump(record,'F');commands.push(frame.branch);}else frame.branch=null;
    }else{
     if(conditions.length)fail('Structured end takes no condition');
     if(frame.branch)target(frame.branch,commands.length);for(const end of frame.ends)target(end,commands.length);stack.pop();
    }
   }
   continue;
  }
  if(!campaignReceivers.has(receiver))fail('Unbound receiver '+receiver);
  commands.push({...record,operations:parseOperations(m[4]??'',receiver),...(kind==='#'?{visibleBlocks:blocks.length}:{})});
  }
 }catch(e){fail('line'+token.line+' '+e.message,source);}}
 if([...flows.values()].some(stack=>stack.length))fail('Unterminated structured condition',source);
 const metadata=era3&&[...initializers,...blocks.flatMap(b=>b.commands)].some(c=>c.receiver==='FU'&&c.operations.some(op=>['A','S'].includes(op.code)));
 const integerArgument=arg=>{
  const mutable=arg.kind==='variable'&&'vxyw'.includes(arg.space)||arg.kind==='named'&&arg.space==='i'||arg.kind==='fast'&&/^[f-t]$/.test(arg.name);
  return ['read','write'].includes(arg.access)&&!(arg.access==='write'&&arg.negate)&&(mutable||arg.access==='read'&&['number','day'].includes(arg.kind));
 };
 if(era3)for(const command of [...initializers,...blocks.flatMap(b=>b.commands)]){
  if(command.receiver==='DO')fail('ERA3 DO calls are not admitted',source);
  if(command.receiver==='FU')for(const op of command.operations)if(op.code==='P')for(const arg of op.args){
   if(!integerArgument(arg))fail('ERA3 FU:P requires admitted integer arguments',source);
  }
  if(command.receiver==='FU')for(const op of command.operations)if(['A','S'].includes(op.code)){
   if(command.selectors.length)fail('ERA3 function metadata takes no selector',source);
   if(op.code==='A'&&(!op.args.length||op.args.length>16||op.args.some(arg=>!integerArgument(arg)||arg.access!=='read'&&op.args.length!==1)))fail('ERA3 FU:A requires integer defaults or one numeric output',source);
   if(op.code==='S'&&(op.args.length!==2||op.args[0].access!=='read'||op.args[1].access!=='write'||op.args.some(arg=>!integerArgument(arg))))fail('ERA3 FU:S requires an integer index and numeric output',source);
  }
 }
 const sourceSha256=sha(Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes)),boundNames=Object.keys(bound).length>0;
 const identity=boundNames||era3?sha(Buffer.from(JSON.stringify({sourceSha256,bindings:bound,...(era3?{functionArguments:'era3-integers'}:{}),...(metadata?{functionMetadata:'era3-integers'}:{})}))):sourceSha256;
 const integerBounds=[...initializers,...blocks.flatMap(b=>b.commands)].some(c=>c.receiver==='VR'&&c.operations.some(op=>op.code==='F'));
 const version=metadata?5:era3?4:integerBounds?3:modern||boundNames?2:1;
 return{schemaVersion:version,contract:'source-campaign-erm-ast-v'+version,source,encoding,sha256:identity,...(boundNames||era3?{sourceSha256,bindings:bound}:{}),...(era3?{functionArguments:'era3-integers'}:{}),...(metadata?{functionMetadata:'era3-integers'}:{}),initializers,blocks};
}
