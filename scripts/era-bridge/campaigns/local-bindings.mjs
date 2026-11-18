/** Scalar ERM2 x/y locals, following Erm.pas PreprocessErm at 8c2fd47b.
 * Unsupported arrays, freeing and z/e locals are rejected rather than approximated.
 */
export function createLocalBindings(constants) {
 const locals=new Map();let next={x:1,y:1};
 const resolve=(name,interpolation=false)=>{
  if(Object.hasOwn(constants,name)&&!/^[a-z][A-Za-z0-9]*$/.test(name))return String(constants[name]);
  const declaration=/^([a-z][A-Za-z0-9]*)(?::([xy]))?$/.exec(name);
  if(!declaration)throw Error('Unsupported ERM2 local '+name);
  const [,key,type]=declaration;
  let variable=locals.get(key);
  if(!variable){
   if(!type)throw Error('Undeclared ERM2 local '+key);
   if(next[type]>(type==='x'?16:100))throw Error('ERM2 '+type+' local pool exhausted');
   variable={type,index:next[type]++};locals.set(key,variable);
  }else if(type&&variable.type!==type)throw Error('Conflicting ERM2 local declaration '+key);
  return (interpolation?'%'+variable.type.toUpperCase():variable.type)+variable.index;
 };
 return statement=>{
  if(/^![?$]/.test(statement)){locals.clear();next={x:1,y:1};}
  const dummy=statement.startsWith('!#VA');
  if(dummy&&!/^!#VA(?:\s*\([a-z][A-Za-z0-9]*(?::[xy])?\))+\s*;$/.test(statement))throw Error('Unsupported ERM2 local declaration');
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
