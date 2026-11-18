/** Scalar and constant-index ERM2 x/y locals, following Erm.pas at 8c2fd47b.
 * Dynamic indices and z/e locals require additional source contracts.
 */
export function createLocalBindings(constants) {
 const locals=new Map();let next={x:1,y:1},free={x:[],y:[]};
 const resolve=(name,interpolation=false)=>{
  if(Object.hasOwn(constants,name)&&!/^[a-z][A-Za-z0-9]*$/.test(name))return String(constants[name]);
  const declaration=/^([-@]?)([a-z][A-Za-z0-9]*)(?:\[(-?\d+|[A-Z][A-Z0-9_]*)\])?(?::([xy]))?$/.exec(name);
  if(!declaration)throw Error('Unsupported ERM2 local '+name);
  const [,mode,key,subscript,type]=declaration,address=mode==='@';
  const isSize=subscript==='SIZE';
  if(isSize&&address)throw Error('ERM2 SIZE cannot use the address operator');
  let item=0;
  if(subscript!==undefined&&!isSize){
   item=/^-?\d+$/.test(subscript)?Number(subscript):constants[subscript];
   if(!Number.isSafeInteger(item)||item< -2147483648||item>2147483647)throw Error('Invalid ERM2 array index '+subscript);
  }
  let variable=locals.get(key);
  if(mode==='-'){
   if(!variable)throw Error('Cannot free undeclared ERM2 local '+key);
   const pool=variable.type;
   if(next[pool]===variable.index+variable.count)next[pool]-=variable.count;
   else free[pool].unshift({index:variable.index,count:variable.count});
   locals.delete(key);return '';
  }
  const requested=type?(subscript===undefined?1:item):null;
  if(type&&isSize)throw Error('ERM2 SIZE cannot declare an array');
  if(!variable){
   if(!type)throw Error('Undeclared ERM2 local '+key);
   if(requested<0)throw Error('Invalid ERM2 array size '+requested);
   const count=Math.max(1,requested);
   const gap=free[type].findIndex(range=>range.count>=count);let index;
   if(gap>=0){
    const range=free[type][gap];index=range.index;
    if(range.count===count)free[type].splice(gap,1);
    else {range.index+=count;range.count-=count;}
   }else{
    if(count>(type==='x'?16:100)-next[type]+1)throw Error('ERM2 '+type+' local pool exhausted');
    index=next[type];next[type]+=count;
   }
   variable={type,index,count};locals.set(key,variable);
  }else if(type&&(variable.type!==type||variable.count!==requested))throw Error('Conflicting ERM2 local declaration '+key);
  if(isSize)return String(variable.count);
  if(type)item=0;else if(item<0)item+=variable.count;
  if(item<0||item>=variable.count)throw Error('ERM2 local array index out of range: '+name);
  const index=variable.index+item;
  return address?String(index):(interpolation?'%'+variable.type.toUpperCase():variable.type)+index;
 };
 return statement=>{
  if(/^![?$]/.test(statement)){locals.clear();next={x:1,y:1};free={x:[],y:[]};}
  const dummy=statement.startsWith('!#VA');
  if(dummy&&!/^!#VA(?:\s*\([-@]?[a-z][A-Za-z0-9]*(?:\[-?\d+\]|\[[A-Z][A-Z0-9_]*\])?(?::[xy])?\))+\s*;$/.test(statement))throw Error('Unsupported ERM2 local declaration');
  let output=statement.slice(0,2),quote='';
  for(let i=2;i<statement.length;){
   const c=statement[i];
   if(quote){
    if(c===quote){quote='';output+=c;i++;continue;}
    if(quote==='^'&&c==='%'&&statement[i+1]==='%'){output+='%%';i+=2;continue;}
    if(quote==='^'&&c==='%'&&statement[i+1]==='('){
     const end=statement.indexOf(')',i+2);if(end<0)throw Error('Unterminated ERM2 local interpolation');
     output+=resolve(statement.slice(i+2,end),true);i=end+1;continue;
    }
    if(quote==='^'&&c==='%'&&/^[A-Za-z]\(/.test(statement.slice(i+1)))throw Error('Indirect ERM2 local interpolation is not admitted');
    output+=c;i++;continue;
   }
   if(c==='^'||c==='@'||c==='$'){quote=c;output+=c;i++;continue;}
   if(c==='('){
    const end=statement.indexOf(')',i+1);if(end<0)throw Error('Unterminated ERM2 identifier');
    output+=resolve(statement.slice(i+1,end));i=end+1;continue;
   }
   output+=c;i++;
  }
  return dummy?null:output;
 };
}
