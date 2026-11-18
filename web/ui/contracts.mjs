// Global actions belong to a dock. Tabs, choices, quantities and row-specific
// actions stay with the content they operate on. Each legacy adapter declares
// its actual DOM boundaries; native event handlers continue to own commands.
export const screenContracts=[
 {selector:'#storage-manager',name:'storage',body:'.storage-content',header:':scope>header',dock:':scope>footer'},
 {selector:'.campaign-media-viewer',name:'campaign-media',body:'.campaign-media-scroll',header:':scope>header',close:'[data-close]'},
 {selector:'.session-recovery',name:'session-recovery',body:'.session-recovery-content',header:':scope>header',dock:':scope>footer'},
 {selector:'.mobile-menu:is([data-kind=lobby],[data-kind=load])',name:'adventure-setup',body:'.lobby-scroll',header:'.lobby-intro',dock:'.lobby-footer',close:'[data-ui=back]',liftHeader:true},
 {selector:'.mobile-menu',name:'home',header:':scope>header'},
 {selector:'.mobile-sheet',name:'sheet',header:':scope>.sheet-head',dock:'.army-dock,.building-actions,:scope>.ui-action-dock',return:'[data-ui=sheet-back]',close:'[data-ui=close-sheet]'},
 {selector:'.lobby-picker',name:'scenario-picker',header:':scope>header',dock:':scope>footer',close:'[data-picker-close]',return:'[data-picker-back]'},
 {selector:'#game-menu',name:'game-menu',header:':scope>header',dock:':scope>.game-menu-return',close:'[data-menu=close]',return:'.game-menu-return [data-menu=back]'},
 {selector:'.progression-page',name:'progression',header:':scope>header',dock:':scope>footer',close:'[data-army-upgrade-cancel],[data-progression-cancel],[data-troop-action=back],[data-deployment-cancel],[data-troop-close]'},
 {selector:'.creature-presentation',name:'creature',dockLimit:2,header:':scope>.creature-view-head',dock:'.hall-actions,:scope>footer',close:'[data-presentation-close]',headerActions:'[data-recruit-all]'},
 {selector:'.mobile-spellbook',name:'spellbook',header:':scope>header',dock:':scope>footer',close:'[data-close-book]'},
 {selector:'.mobile-mage-guild',name:'mage-guild',body:'.mage-guild-library',header:':scope>header',dock:':scope>.ui-action-dock',close:'[data-guild-close]',headerActions:'[data-guild-view]'},
 {selector:'.town-service',name:'town-service',header:':scope>header',dock:':scope>footer',close:'[data-service-back]'},
 {selector:'.dialog-presentation[data-kind=commander]',name:'commander',header:':scope>header',dock:':scope>footer',close:'[data-dialog-confirm]',headerActions:'[data-commander-tree]'},
 {selector:'.dialog-presentation',name:'message',requiredChoice:true,header:':scope>header',dock:':scope>footer',close:'[data-dialog-cancel]',headerActions:'[data-commander-tree]'},
 {selector:'.market-page',name:'marketplace',header:':scope>.market-header',dock:'.market-view-actions',close:'[data-market=close]',extraActions:'[data-market=trade]'},
 {selector:'.hero-equipment-page',name:'hero',liftDock:true,header:':scope>.hero-card-head',dock:'.hero-army-dock-tools,.hero-artifact-actions',close:'[data-hero-close]'},
 {selector:'.hero-exchange-page',name:'hero-exchange',header:':scope>.exchange-toolbar',dock:'.exchange-actions',close:'[data-exchange-close]'},
 {selector:'.online-login',name:'online-login',header:'form>header',dock:'form>.ui-action-dock',close:'[data-close]',extraActions:'form>[type=submit]'},
 {selector:'.online-lobby',name:'online-lobby',dockLimit:1,body:'.online-lobby-body',header:':scope>header',dock:':scope>.online-lobby-actions',close:'[data-room-action=back]',headerActions:'[data-room-action=classic]'},
 {selector:'.campaign-setup',name:'campaign',body:'.campaign-body,.campaign-interlude',header:':scope>header',dock:':scope>footer',close:'[data-campaign-back]'},
 {selector:'.mobile-tavern',name:'tavern',body:'.tavern-heroes',status:'.tavern-status',header:':scope>.tavern-header',dock:':scope>.tavern-extras',close:'[data-tavern-close]'},
 {selector:'.battle-result',name:'battle-result',body:'.result-content',header:':scope>header',dock:':scope>.ui-action-dock',extraActions:':scope>[data-result-confirm]'},
 {selector:'.mithril-panel',name:'mithril',header:':scope>header',dock:':scope>.ui-action-dock',close:'[data-mithril-close]'},
 {selector:'.cave-builder>section',name:'cave-builder',header:':scope>header',dock:':scope>footer',close:'[data-builder-close]'},
 {selector:'dialog:not(.lobby-picker):not(#game-menu)',name:'dialog',header:':scope>header',dock:':scope>footer',close:'[data-close],[data-back],[data-cancel]'}
];
export const screenSelector=screenContracts.map(contract=>contract.selector).join(',');
export const screenContract=element=>screenContracts.find(contract=>element.matches(contract.selector));
