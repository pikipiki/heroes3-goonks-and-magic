import React,{createElement as h,useState,useRef,useCallback} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {ThemeProvider} from '@mui/material/styles';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Slider from '@mui/material/Slider';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import SvgIcon from '@mui/material/SvgIcon';
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
function watch(){if(cleanup)return;cleanup=new MutationObserver(records=>{for(const change of records)if(change.type==='attributes'&&change.target.matches('button[data-mui-component]'))change.target.classList.toggle('Mui-disabled',change.target.disabled);for(const root of roots.keys())if(!root.isConnected)disposeMaterialRoot(root);});cleanup.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});}
function render(root,element){watch();let react=roots.get(root);if(!react){react=createRoot(root);roots.set(root,react);}flushSync(()=>react.render(h(ThemeProvider,{theme:heroesTheme},element)));remember(root);}
function propsFor(node){const props={};for(const attr of node.attributes){if(attr.name==='style'){const style={};for(const key of node.style)style[key.startsWith('--')?key:key.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=node.style.getPropertyValue(key);props.style=style;}else{const key=({class:'className',for:'htmlFor',tabindex:'tabIndex',readonly:'readOnly',maxlength:'maxLength',colspan:'colSpan',rowspan:'rowSpan',autofocus:'autoFocus'})[attr.name]||attr.name;if(['disabled','hidden','multiple','required','checked','selected','open'].includes(key))props[key]=true;else props[key]=attr.value;}}
 if(node.tagName==='INPUT'){if('value'in props){props.defaultValue=props.value;delete props.value;}if('checked'in props){props.defaultChecked=props.checked;delete props.checked;}}
 return props;}
const fields=new WeakMap();
export function syncMaterialFields(root){for(const node of root.querySelectorAll('input[data-mui-field]'))fields.get(node)?.();}
function ChoiceField({input,label=[],labelProps,standalone=false}){
 const [checked,setChecked]=useState(Boolean(input.checked??input.defaultChecked)),[disabled,setDisabled]=useState(Boolean(input.disabled));
 const ref=useCallback(node=>{if(node){fields.set(node,()=>{setChecked(node.checked);setDisabled(node.disabled);});node.addEventListener('change',event=>{if(event.isTrusted)event.stopImmediatePropagation();});}},[]);
 const {defaultChecked,checked:ignored,type,...native}=input;
 const control=h(type==='radio'?Radio:Checkbox,{checked,disabled,name:input.name,value:input.value,slotProps:{input:{...native,ref,'data-mui-field':'choice'}},onChange:event=>{const node=event.target,value=node.checked;flushSync(()=>setChecked(value));node.checked=value;node.dispatchEvent(new Event('change',{bubbles:true}));syncMaterialFields(document.body);}});
 if(standalone)return control;
 return h(FormControlLabel,{...labelProps,control,label:h(Box,{component:'span'},...label)});
}
// Preserve native field IDs, values and command events. MUI owns the visible
// input/range and its focus/state layer; no second editable proxy is introduced.
function NativeInput({input}){
 const [disabled,setDisabled]=useState(Boolean(input.disabled));
 const ref=useCallback(node=>{if(node)fields.set(node,()=>setDisabled(node.disabled));},[]);
 const {style,className,defaultValue,...attrs}=input;
 return h(InputBase,{className:'ui-native-input-root',disabled,defaultValue,disableInjectingGlobalStyles:true,
  inputProps:{...attrs,style,className,ref,'data-mui-field':'text'}});
}
function NativeRange({input}){
 const initial={value:Number(input.defaultValue??50),min:Number(input.min??0),max:Number(input.max??100),step:input.step==='any'?null:Number(input.step??1),disabled:Boolean(input.disabled)};
 const [value,setValue]=useState(initial),nativeRef=useRef(null);
 const ref=useCallback(node=>{nativeRef.current=node;if(!node)return;fields.set(node,()=>{const next={value:Number(node.value),min:Number(node.min||0),max:Number(node.max||100),step:node.step==='any'?null:Number(node.step||1),disabled:node.disabled};setValue(old=>Object.keys(next).every(key=>old[key]===next[key])?old:next);});},[]);
 const {defaultValue,type,style,className,...attrs}=input;
 const update=(event,next)=>{setValue(old=>({...old,value:next}));const node=nativeRef.current;if(node){node.value=String(next);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));}};
 return h(Slider,{...value,className:'ui-native-slider '+(className||''),style,
  'aria-label':input['aria-label']||input.title,slotProps:{input:{...attrs,ref,'data-mui-field':'range'}},onChange:update});
}
function NativeProgress({input}){
 const [value,setValue]=useState(input.value===undefined?null:Number(input.value));
 const ref=useCallback(node=>{if(node)Object.defineProperty(node,'value',{configurable:true,get:()=>value,set:next=>setValue(Number(next))});},[value]);
 const {value:ignored,max,...props}=input;
 return h(LinearProgress,{...props,ref,variant:value===null?'indeterminate':'determinate',value:value===null?undefined:Math.max(0,Math.min(100,value/Number(max||1)*100))});
}
// Shared disclosure adapter: actual MUI Accordion/Summary/Details and Collapse.
// Keep a small `open` compatibility accessor for imperative game controllers.
function NativeAccordion({props,summary,content}){
 const [expanded,setExpanded]=useState(Boolean(props.open)),id=React.useId(),native=useRef(null);
 const update=value=>{const next=Boolean(value);if(native.current?.open===next)return;flushSync(()=>setExpanded(next));native.current?.dispatchEvent(new Event('toggle'));};
 const ref=useCallback(node=>{native.current=node;if(node)Object.defineProperty(node,'open',{configurable:true,get:()=>node.dataset.expanded==='true',set:update});},[]);
 const {open,...attrs}=props;
 return h(Accordion,{...attrs,ref,expanded,'data-ui-accordion':'','data-expanded':String(expanded),onChange:(_,value)=>update(value)},
  h(AccordionSummary,{...propsFor(summary),id:summary.id||id+'-summary','aria-controls':id+'-content','data-ui-accordion-summary':'', 'data-mui-component':'AccordionSummary',expandIcon:h(SvgIcon,{'aria-hidden':true},h('path',{d:'M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z'}))},h(Box,{component:'span','data-ui-accordion-label':''},...[...summary.childNodes].map(element))),
  h(AccordionDetails,{'data-ui-accordion-content':''},...content.map(element)));
}
function element(node,index){if(node.nodeType===3)return node.textContent;if(node.nodeType!==1)return null;const props=propsFor(node);props.key=props.id||Object.entries(props).find(([key])=>key.startsWith('data-')&&!key.startsWith('data-ui-'))?.join(':')||index;
 if(node.tagName==='DETAILS'){const summary=node.querySelector(':scope>summary');return h(NativeAccordion,{key:props.key,props,summary,content:[...node.childNodes].filter(child=>child!==summary)});}
 const choice=node.tagName==='LABEL'&&node.querySelector(':scope>input[type=radio],:scope>input[type=checkbox]');if(choice)return h(ChoiceField,{key:props.key,input:propsFor(choice),labelProps:props,label:[...node.childNodes].filter(child=>child!==choice).map(element)});
 const children=[...node.childNodes].map(element);if(node.tagName==='BUTTON'){const initiallyDisabled=Boolean(props.disabled);delete props.disabled;props.ref=button=>{if(button){button.disabled=initiallyDisabled;button.classList.toggle('Mui-disabled',initiallyDisabled);}};const endTurn=node.dataset.ui==='endturn'&&matchMedia('(orientation:landscape) and (max-height:400px)').matches;if(endTurn){props['aria-label']=node.textContent.replace(/^☀\s*/,'');props.title=props['aria-label'];}const icon=endTurn||/^[✕×✖−+☰]$/u.test(node.textContent.trim())&&!!node.getAttribute('aria-label');props['data-mui-component']=icon?'IconButton':'Button';props.variant=node.classList.contains('primary')||node.dataset.uiVariant==='filled'?'contained':'outlined';if(icon)delete props.variant;const control=h(icon?IconButton:Button,props,...(endTurn?[h(Box,{component:'span','aria-hidden':true},'☀')]:children));return node.matches('[data-exchange-slot]')?h(Tooltip,{key:props.key,title:props['aria-label']||node.textContent.trim(),describeChild:true},control):control;}
 if(node.matches('.map-movement-settings,.battle-view-setting'))return h(Stack,{...props,component:node.localName,spacing:1,useFlexGap:true,className:((props.className||'')+' ui-form-section')},...children);
 if(node.tagName==='HEADER')return h(Toolbar,{...props,component:'header',disableGutters:true,variant:'dense'},...children);
 if(node.tagName==='FOOTER')return h(Stack,{...props,component:'footer',direction:'row',spacing:1,useFlexGap:true},...children);
 if(/^H[1-6]$/.test(node.tagName))return h(Typography,{...props,component:node.localName,variant:node.tagName==='H1'?'h1':node.tagName==='H2'?'h2':'h3'},...children);
 if(node.tagName==='P')return h(Typography,{...props,component:'p',variant:'body2'},...children);
 if(node.tagName==='ARTICLE')return h(Paper,{...props,component:'article',variant:'outlined'},...children);
 if(node.tagName==='INPUT'&&['checkbox','radio'].includes(node.type))return h(ChoiceField,{key:props.key,input:props,labelProps:{className:'ui-standalone-choice'},label:[]});
 if(node.tagName==='TEXTAREA')return h(InputBase,{...props,component:'span',multiline:true,defaultValue:node.textContent,className:'ui-native-input-root',inputProps:{...props,'data-mui-field':'text'}});
 if(node.tagName==='INPUT'&&node.type==='range')return h(NativeRange,{key:props.key,input:props});
 if(node.tagName==='INPUT'&&!['hidden','checkbox','radio','file','submit','button'].includes(node.type))return h(NativeInput,{key:props.key,input:props});
 if(node.tagName==='A')return h(Link,{...props,color:'inherit',underline:'hover'},...children);
 if(node.tagName==='PROGRESS')return h(NativeProgress,{key:props.key,input:props});
 if(node.tagName==='SELECT'){const selected=[...node.options].find(option=>option.selected);if(selected)props.defaultValue=selected.value;}
 if(node.tagName==='OPTION')delete props.selected;
 if(['IMG','INPUT','BR','HR','WBR','SOURCE'].includes(node.tagName))return h(Box,{...props,component:node.localName});
 return h(Box,{...props,component:node.localName},...children);
}
// Render real MUI buttons before a factory attaches its native command handlers.
// The existing bridge and canvas nodes remain owned by their original modules.
export function renderMarkup(root,markup,{stable=false}={}){if(root.tagName==='TEMPLATE'){root.innerHTML=markup;return;}if(['SELECT','OPTION','OPTGROUP'].includes(root.tagName)){root.innerHTML=markup;return;}
 if(!stable)disposeMaterialRoot(root);const template=document.createElement('template');template.innerHTML=markup;render(root,root.matches('.game-menu-body[data-view=settings]')?h(Stack,{spacing:2,useFlexGap:true,className:'ui-form-stack'},...[...template.content.childNodes].map(element)):h(React.Fragment,null,...[...template.content.childNodes].map(element)));}
