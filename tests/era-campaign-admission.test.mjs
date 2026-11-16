import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCampaignAdmission} from '../scripts/era-bridge/campaigns/admission.mjs';
const compiled={scenarios:[{program:{sha256:'a'}},{program:{sha256:'b'}}]},campaign={sha256:'archive'};
const receipt={schemaVersion:1,id:'zc1',sourceArchiveSha256:'archive',originalScriptsUnchanged:true,questFlagsUnmodified:true,engineSha256:'a'.repeat(64),nativeCompletion:{won:true,campaign:true,completedScenarios:2},scenarios:[{id:'zc1-0',programSha256:'a',nativeVictory:true},{id:'zc1-1',programSha256:'b',nativeVictory:true}],transfers:[{from:'zc1-1',to:'zc1-0',native:true}]};
test('campaign admission requires original archive, every native victory and transfers',()=>{
 assert.equal(validateCampaignAdmission('zc1',campaign,compiled,null),false);
 assert.equal(validateCampaignAdmission('zc1',campaign,compiled,receipt),true);
 for(const change of [{sourceArchiveSha256:'modified'},{questFlagsUnmodified:false},{scenarios:receipt.scenarios.slice(1)},{transfers:[]},{nativeCompletion:{won:true,campaign:true,completedScenarios:1}}])assert.throws(()=>validateCampaignAdmission('zc1',campaign,compiled,{...receipt,...change}));
});
