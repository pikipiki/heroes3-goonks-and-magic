/** Wait for the native closed-file persistence notification before exporting bytes. */
export async function readCompletedNativeSave(page,command,{path='/home/web_user/.local/share/vcmi/Saves/Goonk-auto.vsgm1',tag=190}={}){
 await page.waitForFunction(()=>window.goonkMobileState?.autosaveAllowed&&!window.goonkAutosaveStatus?.pending,null,{timeout:90000});
 await page.evaluate(path=>{
  window.goonkTestSaveCompletion={path,done:false,error:null};
  const listener=event=>{
   if(event.detail?.path!==path)return;
   window.removeEventListener('goonk-save-persisted',listener);
   window.goonkTestSaveCompletion.done=true;
   window.goonkTestSaveCompletion.error=event.detail.ok?null:event.detail.error||'Native save persistence failed';
  };
  window.addEventListener('goonk-save-persisted',listener);
 },path);
 await command(34,tag);
 await page.waitForFunction(()=>window.goonkTestSaveCompletion?.done,null,{timeout:90000});
 await page.waitForTimeout(100);
 await page.waitForFunction(()=>!window.goonkAutosaveStatus?.pending,null,{timeout:90000});
 return Buffer.from(await page.evaluate(path=>{
  if(window.goonkTestSaveCompletion.error)throw Error(window.goonkTestSaveCompletion.error);
  return Array.from(Module.FS.readFile(path));
 },path));
}
