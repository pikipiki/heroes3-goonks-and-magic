// Test-only inspection. Never imported by the public application.
export async function inspectMaterialPage(page,evaluate=page.evaluate.bind(page)){
 return evaluate(()=>{
  if(document.documentElement.dataset.uiComparisonPhase==='before'||document.querySelector('link[href$="wog-options-before.css"]'))return {screen:'baseline',baseline:true,failures:[]};
  const modal=[...document.querySelectorAll('.MuiModal-root')].filter(node=>getComputedStyle(node).visibility!=='hidden'&&getComputedStyle(node).display!=='none').at(-1)||document.querySelector('dialog:modal');const visible=node=>{if(modal&&!modal.contains(node))return false;const r=node.getBoundingClientRect(),s=getComputedStyle(node);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&!node.closest('[hidden],[inert],[aria-hidden=true]');};
  const roots=[...document.querySelectorAll('[data-ui-screen],#storage-manager,#spinner,.session-recovery,.campaign-media-viewer')].filter(visible),failures=[];
  const screen=roots.map(node=>[node.dataset.uiScreen||node.id||node.className,node.dataset.kind||node.dataset.page||node.dataset.inventory||node.dataset.onlineView||''].filter(Boolean).join(':')).join('|')||document.querySelector('#mobile-app')?.dataset.mode||'unknown';
  const identify=node=>node.id?'#'+node.id:node.tagName.toLowerCase()+[...node.attributes].filter(a=>a.name.startsWith('data-')&&!a.name.startsWith('data-ui-')).map(a=>'['+a.name+'='+JSON.stringify(a.value)+']').join('');
  const add=(node,rule,detail)=>failures.push({screen,rule,target:identify(node),text:(node.innerText||node.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,90),detail});
  const hitTargets=[];
  for(const node of document.querySelectorAll('button,input,select,textarea,summary,a.storage-return')){
   if(!visible(node)||node.type==='hidden'||node.matches('.material-select-source'))continue;
   const target=node.matches('[type=checkbox],[type=radio]')?node.closest('label')||node:node,r=target.getBoundingClientRect();
   if(r.width<47.9||r.height<47.9)add(node,'target-48',{width:+r.width.toFixed(1),height:+r.height.toFixed(1)});
   if(node.closest('.ui-action-dock,.ui-screen-header')&&!node.closest('.ui-popup,.ui-popup-list,.MuiModal-root')&&(r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5))add(node,'fixed-action-bounds',{x:r.x,y:r.y,width:r.width,height:r.height});
   let exposed=r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;for(let parent=target.parentElement;parent&&exposed;parent=parent.parentElement){const style=getComputedStyle(parent);if(/auto|scroll|hidden|clip/.test(style.overflowX+' '+style.overflowY)){const clip=parent.getBoundingClientRect();if(r.left<clip.left-1||r.right>clip.right+1||r.top<clip.top-1||r.bottom>clip.bottom+1)exposed=false;}}
   if(exposed&&!node.disabled){const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(hit&&hit!==target&&!target.contains(hit))add(node,'control-occluded',{by:identify(hit),width:r.width,height:r.height});hitTargets.push({node:target,r});}
   const s=getComputedStyle(node);if(s.transitionProperty.split(',').some(p=>p.trim()==='all')&&s.transitionDuration.split(',').some(value=>parseFloat(value)>0))add(node,'layout-transition',s.transitionProperty);
   if(node.tagName==='BUTTON'){const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text,overflow=false;while(text=walker.nextNode()){if(text.parentElement.closest('.ui-visually-hidden')||getComputedStyle(text.parentElement).clipPath!=='none')continue;for(const match of text.textContent.matchAll(/\S+/g)){const range=document.createRange();range.setStart(text,match.index);range.setEnd(text,match.index+match[0].length);for(const part of range.getClientRects())if(part.width>0&&(part.left<r.left-1||part.right>r.right+1))overflow=true;}}if(overflow)add(node,'control-text-overflow',{width:node.clientWidth,scrollWidth:node.scrollWidth});}
  }
  for(let a=0;a<hitTargets.length;a++)for(let b=a+1;b<hitTargets.length;b++){const x=hitTargets[a],y=hitTargets[b];if(x.node===y.node||x.node.contains(y.node)||y.node.contains(x.node))continue;const width=Math.min(x.r.right,y.r.right)-Math.max(x.r.left,y.r.left),height=Math.min(x.r.bottom,y.r.bottom)-Math.max(x.r.top,y.r.top);if(width>2&&height>2)add(x.node,'controls-overlap',{with:identify(y.node),width:+width.toFixed(1),height:+height.toFixed(1)});}
  for(const node of document.querySelectorAll('.ui-screen-header,.ui-action-dock,.ui-button,.ui-tab,.setting-toggle,.lobby-panel-body,.hero-bag-tabs')){
   if(!visible(node))continue;const s=getComputedStyle(node);
   for(const property of ['paddingTop','paddingRight','paddingBottom','paddingLeft','rowGap','columnGap']){const value=parseFloat(s[property]);if(Number.isFinite(value)&&value>0&&Math.abs(value/4-Math.round(value/4))>.01)add(node,'spacing-4',{property,value});}
  }
  for(const node of document.querySelectorAll('.ui-screen-header :is(h1,h2),.ui-button,.ui-tab,.guild-profile :is(p,strong)'))if(visible(node)){const s=getComputedStyle(node);if(s.overflowWrap==='anywhere'||s.wordBreak==='break-all'||s.hyphens==='auto')add(node,'whole-words',{overflowWrap:s.overflowWrap,wordBreak:s.wordBreak,hyphens:s.hyphens});}
  return{screen,viewport:{width:innerWidth,height:innerHeight},language:document.documentElement.lang||navigator.language,failures};
 });
}
