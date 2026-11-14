import {campaignMedia} from './campaign-media-data.mjs';
import {getLanguage} from './i18n.mjs';
let viewer;
export function closeCampaignMediaViewer(){if(viewer){const current=viewer;viewer=null;current.close();current.remove();}}
export function campaignMediaPicture(picture){
 const media=campaignMedia[picture.mediaKey];if(!media)return null;
 const button=document.createElement('button');button.type='button';button.className='campaign-media-thumbnail';
 const image=document.createElement('img');image.src=new URL(media.url,import.meta.url).href;image.width=media.width;image.height=media.height;image.alt=picture.hint||picture.label||'';image.decoding='async';
 button.setAttribute('aria-label',getLanguage()==='fr'?'Agrandir l’image':'Enlarge image');button.append(image);
 button.addEventListener('click',()=>{
  closeCampaignMediaViewer();const dialog=document.createElement('dialog');viewer=dialog;dialog.className='campaign-media-viewer';
  const controls=document.createElement('header'),title=document.createElement('h2'),close=document.createElement('button');
  title.textContent='Illustration';close.type='button';close.textContent=getLanguage()==='fr'?'Fermer':'Close';
  title.id='campaign-media-title';dialog.setAttribute('aria-labelledby',title.id);controls.append(title,close);
  const scroll=document.createElement('div');scroll.className='campaign-media-scroll';scroll.tabIndex=0;
  const full=image.cloneNode();full.decoding='sync';scroll.append(full);dialog.append(controls,scroll);document.body.append(dialog);
  const dismiss=()=>{if(viewer===dialog)viewer=null;dialog.remove();if(button.isConnected)button.focus({preventScroll:true});};
  dialog.addEventListener('close',dismiss,{once:true});close.addEventListener('click',()=>dialog.close());dialog.showModal();close.focus({preventScroll:true});
 });return button;
}
