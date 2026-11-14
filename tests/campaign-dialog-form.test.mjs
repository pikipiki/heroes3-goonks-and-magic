import test from 'node:test';import assert from 'node:assert/strict';
import {sendCampaignDialogReply,sendCampaignDialogDraft,campaignDialogDraft} from '../web/campaign-dialog-form.mjs';
test('text query replies carry the query ID, exact choice and UTF-8 bytes before freeing their buffer',()=>{
 const calls=[],memory=new Uint8Array(4096),module={HEAPU8:memory,_malloc:()=>32,_free:pointer=>calls.push(['free',pointer]),_vcmiMobileCampaignReply:(id,choice,pointer)=>{let end=pointer;while(memory[end])end++;calls.push([id,choice,new TextDecoder().decode(memory.subarray(pointer,end))]);}};
 assert(sendCampaignDialogReply({queryId:17,selection:4,text:'Wake of Gods — été'},module));
 assert.deepEqual(calls,[[17,4,'Wake of Gods — été'],['free',32]]);
 assert(!sendCampaignDialogReply({queryId:NaN,selection:4,text:'x'},module));assert(!sendCampaignDialogReply({queryId:17,selection:NaN,text:'x'},module));
 assert(!sendCampaignDialogReply({queryId:17,selection:4,text:'x'.repeat(2049)},module));assert.equal(calls.length,2);
 assert.deepEqual(campaignDialogDraft({queryId:8,kind:'checklist',initial:5}),{queryId:8,selection:5,text:''});
 assert(!sendCampaignDialogReply({queryId:17,selection:4,text:'a\0b'},module));
 module._vcmiMobileCampaignDraft=(id,choice,pointer)=>calls.push(['draft',id,choice,new TextDecoder().decode(memory.subarray(pointer,pointer+5))]);
 assert(sendCampaignDialogDraft({queryId:17,selection:4,text:'draft'},module));assert.deepEqual(calls.slice(-2),[['draft',17,4,'draft'],['free',32]]);
 assert.deepEqual(campaignDialogDraft({queryId:9,kind:'extended',draft:{selection:0,text:'Saved answer'}}),{queryId:9,selection:0,text:'Saved answer'});

});