export function renderMaterialSelect(host,{select,label,options,value,disabled,onChange}){render(host,h(Select,{value,disabled,displayEmpty:true,fullWidth:true,className:'material-select-trigger',inputProps:{'aria-label':label},MenuProps:{container:host.closest('dialog')||document.body,transitionDuration:0},onChange:event=>onChange(event.target.value)},options.map(option=>h(MenuItem,{key:option.value,value:option.value,disabled:option.disabled},option.label))));}
export function disposeMaterialRoot(host,restoreDom=true){const root=roots.get(host);if(root){for(const child of [...roots.keys()])if(child!==host&&host.contains(child))disposeMaterialRoot(child);if(restoreDom)restore(host);root.unmount();roots.delete(host);snapshots.delete(host);}}
export {heroesTheme};

export function createMaterialMenu(host,{anchor,container,role,label,className,onClose}){
 let list=null,open=false;const ref=node=>{if(node)list=node;};
 const update=()=>render(host,h(Menu,{open,'data-ui-menu-open':String(open),anchorEl:anchor,container,className,keepMounted:true,transitionDuration:0,onClose,slotProps:{list:{ref,role,'aria-label':typeof label==='function'?label():label,className:'ui-popup-list'},paper:{className:'ui-material-menu',sx:{minWidth:208,maxWidth:'calc(100vw - 16px)',maxHeight:'min(320px,calc(100dvh - 16px))'}}}}));
 update();return{get list(){return list;},show(){open=true;update();},close(){open=false;update();},dispose(){disposeMaterialRoot(host,false);}};
}

