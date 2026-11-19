import {renderMarkup as materialMarkup} from './mui-runtime.mjs';
import {restoreActionDock} from './action-dock.mjs';
// Exported rendering helpers can be called while an asynchronous module
// barrel is still evaluating. Initialize their caches on first use, and never
// overwrite them when that module's evaluation subsequently completes.
var records,origins;
function initializeCaches(){records??=new WeakMap();origins??=new WeakMap();}
// Factories retain their command bridge. Normalize nodes moved by legacy
// adapters before handing a refreshed subtree back to React.
export function restoreMovedActions(root){
 initializeCaches();
 for(const dock of [root,...root.querySelectorAll('.ui-action-dock')])restoreActionDock(dock);
 for(const node of root.querySelectorAll('[data-mui-component]')){const origin=origins.get(node);if(origin?.parent.isConnected&&!root.contains(origin.parent))origin.parent.insertBefore(node,origin.next?.parentNode===origin.parent?origin.next:null);}
}
export function renderMarkup(root,markup,options){
 initializeCaches();
 restoreMovedActions(root);
 for(const {node,parent,next}of records.get(root)||[])if(root.contains(node)&&node.parentNode!==parent&&root.contains(parent))parent.insertBefore(node,next?.parentNode===parent?next:null);
 for(const node of root.querySelectorAll('[data-ui-header-close=true]:not([data-mui-component]),.ui-action-dock:not([data-ui-source-dock])'))if(!node.children.length||node.hasAttribute('data-ui-header-close'))node.remove();
 materialMarkup(root,markup,options);
 for(const dock of root.querySelectorAll('footer,.ui-action-dock'))dock.dataset.uiSourceDock='true';
 const nodes=[...root.querySelectorAll('[data-mui-component]')].map(node=>({node,parent:node.parentNode,next:node.nextSibling}));for(const record of nodes)if(!origins.has(record.node))origins.set(record.node,record);records.set(root,nodes);
}
