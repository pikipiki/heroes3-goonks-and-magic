import React,{createElement as h,forwardRef,useCallback,useLayoutEffect,useRef,useState} from 'react';
import Select from '@mui/material/Select';
// One policy for React screens and native adapters: menus grow upward by default, and long
// lists scroll inside the actual space above the trigger rather than flipping.
const UpwardSelect=forwardRef(function UpwardSelect({menuDirection='up',MenuProps={},onOpen,onClose,open:controlledOpen,...props},ref){
 const down=menuDirection==='down';
 const trigger=useRef(null),[localOpen,setLocalOpen]=useState(false),[available,setAvailable]=useState(1),open=controlledOpen??localOpen;
 const measure=useCallback(()=>{const box=trigger.current?.getBoundingClientRect();setAvailable(Math.max(1,down?window.innerHeight-(box?.bottom??window.innerHeight)-12:(box?.top??8)-12));},[down]);
 const setRef=useCallback(node=>{trigger.current=node;if(typeof ref==='function')ref(node);else if(ref)ref.current=node;},[ref]);
 useLayoutEffect(()=>{if(!open)return;measure();window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure);},[open,measure]);
 const paper=MenuProps.slotProps?.paper;
 const constrain=(value={})=>({...value,'data-ui-select-direction':down?'down':'up',style:{...value.style,maxHeight:available,marginTop:down?4:-4}});
 return h(Select,{...props,ref:setRef,open,onOpen:event=>{measure();setLocalOpen(true);onOpen?.(event);},onClose:event=>{setLocalOpen(false);onClose?.(event);},
  MenuProps:{...MenuProps,transitionDuration:0,variant:'menu',marginThreshold:8,anchorOrigin:{vertical:down?'bottom':'top',horizontal:'left'},transformOrigin:{vertical:down?'top':'bottom',horizontal:'left'},slotProps:{...MenuProps.slotProps,paper:typeof paper==='function'?state=>constrain(paper(state)):constrain(paper)}}});
});
export default UpwardSelect;
