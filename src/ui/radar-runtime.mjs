import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {ThemeProvider} from '@mui/material/styles';
import {RadarChart} from '@mui/x-charts/RadarChart';
import {heroesTheme} from './theme.mjs';
const roots=new WeakMap();
export function renderRadar(host,{series,metrics,height,label}){
 let root=roots.get(host);if(!root){root=createRoot(host);roots.set(host,root);}
 flushSync(()=>root.render(React.createElement(ThemeProvider,{theme:heroesTheme},React.createElement(RadarChart,{series,radar:{metrics,labelFormatter:name=>({'Wood and ore':'Wood / ore','Rare resources':'Rares','Army strength':'Army','Daily income':'Income','Bois et minerai':'Bois / minerai','Ressources rares':'Rares','Puissance des armées':'Armées','Revenus quotidiens':'Revenus'}[name]||name)},height:Math.max(140,height),hideLegend:true,skipAnimation:true,divisions:3,shape:'sharp','aria-label':label,margin:{top:20,bottom:20,left:84,right:84},sx:{color:heroesTheme.palette.text.primary,'& text':{fill:heroesTheme.palette.text.primary,fontFamily:heroesTheme.typography.fontFamily,fontSize:heroesTheme.typography.caption.fontSize},'& .MuiRadarGrid-radial':{stroke:'#8d744c'},'& .MuiRadarGrid-stripe':{fill:'transparent'}}}))));
}
export function disposeRadar(host){const root=roots.get(host);if(root){root.unmount();roots.delete(host);}}
