type CompilationCache={key:string;promise:Promise<WebAssembly.Module>};
export type CompilationOwner={Promise?:PromiseConstructor;goonkCrossoverCompilation?:CompilationCache};
// Keep code, never a live simulation or its MPQs, across retired battle frames.
export function compiledEngine(owner:CompilationOwner,key:string,compile:()=>Promise<WebAssembly.Module>):Promise<WebAssembly.Module>{
 if(owner.goonkCrossoverCompilation?.key===key)return owner.goonkCrossoverCompilation.promise;
 const entry=Object.create(null) as CompilationCache;entry.key=key;entry.promise=(owner.Promise||Promise).resolve().then(compile);
 owner.goonkCrossoverCompilation=entry;
 entry.promise=entry.promise.catch(error=>{if(owner.goonkCrossoverCompilation===entry)delete owner.goonkCrossoverCompilation;throw error;});
 return entry.promise;
}
