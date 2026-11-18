// A single gold/bronze icon family, embedded in the UI bundle. No late image
// requests are needed when a town opens or its war-machine offer changes.
const shapes={
 hall:'<path d="M9 40V17h7V9h6v8h4V9h6v8h7v23M9 26h30M18 40V29h12v11M7 40h34"/><path d="M4 17h13M31 17h13M12 10v7M36 10v7"/>',
 armies:'<path d="M6 12l10-4 10 4v14c0 8-10 15-10 15S6 34 6 26V12zM23 16l9-4 10 4v13c0 7-10 13-10 13l-7-6"/><path d="M16 13v23M10 22h12M32 17v20M28 25h10"/>',
 build:'<path d="M11 37l17-21M24 10l8-6 12 10-7 8-13-12zM8 32l8 7-6 6-8-7zM7 5l9 7-3 5-8-6M16 20l19 22 7-6-19-20"/>',
 heroes:'<path d="M8 41h32l-4-10-8-4M17 28l-6 6-3 7M17 28V14c0-9 18-11 20-1l3 9h-7v9l-9-2M15 15h20M23 16v9M27 7l-4-5"/><path d="M11 41v-5l9-5 4 10M36 35l-7 6"/>',
 market:'<path d="M24 5v36M10 41h28M8 13h32M13 13L5 28h16l-8-15M35 13l-8 15h16l-8-15M5 28c0 8 16 8 16 0M27 28c0 8 16 8 16 0"/><circle cx="24" cy="9" r="4"/>',
 guild:'<path d="M24 15c-7-6-15-5-20-3v27c7-3 14-2 20 3 6-5 13-6 20-3V12c-5-2-13-3-20 3v27M8 18l10 2M8 25l10 2M8 32l10 2M30 20l10-2M30 27l10-2M30 34l10-2"/><path d="M24 3l2 4 4 1-4 2-2 4-2-4-4-2 4-1z"/>',
 ballista:'<path d="M6 19c10-14 26-14 36 0M6 19l18 9 18-9M24 7v25M20 11l4-6 4 6M14 35h22M13 35l-4 8M35 35l4 8M16 28l-3 7M32 28l3 7"/><circle cx="15" cy="39" r="5"/><circle cx="34" cy="39" r="5"/>',
 ammo:'<path d="M8 20h32v20H8zM8 25h32M15 20v20M33 20v20M18 20V5M15 9l3-5 3 5M25 20V7M22 11l3-5 3 5M32 20V5M29 9l3-5 3 5"/><circle cx="13" cy="42" r="3"/><circle cx="35" cy="42" r="3"/>',
 tent:'<path d="M4 40L24 8l20 32H4zM24 8v32M14 40l10-18 10 18M24 8V2h10l-3 4 3 4H24"/><path d="M7 40v4M41 40v4"/>',
};
const urls=Object.fromEntries(Object.entries(shapes).map(([key,shape])=>[key,'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff1b2"/><stop offset=".5" stop-color="#d2a54b"/><stop offset="1" stop-color="#f7d780"/></linearGradient></defs><g fill="#4a3018" stroke="url(#gold)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+shape+'</g></svg>')]));
export function townActionIcon(key){return urls[key]||urls.hall;}
export function townWarMachineIcon(machine){const key=String(machine?.key||'').toLowerCase();return townActionIcon(/ammo|cart/.test(key)?'ammo':/tent|firstaid|first-aid/.test(key)?'tent':'ballista');}
let warmed;
export function warmTownActionIcons(){return warmed??=Promise.all(Object.values(urls).map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>image.decode?image.decode().then(resolve,resolve):resolve();image.onerror=resolve;image.src=src;})));}
