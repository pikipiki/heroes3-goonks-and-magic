/** Pinned original calculation only. This does not admit the Advanced Classes pack. */
import {createHash} from 'node:crypto';
import {compileErm} from '../campaigns/parser.mjs';
export const advancedClassPointsSource = Object.freeze({
 repository:'https://github.com/ERA-Projects/era-project-eng',
 commit:'233993be3eea4646b5c9f351e74f0bb51101adf6',
 path:'Mods/Advanced Classes Mod/Data/s/advanced classes skills.erm',
 fileSha256:'a4f14fbecacc4b93b60ee49ebd068bd4f120bb0c77a9d14830c357ab3691ca92',
 function:'Calc_Class_Points_Original',
 functionSha256:'1d8fe7d126d5d668c294139e0eef580e947f1f5facc57f72e49902b4f21b38b5',
});
export const advancedClassPointsBindings = Object.freeze({
 Calc_Class_Points_Original:9400,Check_Com_Masteries:9401,Count_Set_Pieces_2:9402,
});
export function compileAdvancedClassPoints(bytes) {
 bytes=Buffer.from(bytes);
 const sha=createHash('sha256').update(bytes).digest('hex');
 if(sha!==advancedClassPointsSource.functionSha256)throw Error('Advanced Classes original calculation identity changed');
 return compileErm(bytes,{source:'Advanced Classes 1.1 / Calc_Class_Points_Original',dialect:'era3',bindings:advancedClassPointsBindings});
}
