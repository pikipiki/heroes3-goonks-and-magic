/** Select one exact original bank state in a private complete candidate overlay. */
import {installBank185Candidate} from './bank185-candidate-overlay.mjs';
export async function installBank185State(page,options){return installBank185Candidate(page,{sourceId:options.sourceId,sourceState:options.sourceState});}
