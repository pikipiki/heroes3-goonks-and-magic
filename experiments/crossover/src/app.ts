import {HeroesObserver, ReadonlyBridge, UnavailableStarCraft} from './bridge.js';
const status = document.querySelector<HTMLElement>('#status')!;
const detail = document.querySelector<HTMLElement>('#detail')!;
const launch = document.querySelector<HTMLButtonElement>('#observe')!;
const holder = document.querySelector<HTMLElement>('#engine')!;
let bridge: ReadonlyBridge | undefined;
let frame: HTMLIFrameElement | undefined;
function stop(): void {
  bridge?.dispose(); bridge = undefined;
  frame?.remove(); frame = undefined;
  holder.hidden = true;
  status.textContent = 'Observation arrêtée.';
  detail.textContent = 'Aucune modification des armées ou des sauvegardes.';
  launch.disabled = false;
}
launch.addEventListener('click', () => {
  stop();
  launch.disabled = true;
  bridge = new ReadonlyBridge(crypto.randomUUID());
  const observer = new HeroesObserver(snapshot => {
    status.textContent = snapshot.reason;
    detail.textContent = `État ${snapshot.observation!.sequence} · mode ${snapshot.observation!.mode} · ${new Date(snapshot.observation!.receivedAt).toLocaleTimeString('fr-FR')}`;
  });
  bridge.register(observer);
  bridge.register(new UnavailableStarCraft());
  status.textContent = 'Chargement de Heroes Goonk…';
  detail.textContent = 'Le premier état peut attendre la fin du chargement du moteur.';
  holder.hidden = false;
  frame = document.createElement('iframe');
  frame.title = 'Heroes Goonk — observation en lecture seule';
  frame.src = '../game.html?mobile=1';
  frame.addEventListener('load', () => {
    try {
      // Capture only the existing native bridge events in this same-origin frame.
      observer.attach(frame!.contentWindow!);
      status.textContent = observer.status().reason;
    } catch {
      status.textContent = 'Observation impossible : la page Heroes doit être sur la même origine.';
    }
  });
  holder.append(frame);
});
document.querySelector('#stop')!.addEventListener('click', stop);
window.addEventListener('pagehide', stop);
