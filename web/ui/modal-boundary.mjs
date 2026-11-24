import {createMaterialDialogBoundary} from './mui-runtime.mjs';
import {screenContract} from './contracts.mjs';
import {installNativeDialog} from './native-dialog.mjs';
const boundaries=new WeakMap(),sessions=new WeakMap();
let nextTitle=0;
// The original home remains the logical parent after MUI portals the Paper.
// Only MUI owns backdrop, focus trapping, focus restoration and modal stacking.
function visible(record){
 const {root,home,parents}=record;
 if(!root.isConnected||root.hidden||root.tagName==='DIALOG'&&!root.open)return false;
 if(home&&!home.isConnected)return false;
 if(parents.some(parent=>parent.hidden||!parent.isConnected||parent.tagName==='DIALOG'&&!parent.open))return false;
 if(root.closest('[hidden]'))return false;
 const cs=root.ownerDocument.defaultView.getComputedStyle(root);
 if(cs.display==='none'||cs.visibility==='hidden')return false;
 if(record.boundary.open)return true;
 return root.getClientRects().length>0;
}
function rememberHome(record){
 if(!record.root.isConnected||record.home&&(record.boundary.open||record.root.parentElement===record.home||record.root.closest('.MuiDialog-root')))return;
 record.home=record.root.parentElement;
 record.parents=[];for(let parent=record.home;parent;parent=parent.parentElement)record.parents.push(parent);
 const container=record.home?.matches('.mobile-play,#mobile-app')?record.home:record.root.closest('#mobile-app')||record.home||record.root.ownerDocument.body;
 record.boundary.update({container});
}
function synchronize(session){
 if(session.syncing)return;
 session.syncing=true;
 session.observer?.disconnect();
 try{
  for(const record of [...session.records]){
   rememberHome(record);
   if(record.home&&(!record.root.isConnected||!record.home.isConnected||record.boundary.anchor&&!record.boundary.anchor.isConnected)){
    const removed=!record.root.isConnected;
    record.boundary.dispose();if(removed)record.root.remove();record.shim?.dispose();session.records.delete(record);boundaries.delete(record.root);continue;
   }
   const next=visible(record);
   if(next!==record.boundary.open)record.boundary.setOpen(next);
  }
 }finally{session.syncing=false;session.observer?.observe(session.doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open']});}
}
function sessionFor(doc){
 let session=sessions.get(doc);if(session)return session;
 session={doc,records:new Set(),syncing:false,queued:false,observer:null};sessions.set(doc,session);
 const touchesModal=node=>{if(!node||node.nodeType!==1)return false;for(const r of session.records)if(r.root===node||r.home===node||r.root.contains(node)||node.contains(r.root)||r.parents.includes(node))return true;return false;};
 const observer=new MutationObserver(records=>{if(session.syncing||session.queued)return;if(!records.some(rec=>touchesModal(rec.target)))return;session.queued=true;queueMicrotask(()=>{session.queued=false;synchronize(session);});});
 session.observer=observer;
 observer.observe(doc.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','open']});
 return session;
}
export function useModalBoundary(root,contract=screenContract(root)){
 let record=boundaries.get(root);
 if(!record&&root.tagName!=='DIALOG'&&!contract?.modal&&root.getAttribute('aria-modal')!=='true')return;
 const session=sessionFor(root.ownerDocument);
 if(!record){
  record={root,home:null,parents:[],contract};
  const title=root.querySelector('h1,h2,h3');
  if(title&&!root.hasAttribute('aria-labelledby')&&!root.hasAttribute('aria-label')){if(!title.id)title.id=`ui-dialog-title-${++nextTitle}`;root.setAttribute('aria-labelledby',title.id);}
  record.boundary=createMaterialDialogBoundary(root,{onClose:(event,reason)=>{
   if(reason!=='escapeKeyDown')return;
   if(root.tagName==='DIALOG'){
    const cancel=new root.ownerDocument.defaultView.Event('cancel',{cancelable:true});
    if(root.dispatchEvent(cancel)&&root.open)root.close();
   }else{
    const current=record.contract||screenContract(root),button=current?.close&&root.querySelector(current.close);
    if(button&&!button.disabled)button.click();
   }
   synchronize(session);
  }});
  record.shim=installNativeDialog(root,{setOpen(value){rememberHome(record);record.boundary.setOpen(value);}});
  boundaries.set(root,record);session.records.add(record);
 }else if(contract)record.contract=contract;
 synchronize(session);
 return record.boundary;
}
