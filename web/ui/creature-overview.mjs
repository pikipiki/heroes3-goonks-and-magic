const records=new WeakMap();
// One responsive composition for creature inspection and purchase. The native
// canvas and command owners remain attached while the layout variant changes.
export function useCreatureOverview(panel,{mode}){
 const variant=mode==='recruit'?'purchase':mode==='creature'?'inspect':'';
 panel.classList.toggle('ui-creature-overview',!!variant);
 if(variant)panel.dataset.uiCreatureOverview=variant;else delete panel.dataset.uiCreatureOverview;
 let record=records.get(panel);
 if(!record){const root=panel.closest('#mobile-app');const layout=()=>{if(panel.dataset.uiCreatureOverview!=='inspect')return;const narrative=panel.querySelector('.creature-narrative'),metadata=panel.querySelector('.featured-price');if(!narrative||!metadata)return;const target=root&&root.clientWidth>root.clientHeight?panel:narrative;if(metadata.parentElement!==target)target.append(metadata);};record={layout};if(root){record.observer=new ResizeObserver(layout);record.observer.observe(root);}records.set(panel,record);}
 record.layout();
}
