import React,{createElement as h,forwardRef,useCallback,useLayoutEffect,useRef,useState} from 'react';
import Select from '@mui/material/Select';
// Shared adaptive policy: open below by default, or above near the bottom.
// Long lists scroll within the available space without covering the trigger.
const UpwardSelect=forwardRef(function UpwardSelect({menuDirection='auto',MenuProps={},onOpen,onClose,open:controlledOpen,...props},ref){
 const [down,setDown]=useState(menuDirection!=='up');
 const trigger=useRef(null),[localOpen,setLocalOpen]=useState(false),[available,setAvailable]=useState(1),open=controlledOpen??localOpen;
 const measure=useCallback(()=>{const box=trigger.current?.getBoundingClientRect();const above=Math.max(1,(box?.top??8)-12),below=Math.max(1,window.innerHeight-(box?.bottom??window.innerHeight)-12);const count=React.Children.count(props.children),desired=Math.min(160,count*48+16);const next=menuDirection==='down'||menuDirection!=='up'&&(below>=desired||below>=above);setDown(next);setAvailable(next?below:above);},[menuDirection,props.children]);
 const setRef=useCallback(node=>{trigger.current=node;if(typeof ref==='function')ref(node);else if(ref)ref.current=node;},[ref]);
 useLayoutEffect(()=>{if(!open)return;measure();window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure);},[open,measure]);
 const paper=MenuProps.slotProps?.paper;
 const constrain=(value={})=>({...value,'data-ui-select-direction':down?'down':'up',style:{...value.style,maxHeight:available,marginTop:down?4:-4}});
 return h(Select,{...props,ref:setRef,open,onOpen:event=>{measure();setLocalOpen(true);onOpen?.(event);},onClose:event=>{setLocalOpen(false);onClose?.(event);},
  MenuProps:{...MenuProps,transitionDuration:0,variant:'menu',marginThreshold:8,anchorOrigin:{vertical:down?'bottom':'top',horizontal:'left'},transformOrigin:{vertical:down?'top':'bottom',horizontal:'left'},slotProps:{...MenuProps.slotProps,paper:typeof paper==='function'?state=>constrain(paper(state)):constrain(paper)}}});
});
export default UpwardSelect;
