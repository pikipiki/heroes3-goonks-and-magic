const records=new WeakMap();
// One responsive composition for creature inspection and purchase. The native
// canvas and command owners remain attached while the layout variant changes.
export function useCreatureOverview(panel,{mode}){
 const variant=mode==='recruit'?'purchase':mode==='creature'?'inspect':'';
 panel.classList.toggle('ui-creature-overview',!!variant);
 if(variant!=='inspect')panel.classList.remove('ui-creature-has-upgrades');
 if(variant)panel.dataset.uiCreatureOverview=variant;else delete panel.dataset.uiCreatureOverview;
 let record=records.get(panel);
 if(!record){const root=panel.closest('#mobile-app');const layout=()=>{if(panel.dataset.uiCreatureOverview!=='inspect')return;const narrative=panel.querySelector('.creature-narrative'),description=panel.querySelector('.creature-description'),header=panel.querySelector('.creature-view-head'),metadata=panel.querySelector('.featured-price'),upgrades=panel.querySelector('.creature-upgrades');panel.classList.toggle('ui-creature-has-upgrades',!!upgrades);if(!narrative||!metadata)return;const landscape=root&&root.clientWidth>root.clientHeight;if(description){if(landscape&&header&&description.parentElement!==header)header.append(description);else if(!landscape&&description.parentElement!==narrative)narrative.prepend(description);}const target=landscape?(upgrades?panel.querySelector('.creature-view-head'):panel):narrative;if(target&&metadata.parentElement!==target)target.append(metadata);};record={layout};if(root){record.observer=new ResizeObserver(layout);record.observer.observe(root);}records.set(panel,record);}
 record.layout();
}
