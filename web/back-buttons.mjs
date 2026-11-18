import {installScreenComponents,refreshScreenComponents} from './ui/components.mjs';
export const normalizeReturnControls=refreshScreenComponents;
export function standardizeBackButtons(scope=document.body){const components=installScreenComponents(scope);return()=>components.dispose();}
