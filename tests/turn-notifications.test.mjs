import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createTurnNotifications} from '../web/turn-notifications.mjs';

test('Online turns notify once in the background after consent', async () => {
 const notices=[], store=new Map();
 const notification={permission:'default',async requestPermission(){return this.permission='granted';}};
 const api=createTurnNotifications({
  storage:{getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)},
  notification,
  serviceWorker:{getRegistration:async()=>({active:true,showNotification:async(...args)=>notices.push(args)})},
  hidden:()=>true,
  language:()=> 'fr',
 });
 assert.equal(await api.update({onlineGame:true,turn:true,day:1}),false);
 assert.equal(await api.toggle(),true);
 await api.update({onlineGame:true,turn:false,day:1});
 assert.equal(await api.update({onlineGame:true,turn:true,day:2}),true);
 assert.equal(await api.update({onlineGame:true,turn:true,day:2}),false);
 assert.equal(await api.update({turn:true,day:2}),false);
 assert.equal(notices.length,1);
 assert.equal(notices[0][1].body,'C’est à toi de jouer.');
 assert.equal(await api.toggle(),false);
 assert.equal(await api.update({onlineGame:true,turn:true,day:3}),false);
});
