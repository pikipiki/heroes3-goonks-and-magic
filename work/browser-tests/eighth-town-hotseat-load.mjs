/** Existing classic Load->Multiplayer->Hotseat, with two private test names. */
import fs from 'node:fs';import assert from 'node:assert/strict';import {readEraArchive} from '../../scripts/era-bridge/resources.mjs';
export async function openEighthTownHotseatLoad(page){
 const archive=readEraArchive(fs.readFileSync('work/game-data/homm3eng/home/web_user/.local/share/vcmi/Data/H3bitmap.lod'));
 const dimensions=name=>{const b=archive.extract(name);return{w:b.readUInt32LE(4),h:b.readUInt32LE(8)};},multi=dimensions('MUPOPUP.PCX'),names=dimensions('MUHOTSEA.PCX');assert.deepEqual(multi,{w:454,h:490});assert.deepEqual(names,{w:363,h:407});
 const click=async(x,y)=>{await page.evaluate(({x,y})=>Module._vcmiMobilePointer(x,y,1),{x,y});await page.waitForTimeout(200);};
 // Coordinates are from config/mainmenu.json and CMultiMode/CMultiPlayers;
 // native windows remain800x600 regardless of the responsive DOM viewport.
 await click(645,192);await click(649,180);
 await click((800-multi.w)/2+373+20,(600-multi.h)/2+78+15);
 await click((800-names.w)/2+95+20,(600-names.h)/2+338+15);
}
