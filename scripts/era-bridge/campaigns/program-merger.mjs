/** Preserve source call conventions and initializer jump offsets across files. */
export function sourceCallDialect(programs){
 const dialects=new Set(programs.map(p=>p.functionArguments||'wog358'));
 if(dialects.size>1)throw Error('Mixed source call dialects require an explicit import choice');
 const mode=dialects.values().next().value||'wog358';
 if(!['wog358','era3-integers'].includes(mode))throw Error('Unknown source call dialect '+mode);
 return mode;
}
export function mergeSourceInitializers(programs){
 sourceCallDialect(programs);
 let previousBlocks=0;
 const initializers=[];
 for(const program of programs){
  const firstCommand=initializers.length;
  for(const command of program.initializers)
   initializers.push({...command,visibleBlocks:previousBlocks+command.visibleBlocks,
    ...(command.receiver==='__flow'?{operations:command.operations.map(op=>({...op,
     args:op.args.map(arg=>({...arg,number:arg.number+firstCommand}))}))}:{})});
  previousBlocks+=program.blocks.length;
 }
 return initializers;
}
