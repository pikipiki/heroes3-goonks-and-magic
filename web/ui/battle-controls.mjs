import {useActionDock} from './action-dock.mjs';
import {uiText} from './primitives.mjs';
// Commands keep their original native handlers. Secondary actions share the
// same MUI overflow menu as other compact action docks.
export function useBattleControls(root){
 if(root.dataset.mode!=='battle')return;
 const nav=root.querySelector('.mobile-nav'),team=root.querySelector('.battle-team-actions');
 if(nav&&!nav.querySelector('.target-picker-head'))useActionDock(nav,{overflow:true,limit:3,keepButtons:buttons=>buttons.filter(button=>['battle-action','battle-magic','target','end-tactics'].includes(button.dataset.ui)),moreLabel:uiText('More','Plus')});
 if(team)useActionDock(team,{overflow:true,limit:1,keepButtons:buttons=>buttons.filter(button=>button.dataset.ui==='battle-auto'),moreLabel:'⋮'});
}