const isolated=new Map();let isolatedObserver;
export function createMaterialElement(tag='div'){
 watch();
 const host=document.createDocumentFragment(),listeners=[],listen=host.addEventListener.bind(host);
 host.addEventListener=(type,handler,options)=>{listeners.push([type,handler,options]);listen(type,handler,options);};
 const react=createRoot(host);
 const component=tag==='button'?Button:tag==='a'?Link:Box;
 flushSync(()=>react.render(h(ThemeProvider,{theme:heroesTheme},h(component,{...(component===Box?{component:tag}:{}),...(tag==='button'?{type:'button',variant:'outlined','data-mui-component':'Button'}:{})}))));
 const node=host.firstElementChild;
 for(const [type,handler,options]of listeners)node.addEventListener(type,handler,options);
 if(tag==='button'){const classes=[...node.classList].join(' ');Object.defineProperty(node,'className',{configurable:true,get:()=>node.getAttribute('class')||'',set:value=>node.setAttribute('class',[classes,String(value)].join(' '))});}
 isolated.set(node,{host,react,connected:false});
 if(!isolatedObserver){isolatedObserver=new MutationObserver(()=>{for(const [node,record]of isolated){if(node.isConnected)record.connected=true;else if(record.connected){record.host.append(node);record.react.unmount();isolated.delete(node);}}});isolatedObserver.observe(document.body,{childList:true,subtree:true});}
 return node;
}

// Imperative factories retain the input node and native command events.
// A connected display:contents host preserves React event delegation.
export function createMaterialField(input={}){
 const host=document.createElement('span');host.className='ui-native-field-host';host.style.display='contents';
 const props={...input};if('value'in props){props.defaultValue=props.value;delete props.value;}
 render(host,['radio','checkbox'].includes(props.type)?h(ChoiceField,{input:props,standalone:true}):h(NativeInput,{input:props}));
 return {element:host,input:host.querySelector('input')};
}
