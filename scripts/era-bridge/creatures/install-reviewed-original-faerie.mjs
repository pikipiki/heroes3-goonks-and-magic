import fs from 'node:fs';import path from 'node:path';
import {reviewedOriginalFaerie} from './original-faerie.mjs';
const [projectArg,reviewArg]=process.argv.slice(2);
if(!projectArg||!reviewArg)throw Error('PROJECT NATIVE_REVIEW_JSON');
const policy=reviewedOriginalFaerie(JSON.parse(fs.readFileSync(reviewArg,'utf8')));
const target=path.resolve(projectArg,'mod/tum-era/content/config/era-bridge-original-faerie.json');
fs.writeFileSync(target,JSON.stringify(policy,null,2)+'\n');
console.log('Activated reviewed source134 manual casting contract');
