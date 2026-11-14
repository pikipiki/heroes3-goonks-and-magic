import {HeroesObserver, ReadonlyBridge, StarCraftObserver} from './bridge.js';
import type {HeroesObservation} from './native-bridge.js';
import {installAdventure} from './adventure.js';
const status = document.querySelector<HTMLElement>('#status')!;
const detail = document.querySelector<HTMLElement>('#detail')!;
const scStatus = document.querySelector<HTMLElement>('#sc-status')!;
const scDetail = document.querySelector<HTMLElement>('#sc-detail')!;
const transfer = document.querySelector<HTMLElement>('#transfer')!;
const prepare = document.querySelector<HTMLButtonElement>('#prepare-heroes')!;
const prepareResult = document.querySelector<HTMLElement>('#prepare-result')!;
let requestPreparation: (() => void) | undefined;
const launch = document.querySelector<HTMLButtonElement>('#observe')!;
const holder = document.querySelector<HTMLElement>('#engine')!;
let bridge: ReadonlyBridge | undefined;
let frames: HTMLIFrameElement[] = [];
let adventureDispose:(()=>void)|undefined;
function stop(): void {
  adventureDispose?.();adventureDispose=undefined;
  bridge?.dispose(); bridge = undefined;
  for (const frame of frames) frame.remove(); frames = [];
  holder.hidden = true;
  status.textContent = 'Observation arrêtée.';
  detail.textContent = 'Les armées restent gérées par VCMI.';
  scStatus.textContent = 'StarCraft arrêté.'; scDetail.textContent = '';
  transfer.textContent = 'Aucun échange en cours.';
  launch.disabled = false; prepare.disabled = true;
  requestPreparation = undefined; prepareResult.textContent = '';
}
launch.addEventListener('click', () => {
  stop(); launch.disabled = true;
  const session = crypto.randomUUID();
  bridge = new ReadonlyBridge(session);
  let preparationRequested = false;
  const updatePreparation = (): void => {
    prepare.disabled = preparationRequested || heroes.status().observation?.mode !== 'menu' || !(starcraft.status().native?.frame);
  };
  let pending: HeroesObservation | undefined, lastSent = 0, transferSequence = 0;
  const forward = (): void => {
    if (!pending || pending.sequence <= lastSent || starcraft.status().state !== 'observed') return;
    // Set before calling: the native acknowledgement is dispatched synchronously.
    lastSent = pending.sequence;
    try {
      const native = starcraft.forwardHeroes(pending);
      const reply = bridge!.request({version: 1, session, id: 'heroes-' + lastSent,
        source: 'heroes', target: 'starcraft', type: 'engine.status'});
      transfer.textContent = `Heroes #${lastSent} (${pending.mode}) → journal natif StarCraft ; retour frame ${native.frame}, empreinte ${reply.payload.native!.checksum}.`;
    } catch (e) { transfer.textContent = String(e); }
  };
  const starcraft = new StarCraftObserver(snapshot => {
    scStatus.textContent = snapshot.reason;
    scDetail.textContent = `Frame ${snapshot.native!.frame} · empreinte ${snapshot.native!.checksum} · résultat ${snapshot.native!.outcome} (0 : partie en cours)`;
    if (snapshot.native!.cohort) {
      const cohort = snapshot.native!.cohort;
      scDetail.textContent += ` · cohorte initiale : ${cohort.present}/${cohort.initial} présentes, ${cohort.missing} absente(s)`;
    }
    forward(); updatePreparation();
  });
  const heroes = new HeroesObserver(snapshot => {
    status.textContent = snapshot.reason;
    const observation = snapshot.observation!;
    detail.textContent = `État ${observation.sequence} · mode ${observation.mode} · ${new Date(observation.receivedAt).toLocaleTimeString('fr-FR')}`;
    // Publish meaningful mode transitions, not VCMI's repeated heartbeat snapshots.
    if (pending?.mode !== observation.mode) pending = {version: 1, session, sequence: ++transferSequence, mode: observation.mode};
    forward(); updatePreparation();
    if (preparationRequested && observation.mode === 'lobby') prepareResult.textContent = 'VCMI a confirmé l’ouverture de la préparation de partie.';
  });
  requestPreparation = (): void => {
    try {
      const native = starcraft.status().native;
      if (!native) throw Error('StarCraft doit démarrer avant l’envoi.');
      preparationRequested = heroes.prepareFromStarCraft(native);
      prepareResult.textContent = `Signal StarCraft frame ${native.frame} envoyé au moteur VCMI…`;
      updatePreparation();
    } catch (e) { prepareResult.textContent = String(e); }
  };
  bridge.register(heroes); bridge.register(starcraft);
  status.textContent = 'Chargement de Heroes Goonk…';
  detail.textContent = 'En attente du premier événement natif.';
  scStatus.textContent = starcraft.status().reason;
  transfer.textContent = 'Les événements réels Heroes seront transmis après le démarrage de StarCraft.';
  holder.hidden = false;
  const attach = (title: string, src: string, container: string, listen: (target: Window) => void): void => {
    const frame = document.createElement('iframe');
    frame.title = title; frame.src = src; frames.push(frame);
    frame.addEventListener('load', () => {
      if (!frames.includes(frame)) return;
      try { listen(frame.contentWindow!); }
      catch (e) { transfer.textContent = 'Connexion aux moteurs impossible : ' + String(e); }
    });
    document.querySelector(container)!.append(frame);
  };
  attach('Heroes Goonk — moteur VCMI', '../game.html?mobile=1', '#heroes-frame', target => heroes.attach(target));
  attach('StarCraft — moteur OpenBW', './starcraft/index.html', '#starcraft-frame', target => { lastSent = 0; starcraft.attach(target); });
});
document.querySelector('#stop')!.addEventListener('click', stop);
window.addEventListener('pagehide', stop);

prepare.addEventListener('click', () => requestPreparation?.());
function adventure(trial:boolean):void {
 stop();holder.hidden=false;launch.disabled=true;
 const frame=document.createElement('iframe');frame.title='Heroes — combats StarCraft';frame.src='../game.html?mobile=1';
 frame.style.cssText='position:fixed;inset:0;width:100%;height:100dvh;z-index:100;border:0;background:#080d17';
 frames.push(frame);document.querySelector('#heroes-frame')!.append(frame);
 frame.addEventListener('load',()=>{if(frames.includes(frame))adventureDispose=installAdventure(frame.contentWindow!,new URL('./',import.meta.url),stop,trial);});
}
document.querySelector('#adventure')!.addEventListener('click',()=>adventure(false));
document.querySelector('#trial')!.addEventListener('click',()=>adventure(true));
