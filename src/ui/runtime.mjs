import React,{createElement as h,useState,useRef,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {ThemeProvider} from '@mui/material/styles';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import Toolbar from '@mui/material/Toolbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import {heroesTheme} from './theme.mjs';
const roots=new Map(),snapshots=new WeakMap(),owners=new WeakMap();let cleanup;
// A button moved into a menu still belongs to its original render root.
// A later menu snapshot must never adopt it and pull it back during cleanup.
function remember(root){snapshots.set(root,[root,...root.querySelectorAll('*')].map(parent=>({parent,children:[...parent.childNodes].filter(child=>{const owner=owners.get(child);if(owner&&owner!==root)return false;owners.set(child,root);return true;})})));}
function restore(root){for(const {parent,children}of snapshots.get(root)||[])for(const child of children)parent.append(child);}
function watch(){if(cleanup)return;cleanup=new MutationObserver(()=>{for(const root of roots.keys())if(!root.isConnected)disposeMaterialRoot(root);});cleanup.observe(document.body,{childList:true,subtree:true});}
function render(root,element){watch();let react=roots.get(root);if(!react){react=createRoot(root);roots.set(root,react);}flushSync(()=>react.render(h(ThemeProvider,{theme:heroesTheme},element)));remember(root);}
function propsFor(node){const props={};for(const attr of node.attributes){if(attr.name==='style'){const style={};for(const key of node.style)style[key.startsWith('--')?key:key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=node.style.getPropertyValue(key);props.style=style;}else{const key=({class:'className',for:'htmlFor',tabindex:'tabIndex',readonly:'readOnly',maxlength:'maxLength',colspan:'colSpan',rowspan:'rowSpan',autofocus:'autoFocus'})[attr.name]||attr.name;if(['disabled','hidden','multiple','required','checked','selected'].includes(key))props[key]=true;else props[key]=attr.value;}}
 if(node.tagName==='INPUT'){if('value'in props){props.defaultValue=props.value;delete props.value;}if('checked'in props){props.defaultChecked=props.checked;delete props.checked;}}
 return props;}
const fields=new WeakMap();
export function syncMaterialFields(root){for(const node of root.querySelectorAll('input[data-mui-field]'))fields.get(node)?.();}
function ChoiceField({input,label,labelProps}){
 const [checked,setChecked]=useState(Boolean(input.checked??input.defaultChecked)),[disabled,setDisabled]=useState(Boolean(input.disabled));
 const ref=useCallback(node=>{if(node){fields.set(node,()=>{setChecked(node.checked);setDisabled(node.disabled);});node.addEventListener('change',event=>{if(event.isTrusted)event.stopImmediatePropagation();});}},[]);
 const {defaultChecked,checked:ignored,type,...native}=input;
 const control=h(type==='radio'?Radio:Checkbox,{checked,disabled,name:input.name,value:input.value,slotProps:{input:{...native,ref,'data-mui-field':'choice'}},onChange:event=>{const node=event.target,value=node.checked;flushSync(()=>setChecked(value));node.checked=value;node.dispatchEvent(new Event('change',{bubbles:true}));syncMaterialFields(document.body);}});
 return h(FormControlLabel,{...labelProps,control,label:h('span',null,...label)});
}
function element(node,index){if(node.nodeType===3)return node.textContent;if(node.nodeType!==1)return null;const props=propsFor(node);props.key=props.id||Object.entries(props).find(([key])=>key.startsWith('data-')&&!key.startsWith('data-ui-'))?.join(':')||index;
 const choice=node.tagName==='LABEL'&&node.querySelector(':scope>input[type=radio],:scope>input[type=checkbox]');if(choice)return h(ChoiceField,{key:props.key,input:propsFor(choice),labelProps:props,label:[...node.childNodes].filter(child=>child!==choice).map(element)});
 const children=[...node.childNodes].map(element);if(node.tagName==='BUTTON'){const endTurn=node.dataset.ui==='endturn'&&matchMedia('(orientation:landscape) and (max-height:400px)').matches;if(endTurn){props['aria-label']=node.textContent.replace(/^☀\s*/,'');props.title=props['aria-label'];}const icon=endTurn||/^[✕×✖−+☰]$/u.test(node.textContent.trim())&&!!node.getAttribute('aria-label');props['data-mui-component']=icon?'IconButton':'Button';props.variant=node.classList.contains('primary')||node.dataset.uiVariant==='filled'?'contained':'outlined';if(icon)delete props.variant;const control=h(icon?IconButton:Button,props,...(endTurn?[h('span',{'aria-hidden':true},'☀')]:children));return node.matches('[data-exchange-slot]')?h(Tooltip,{key:props.key,title:props['aria-label']||node.textContent.trim(),describeChild:true},control):control;}
 if(node.matches('.map-movement-settings,.battle-view-setting'))return h(Stack,{...props,component:node.localName,spacing:1,useFlexGap:true,className:((props.className||'')+' ui-form-section')},...children);
 if(node.tagName==='HEADER')return h(Toolbar,{...props,component:'header'},...children);
 if(node.tagName==='FOOTER')return h(Stack,{...props,component:'footer',direction:'row',spacing:1,useFlexGap:true},...children);
 if(/^H[1-6]$/.test(node.tagName))return h(Typography,{...props,component:node.localName,variant:node.tagName==='H1'?'h1':node.tagName==='H2'?'h2':'h3'},...children);
 if(node.tagName==='P')return h(Typography,{...props,component:'p',variant:'body2'},...children);
 if(node.tagName==='ARTICLE')return h(Paper,{...props,component:'article',variant:'outlined'},...children);
 if(node.tagName==='SELECT'){const selected=[...node.options].find(option=>option.selected);if(selected)props.defaultValue=selected.value;}
 if(node.tagName==='OPTION')delete props.selected;
 if(['IMG','INPUT','BR','HR','WBR','SOURCE'].includes(node.tagName))return h(node.localName,props);
 return h(node.localName,props,...children);
}
// Render real MUI buttons before a factory attaches its native command handlers.
// The existing bridge and canvas nodes remain owned by their original modules.
export function renderMarkup(root,markup,{stable=false}={}){if(root.tagName==='TEMPLATE'){root.innerHTML=markup;return;}if(!/<button\b/i.test(markup)&&!roots.has(root)){root.innerHTML=markup;return;}
 if(!stable)disposeMaterialRoot(root);const template=document.createElement('template');template.innerHTML=markup;render(root,root.matches('.game-menu-body[data-view=settings]')?h(Stack,{spacing:2,useFlexGap:true,className:'ui-form-stack'},...[...template.content.childNodes].map(element)):h(React.Fragment,null,...[...template.content.childNodes].map(element)));}
export function renderMaterialSelect(host,{select,label,options,value,disabled,onChange}){render(host,h(Select,{value,disabled,displayEmpty:true,fullWidth:true,className:'material-select-trigger',inputProps:{'aria-label':label},MenuProps:{container:host.closest('dialog')||document.body,transitionDuration:0},onChange:event=>onChange(event.target.value)},options.map(option=>h(MenuItem,{key:option.value,value:option.value,disabled:option.disabled},option.label))));}
export function disposeMaterialRoot(host,restoreDom=true){const root=roots.get(host);if(root){for(const child of [...roots.keys()])if(child!==host&&host.contains(child))disposeMaterialRoot(child);if(restoreDom)restore(host);root.unmount();roots.delete(host);snapshots.delete(host);}}
export {heroesTheme};

export function createMaterialMenu(host,{anchor,container,role,label,className,onClose}){
 let list=null,open=false;const ref=node=>{if(node)list=node;};
 const update=()=>render(host,h(Menu,{open,'data-ui-menu-open':String(open),anchorEl:anchor,container,className,keepMounted:true,transitionDuration:0,onClose,slotProps:{list:{ref,role,'aria-label':typeof label==='function'?label():label,className:'ui-popup-list'},paper:{className:'ui-material-menu',sx:{minWidth:208,maxWidth:'calc(100vw - 16px)',maxHeight:'min(320px,calc(100dvh - 16px))'}}}}));
 update();return{get list(){return list;},show(){open=true;update();},close(){open=false;update();},dispose(){disposeMaterialRoot(host,false);}};
}
