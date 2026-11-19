// Embedded, decoded once while the lobby opens. Radio remains the actual MUI
// control; these Heroes-style gems add the familiar difficulty cue to its label.
const icons=Array.from({length:5},(_,index)=>{
 const count=index+1,width=count*14+4;
 const gems=Array.from({length:count},(_,i)=>`<path d="M${i*14+2} 10l6-8 6 8-6 8z"/>`).join('');
 return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 20"><defs><linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff2b3"/><stop offset="1" stop-color="#c3943e"/></linearGradient></defs><g fill="url(#gold)" stroke="#a47832" stroke-width="1">${gems}</g></svg>`);
});
export const difficultyIcon=level=>icons[Math.max(0,Math.min(4,Number(level)||0))];
let warmed;
export const warmSetupChoiceIcons=()=>warmed??=Promise.all(icons.map(src=>{const image=new Image();image.src=src;return image.decode().catch(()=>{});}));
