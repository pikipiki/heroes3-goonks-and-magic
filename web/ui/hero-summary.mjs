// Compose the same native summary in both orientations without duplicate menus.
export function useHeroSummary(root,header){
 const stats=root.querySelector('.hero-primary');if(!header||!stats)return;
 const viewport=root.closest('#mobile-viewport')||root,portrait=viewport.clientHeight>=viewport.clientWidth;
 header.classList.toggle('ui-hero-summary',portrait);
 if(portrait){if(stats.parentElement!==header)header.append(stats);}
 else if(stats.parentElement!==root)root.insertBefore(stats,header.nextSibling);
}
