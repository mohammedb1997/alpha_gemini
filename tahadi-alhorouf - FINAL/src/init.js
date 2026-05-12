import { cleanupAll, $id, show, hide } from './core/utils.js';
import './screens/judge-game.js';
import './screens/display.js';
import './screens/player.js';
import './screens/local-setup.js';
import './screens/judge-setup.js';
import './screens/local-game.js';
import './screens/player-join.js';
import './screens/player-wait.js';
import './screens/player-bz.js';

let peer = null;
let currentScreen = null;

const SCREENS = [
  'home',
  'local-setup', 'local-game',
  'judge-setup', 'judge-game',
  'display',
  'player-join', 'player-wait', 'player-bz'
];

function navigateTo(screenId) {
  cleanupAll();
  SCREENS.forEach(id => hide(id));
  $id(screenId).style.display = '';
  currentScreen = screenId;
}

window.navigateTo = navigateTo;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-nav');
      if (target === 'player-join') {
        window.startPlayerJoin();
      }
      navigateTo(target);
    });
  });

  document.querySelectorAll('.back-home').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
    });
  });

  navigateTo('home');
});
