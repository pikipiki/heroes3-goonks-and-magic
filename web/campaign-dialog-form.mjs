import {plainGameText} from './game-text.mjs';
import {getLanguage} from './i18n.mjs';
export function campaignDialogDraft(model){return{queryId:model.queryId,selection:model.draft?.selection??model.selection??model.initial??model.choices?.[0]?.value??0,text:model.draft?.text||''};}
export function renderCampaignDialogForm(model,draft,{confirm,icons,onDraft=()=>{}}){
 const form=document.createElement('form');form.className='campaign-dialog-form';form.dataset.kind=model.kind;
 form.addEventListener('submit',event=>{event.preventDefault();confirm();});
 if(model.inputLabel){
  const label=document.createElement('label'),caption=document.createElement('span'),input=document.createElement('input');
  caption.textContent=plainGameText(model.inputLabel);input.type='text';input.dataset.campaignInput='';input.autocomplete='off';input.autocapitalize='none';input.setAttribute('autocorrect','off');input.enterKeyHint='done';input.spellcheck=false;input.maxLength=511;input.value=draft.text;
  input.addEventListener('input',()=>{draft.text=input.value;onDraft({...draft});});label.append(caption,input);form.append(label);
 }
 const pictures=document.createElement('div');pictures.className='campaign-dialog-pictures';
 for(const [index,picture]of (model.pictures||[]).entries())if(picture.rect&&(model.kind!=='pictures'||index>=model.choices.length)){
  const frame=document.createElement('figure'),canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;canvas.setAttribute('aria-label',picture.hint||picture.label||'');frame.append(canvas);pictures.append(frame);icons.push({canvas,rect:picture.rect});
 }
 if(pictures.childElementCount)form.append(pictures);
 if(model.choices?.length){
  const fieldset=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=plainGameText(model.choiceLabel)||(getLanguage()==='fr'?'Choix':'Choices');fieldset.append(legend);
  const multiple=model.kind==='checklist'&&model.multiple;
  for(const [index,choice]of model.choices.entries()){
   const label=document.createElement('label'),input=document.createElement('input'),copy=document.createElement('span'),title=document.createElement('strong');
   input.type=multiple?'checkbox':'radio';input.name='campaign-choice-'+model.queryId;input.value=String(choice.value);input.dataset.campaignChoice=String(choice.value);
   input.checked=multiple?(draft.selection&choice.value)!==0:draft.selection===choice.value;title.textContent=plainGameText(choice.label);copy.append(title);
   if(choice.hint){const hint=document.createElement('small');hint.textContent=plainGameText(choice.hint);copy.append(hint);}
   input.addEventListener('change',()=>{draft.selection=multiple?(input.checked?draft.selection|choice.value:draft.selection&~choice.value):choice.value;onDraft({...draft});});
   label.append(input,copy);
   if(model.kind==='pictures'&&model.pictures?.[index]?.rect){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;canvas.setAttribute('aria-hidden','true');label.append(canvas);icons.push({canvas,rect:model.pictures[index].rect});}
   fieldset.append(label);
  }
  form.append(fieldset);
 }
 return form;
}
function sendCampaignAnswer({queryId,selection,text},module,target){
 if(!module?.[target]||!Number.isInteger(queryId)||queryId<0||queryId>2147483647||!Number.isInteger(selection)||selection<-2147483648||selection>2147483647||(typeof text!=='string'||text.includes('\0')))return false;
 const bytes=new TextEncoder().encode(text||'');if(bytes.length>2048)return false;
 const pointer=module._malloc(bytes.length+1);if(!pointer)return false;
 try{module.HEAPU8.set(bytes,pointer);module.HEAPU8[pointer+bytes.length]=0;module[target](queryId,selection,pointer);return true;}
 finally{module._free(pointer);}
}

export function sendCampaignDialogReply(answer,module=window.Module){return sendCampaignAnswer(answer,module,'_vcmiMobileCampaignReply');}
export function sendCampaignDialogDraft(answer,module=window.Module){return sendCampaignAnswer(answer,module,'_vcmiMobileCampaignDraft');}
