import React,{createElement as h,useState,useRef,useCallback,useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {StyledEngineProvider,ThemeProvider} from '@mui/material/styles';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Slider from '@mui/material/Slider';
import Rating from '@mui/material/Rating';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Select from './upward-select.mjs';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Checkbox from '@mui/material/Checkbox';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import Tab from '@mui/material/Tab';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import StepLabel from '@mui/material/StepLabel';
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
const Themed=({children})=>h(StyledEngineProvider,{enableCssLayer:true},h(ThemeProvider,{theme:heroesTheme},children));
function render(root,element){watch();let react=roots.get(root);if(!react){react=createRoot(root);roots.set(root,react);}flushSync(()=>react.render(h(Themed,null,element)));remember(root);}
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
 const empty=!(value.max>value.min),visual={...value,value:empty?value.min:Math.max(value.min,Math.min(value.max,value.value)),max:empty?value.min+1:value.max,disabled:value.disabled||empty};
 return h(Slider,{...visual,className:'ui-native-slider '+(className||''),style,
  'aria-label':input['aria-label']||input.title,slotProps:{input:{...attrs,min:value.min,max:value.max,ref,'data-mui-field':'range','aria-valuemax':value.max}},onChange:update});
}
function NativeProgress({input}){
 const [value,setValue]=useState(input.value===undefined?null:Number(input.value));
 const ref=useCallback(node=>{if(node)Object.defineProperty(node,'value',{configurable:true,get:()=>value,set:next=>setValue(Number(next))});},[value]);
 const {value:ignored,max,...props}=input;
 return h(LinearProgress,{...props,ref,variant:value===null?'indeterminate':'determinate',value:value===null?undefined:Math.max(0,Math.min(100,value/Number(max||1)*100))});
}
const adapterClasses=value=>[...new Set(String(value||'').split(/\s+/).filter(name=>name&&!name.startsWith('Mui')&&!name.startsWith('css-')))].join(' ');
// Legacy adapters decorate buttons after mounting. Keep those classes in the
// React props too: a MUI focus/ripple update must not remove their layout and
// move the touch target between pointerdown and pointerup.
function NativeButton({component:Component,props,children}){
 const [classes,setClasses]=useState(adapterClasses(props.className)),current=useRef(classes),nodeRef=useRef(null),base=useRef(adapterClasses(props.className));
 const ref=useCallback(node=>{nodeRef.current=node;if(!node)return;
  Object.defineProperty(node,'className',{configurable:true,get:()=>node.getAttribute('class')||'',set:value=>{const next=adapterClasses(value);if(next===current.current)return;current.current=next;flushSync(()=>setClasses(next));}});
 },[]);
 useLayoutEffect(()=>{const next=adapterClasses(props.className);if(next!==base.current){const old=new Set(base.current.split(' ')),extras=current.current.split(' ').filter(value=>value&&!old.has(value));base.current=next;const combined=adapterClasses(next+' '+extras.join(' '));current.current=combined;setClasses(combined);}},[props.className]);
 useLayoutEffect(()=>{if(nodeRef.current){nodeRef.current.disabled=!!props.disabled;nodeRef.current.classList.toggle('Mui-disabled',!!props.disabled);}},[props.disabled]);
 const {disabled,...attributes}=props;
 return h(Component,{...attributes,className:classes,ref},...children);
}
// Shared navigation primitives retain native game click commands.
function NativeTabs({props,items}){
 const landscape=useMediaQuery('(orientation: landscape)'),vertical=props['data-ui-tabs-landscape']!==undefined&&landscape;
 const selected=Math.max(0,items.findIndex(item=>item.getAttribute('aria-pressed')==='true'));
 const [value,setValue]=useState(selected);useLayoutEffect(()=>setValue(selected),[selected]);
 return h(Tabs,{...props,component:'nav',value,orientation:vertical?'vertical':'horizontal',variant:vertical?'standard':'fullWidth',onChange:(_,next)=>setValue(next)},items.map((item,index)=>{const native=propsFor(item);return h(Tab,{...native,key:index,value:index,'data-mui-component':'Tab',label:h(Box,{component:'span',className:'ui-tab-label'},...[...item.childNodes].map(element))});}));
}
function NativeStepper({props,items}){
 const active=items.findIndex(item=>item.getAttribute('aria-current')==='step');
 return h(Stepper,{...props,component:'nav',orientation:'vertical',nonLinear:true,activeStep:active},items.map((item,index)=>{
  const button=item.querySelector('button');
  return h(Step,{key:index,completed:item.hasAttribute('data-built'),active:index===active},button?h(StepButton,{...propsFor(button),'data-mui-component':'StepButton'},...[...button.childNodes].map(element)):h(StepLabel,null,item.textContent));
 }));
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
 if(node.hasAttribute('data-ui-rating')){const max=Math.max(1,Math.min(10,Number(node.dataset.max)||5)),value=Math.max(0,Math.min(max,Number(node.dataset.value)||0));return h(Rating,{...props,value,max,readOnly:true,size:'small',icon:h('span',{'aria-hidden':true},'◆'),emptyIcon:h('span',{'aria-hidden':true},'◇')});}
 if(node.hasAttribute('data-ui-chip'))return h(Chip,{...props,label:node.textContent,size:'small',variant:'outlined'});
 if(node.hasAttribute('data-ui-radio-group'))return h(RadioGroup,{...props,component:node.localName},...[...node.childNodes].map(element));
 if(node.tagName==='TABLE')return h(Table,{...props,size:'small'},...[...node.childNodes].map(element));
 if(node.tagName==='THEAD')return h(TableHead,props,...[...node.childNodes].map(element));
 if(node.tagName==='TBODY')return h(TableBody,props,...[...node.childNodes].map(element));
 if(node.tagName==='TR')return h(TableRow,props,...[...node.childNodes].map(element));
 if(['TD','TH'].includes(node.tagName))return h(TableCell,{...props,component:node.localName},...[...node.childNodes].map(element));
 if(node.hasAttribute('data-ui-tabs'))return h(NativeTabs,{key:props.key,props,items:[...node.children].filter(child=>child.tagName==='BUTTON')});
 if(node.hasAttribute('data-ui-stepper'))return h(NativeStepper,{key:props.key,props,items:[...node.children]});
 if(node.tagName==='DETAILS'){const summary=node.querySelector(':scope>summary');return h(NativeAccordion,{key:props.key,props,summary,content:[...node.childNodes].filter(child=>child!==summary)});}
 const choice=node.tagName==='LABEL'&&node.querySelector(':scope>input[type=radio],:scope>input[type=checkbox]');if(choice)return h(ChoiceField,{key:props.key,input:propsFor(choice),labelProps:props,label:[...node.childNodes].filter(child=>child!==choice).map(element)});
 const children=[...node.childNodes].map(element);if(node.tagName==='BUTTON'){const icon=/^[✕×✖−+☰▶■]$/u.test(node.textContent.trim())&&!!node.getAttribute('aria-label');props['data-mui-component']=icon?'IconButton':'Button';props.variant=node.classList.contains('primary')||node.dataset.uiVariant==='filled'?'contained':'outlined';if(icon)delete props.variant;const control=h(NativeButton,{key:props.key,component:icon?IconButton:Button,props,children});return node.matches('[data-exchange-slot]')?h(Tooltip,{key:props.key,title:props['aria-label']||node.textContent.trim(),describeChild:true},control):control;}
 if(node.matches('.ui-form-stack'))return h(Stack,{...props,component:node.localName,spacing:2,useFlexGap:true},...children);
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
export function renderMaterialSelect(host,{select,label,options,value,disabled,direction,onChange}){render(host,h(Select,{menuDirection:direction,value,disabled,displayEmpty:true,fullWidth:true,className:'material-select-trigger',inputProps:{'aria-label':label},onChange:event=>onChange(event.target.value)},options.map(option=>h(MenuItem,{key:option.value,value:option.value,disabled:option.disabled},option.icon?h(Box,{component:'span',className:'ui-select-option',sx:{display:'flex',alignItems:'center',gap:1,minWidth:0}},h(Box,{component:'img',src:option.icon,alt:'',width:20,height:20,sx:{objectFit:'contain',flexShrink:0}}),h('span',null,option.label)):option.label))));}
export function disposeMaterialRoot(host,restoreDom=true){const root=roots.get(host);if(root){for(const child of [...roots.keys()])if(child!==host&&host.contains(child))disposeMaterialRoot(child);if(restoreDom)restore(host);root.unmount();roots.delete(host);snapshots.delete(host);}}
export {heroesTheme};

export function createMaterialMenu(host,{anchor,container,role,label,className,onClose,placement}){
 let list=null,open=false;const ref=node=>{if(node)list=node;};
 const update=()=>{const above=placement==='top-end',position=above?{variant:'menu',anchorOrigin:{vertical:'top',horizontal:'right'},transformOrigin:{vertical:'bottom',horizontal:'right'}}:{};return render(host,h(Menu,{...position,open,'data-ui-menu-open':String(open),anchorEl:anchor,container,className,keepMounted:true,transitionDuration:0,onClose,slotProps:{list:{ref,role,'aria-label':typeof label==='function'?label():label,className:'ui-popup-list'},paper:{className:'ui-material-menu',style:above?{'--ui-menu-available-height':Math.max(48,anchor.getBoundingClientRect().top-16)+'px'}:undefined,sx:{minWidth:208,maxWidth:'calc(100vw - 16px)',maxHeight:'min(320px,calc(100dvh - 16px))'}}}}));};
 update();return{get list(){return list;},show(){open=true;update();},close(){open=false;update();},dispose(){disposeMaterialRoot(host,false);}};
}

// Native factories retain ownership of their exact DOM, canvas and listeners.
// MUI owns the actual Dialog/Modal, backdrop, focus trap, stacking and Fade.
export function createMaterialDialogBoundary(nativeRoot,initialOptions={}){
 let options={...initialOptions},react=null,host=null,anchor=null,open=false,disposed=false,paperHost=null,modalRoot=null;
 const originalAttributes=new Map(),appliedAttributes=new Map(),addedClasses=new Set();
 const originalStyles=new Map(['opacity','visibility','transition'].map(key=>[key,[nativeRoot.style.getPropertyValue(key),nativeRoot.style.getPropertyPriority(key)]]));
 const assignRef=(ref,node)=>{if(typeof ref==='function')ref(node);else if(ref)ref.current=node;};
 const container=()=>options.container||(anchor?.parentElement?.matches('.mobile-play,#mobile-app')?anchor.parentElement:nativeRoot.closest('#mobile-app'))||anchor?.parentElement||nativeRoot.ownerDocument.body;
 const applyAttribute=(key,value)=>{
  if(value===undefined||value===null)return;
  if(!originalAttributes.has(key))originalAttributes.set(key,nativeRoot.getAttribute(key));
  const text=String(value);appliedAttributes.set(key,text);if(nativeRoot.getAttribute(key)!==text)nativeRoot.setAttribute(key,text);
 };
 const restoreNode=(finish=false)=>{
  if(anchor?.parentNode&&nativeRoot.parentNode!==anchor.parentNode)anchor.parentNode.insertBefore(nativeRoot,anchor.nextSibling);
  if(!finish)return;
  for(const name of addedClasses)nativeRoot.classList.remove(name);addedClasses.clear();
  for(const[key,value]of originalAttributes){if(nativeRoot.getAttribute(key)!==appliedAttributes.get(key))continue;if(value===null)nativeRoot.removeAttribute(key);else nativeRoot.setAttribute(key,value);}
  originalAttributes.clear();appliedAttributes.clear();
  for(const[key,[value,priority]]of originalStyles){if(value)nativeRoot.style.setProperty(key,value,priority);else nativeRoot.style.removeProperty(key);}
 };
 const adopt=()=>{if(open&&paperHost&&nativeRoot.parentNode!==paperHost)paperHost.append(nativeRoot);};
 const NativePaper=React.forwardRef(function NativeDialogPaper(props,ref){
  const {children,ownerState,as,elevation,className,role,tabIndex,...other}=props;
  useLayoutEffect(()=>{adopt();return()=>restoreNode(true);},[]);
  useLayoutEffect(()=>{
   adopt();
   // A lower Modal may have aria-hidden the source before it was adopted.
   // The real Modal wrapper now owns isolation; its active paper must be read.
   applyAttribute('aria-hidden','false');
   for(const name of String(className||'').split(/\s+/).filter(Boolean))if(!nativeRoot.classList.contains(name)){nativeRoot.classList.add(name);addedClasses.add(name);}
   applyAttribute('role',role);applyAttribute('tabindex',tabIndex);
   for(const[key,value]of Object.entries(other))if(key.startsWith('aria-')||key.startsWith('data-'))applyAttribute(key,value);
  });
  return h('div',{'data-ui-dialog-paper-host':'',style:{display:'contents'},ref:node=>{paperHost=node;assignRef(ref,node?nativeRoot:null);}});
 });
 const NativeContainer=React.forwardRef(function NativeDialogContainer(props,ref){
  const {children,ownerState,style,onFocus,tabIndex,...other}=props;
  useLayoutEffect(()=>{for(const key of ['opacity','visibility'])if(style?.[key]!==undefined)nativeRoot.style[key]=style[key];});
  useLayoutEffect(()=>{if(!onFocus)return;nativeRoot.addEventListener('focusin',onFocus);return()=>nativeRoot.removeEventListener('focusin',onFocus);},[onFocus]);
  // Adopted children keep their original React owner. Forward Escape into the
  // real Modal event tree, whose manager alone decides which dialog may close.
  useLayoutEffect(()=>{const escape=event=>{if(event.key!=='Escape'||!modalRoot)return;const owner=event.target.closest?.('.MuiModal-root');if(owner&&owner!==modalRoot)return;event.stopPropagation();event.preventDefault();modalRoot.dispatchEvent(new KeyboardEvent('keydown',{key:event.key,code:event.code,bubbles:true,cancelable:true,shiftKey:event.shiftKey,ctrlKey:event.ctrlKey,altKey:event.altKey,metaKey:event.metaKey}));};nativeRoot.addEventListener('keydown',escape,true);return()=>nativeRoot.removeEventListener('keydown',escape,true);},[]);
  return h('div',{...other,style:{display:'contents'},ref:node=>assignRef(ref,node?nativeRoot:null)},children);
 });
 const renderDialog=()=>{
  if(!react)return;
  flushSync(()=>react.render(h(Themed,null,h(Dialog,{
   open,container:container(),
   maxWidth:false,disableScrollLock:true,closeAfterTransition:false,
   'aria-labelledby':options.ariaLabelledby||nativeRoot.getAttribute('aria-labelledby')||undefined,
   'aria-describedby':options.ariaDescribedby||nativeRoot.getAttribute('aria-describedby')||undefined,
   'aria-label':options.ariaLabel||nativeRoot.getAttribute('aria-label')||undefined,
   onClose:(event,reason)=>options.onClose?.(event,reason),
   transitionDuration:options.transitionDuration,
   slots:{paper:NativePaper,container:NativeContainer},
   slotProps:{root:{ref:node=>{modalRoot=node;},style:{position:'absolute',inset:0,pointerEvents:open?'auto':'none'}},paper:{'aria-label':options.ariaLabel},backdrop:{style:{position:'absolute',pointerEvents:open?'auto':'none'}}},
  }))));
 };
 return{
  get anchor(){return anchor;},get dialogRoot(){return modalRoot;},get open(){return open;},
  setOpen(value){
   if(disposed)return;
   const next=Boolean(value);if(next===open)return;
   if(next){
    if(!anchor?.isConnected||nativeRoot.parentNode!==paperHost&&nativeRoot.parentNode!==anchor.parentNode){anchor?.remove();anchor=nativeRoot.ownerDocument.createComment('mui-dialog-anchor');nativeRoot.before(anchor);}
    if(!react){host=nativeRoot.ownerDocument.createElement('div');host.dataset.uiDialogBoundary='';host.style.display='contents';container().append(host);react=createRoot(host);}
   }
   open=next;if(!open)restoreNode();renderDialog();
  },
  update(next={}){options={...options,...next};renderDialog();},
  dispose(){if(disposed)return;disposed=true;open=false;restoreNode();if(react)flushSync(()=>react.unmount());restoreNode(true);host?.remove();anchor?.remove();react=null;host=null;},
 };
}

function requestMaterialPrompt({title,message,confirmLabel,cancelLabel,closeLabel,container:target},confirmation){
 const container=target||document.querySelector('#mobile-app')||document.body;
 const host=document.createElement('div');host.dataset.uiMaterialPrompt='';host.style.display='contents';container.append(host);
 const react=createRoot(host);let open=true,settled=false,value=false;
 return new Promise(resolve=>{
  const close=answer=>{if(settled)return;settled=true;value=answer;open=false;update();};
  const finish=()=>queueMicrotask(()=>{react.unmount();host.remove();resolve(confirmation?value:undefined);});
  const update=()=>flushSync(()=>react.render(h(Themed,null,h(Dialog,{
   open,container,maxWidth:'sm',fullWidth:true,disableScrollLock:true,closeAfterTransition:false,onClose:(event,reason)=>{if(reason==='escapeKeyDown')close(false);},onTransitionExited:finish,
   slotProps:{root:{style:{position:'absolute',inset:0,pointerEvents:open?'auto':'none'}},backdrop:{style:{position:'absolute',pointerEvents:open?'auto':'none'}}},
  },h(DialogTitle,null,title),h(DialogContent,null,h(DialogContentText,{sx:{whiteSpace:'pre-line'}},message)),h(DialogActions,null,
   confirmation?h(Button,{onClick:()=>close(false)},cancelLabel):null,
   h(Button,{variant:'contained',onClick:()=>close(true),autoFocus:true},confirmation?confirmLabel:closeLabel),
  )))));
  update();
 });
}
export function requestMaterialConfirmation(options){return requestMaterialPrompt(options,true);}
export function requestMaterialNotice(options){return requestMaterialPrompt(options,false);}

const isolated=new Map();let isolatedObserver;
export function createMaterialElement(tag='div'){
 watch();
 const host=document.createDocumentFragment(),listeners=[],listen=host.addEventListener.bind(host);
 host.addEventListener=(type,handler,options)=>{listeners.push([type,handler,options]);listen(type,handler,options);};
 const react=createRoot(host);
 const component=tag==='button'?Button:tag==='a'?Link:Box;
 flushSync(()=>react.render(h(Themed,null,h(component,{...(component===Box?{component:tag}:{}),...(tag==='button'?{type:'button',variant:'outlined','data-mui-component':'Button'}:{})}))));
 const node=host.firstElementChild;
 for(const [type,handler,options]of listeners)node.addEventListener(type,handler,options);
 if(tag==='button'){Object.defineProperty(node,'className',{configurable:true,get:()=>node.getAttribute('class')||'',set:value=>{
  const custom=[...new Set(String(value).split(/\s+/).filter(name=>name&&!name.startsWith('Mui')&&!name.startsWith('css-')))];
  const props=propsFor(node);props.className=custom.join(' ');props.variant='outlined';
  // Store adapter classes as actual MUI props. Ripple/focus renders then keep
  // the overflow trigger marker instead of overwriting imperative DOM classes.
  flushSync(()=>react.render(h(Themed,null,h(Button,props))));
 }});}
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
