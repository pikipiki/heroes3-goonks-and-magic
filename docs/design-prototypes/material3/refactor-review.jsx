import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider,Box,Stack,Typography,FormControl,InputLabel,Select,MenuItem,Alert} from '../../../src/ui/components.mjs';
import {heroesReferenceTheme,HeroesPanel} from '../../../src/ui/heroes-kit.mjs';
import '../../../src/ui/heroes-kit.css';
function Review(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[screen,setScreen]=useState('fort'),[size,setSize]=useState('360x640');
 useEffect(()=>{fetch('./ui-regression/manifest.json').then(r=>{if(!r.ok)throw Error('Captures indisponibles');return r.json();}).then(setData).catch(e=>setError(e.message));},[]);
 const sample=data?.samples.find(s=>s.screen===screen&&s.width+'x'+s.height===size);
 return <Box className="hk-root" sx={{p:2}}><Stack sx={{gap:2,maxWidth:1200,mx:'auto'}}>
  <Typography variant="h1">Refacto UI · comparaison native avant/après</Typography>
  <Typography variant="body2">Référence : avant le système de composants ({data?.reference?.slice(0,8)||'7e7633ea'}). Même moteur et mêmes formats ; les images animées peuvent montrer des poses différentes.</Typography>
  {error&&<Alert severity="error">{error}</Alert>}
  {data&&<Stack sx={{gap:2,flexDirection:{xs:'column',sm:'row'}}}>
   <FormControl sx={{minWidth:240}}><InputLabel id="review-screen">Écran</InputLabel><Select labelId="review-screen" label="Écran" value={screen} onChange={e=>setScreen(e.target.value)}>{data.screens.map(s=><MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}</Select></FormControl>
   <FormControl sx={{minWidth:240}}><InputLabel id="review-size">Format natif</InputLabel><Select labelId="review-size" label="Format natif" value={size} onChange={e=>setSize(e.target.value)}>{data.sizes.map(s=><MenuItem key={s} value={s}>{s.replace('x',' × ')}</MenuItem>)}</Select></FormControl>
  </Stack>}
  {sample&&<>
   <Alert severity={sample.shrunkenSubjects.length?'warning':'success'}>{sample.shrunkenSubjects.length?'Une zone de personnage demande une vérification.':'Taille des personnages conservée : aucune réduction supérieure à 2 pixels.'}</Alert>
   <Box sx={{display:'grid',gridTemplateColumns:{xs:'minmax(0,1fr)',md:'repeat(2,minmax(0,1fr))'},gap:2}}>{[['before','Avant les composants'],['after','Après refacto MUI']].map(([key,label])=><HeroesPanel key={key} title={label}><Box component="img" src={'./ui-regression/'+sample[key]} alt={label+' · '+sample.label+' · '+size} sx={{display:'block',width:sample.width,maxWidth:'100%',height:'auto',mx:'auto'}}/><Typography variant="caption">Capture réelle · {sample.width} × {sample.height}</Typography></HeroesPanel>)}</Box>
  </>}
 </Stack></Box>;
}
createRoot(document.getElementById('review')).render(<ThemeProvider theme={heroesReferenceTheme}><Review/></ThemeProvider>);
