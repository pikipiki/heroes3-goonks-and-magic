// MUI-backed rendering extends the stable native UI contract. Keep the
// original facade intact for WoG adapters with recorded source contracts.
export * from './components.mjs';
export {useKingdomChrome} from './kingdom-chrome.mjs';
export {renderMarkup,restoreMovedActions} from './render.mjs';
export {setClickHandler} from './controls.mjs';

export {createMaterialElement as createUIElement} from './mui-runtime.mjs';
export {createMaterialField as createUIField} from './mui-runtime.mjs';
export {requestMaterialConfirmation,requestMaterialNotice} from './mui-runtime.mjs';

export {createAccordion} from './accordion.mjs';

export {usePurchaseContext} from './purchase-context.mjs';

export {useRadarChart} from './radar-chart.mjs';

export {useBattleControls} from './battle-controls.mjs';

export {useCreatureOverview} from './creature-overview.mjs';

export {createCommanderSkillIcon,commanderSkillArt,commanderChoiceMarkup} from './commander-skill.mjs';

export {ratingMarkup,chipMarkup,creatureStatsMarkup} from './data-display.mjs';
