import { $id } from '../core/utils.js';

function startLocalSetup() {
  const params = {
    cols: parseInt($id('ls-cols').value),
    rows: parseInt($id('ls-rows').value),
    rounds: parseInt($id('ls-rounds').value),
    timerA: parseInt($id('ls-timer-a').value),
    timerB: parseInt($id('ls-timer-b').value),
    teamAColor: $id('ls-ca').value,
    teamBColor: $id('ls-cb').value,
    teamAName: $id('ls-name-a').value || 'أ',
    teamBName: $id('ls-name-b').value || 'ب',
    playerA: $id('ls-player-a').value || 'اللاعب أ',
    playerB: $id('ls-player-b').value || 'اللاعب ب'
  };
  sessionStorage.setItem('localParams', JSON.stringify(params));
  window.navigateTo('local-game');
}

$id('ls-ca').addEventListener('input', function() {
  $id('ls-ci-a').style.background = this.value;
  $id('ls-ti-a').style.background = this.value;
});
$id('ls-cb').addEventListener('input', function() {
  $id('ls-ci-b').style.background = this.value;
  $id('ls-ti-b').style.background = this.value;
});

$id('ls-start').addEventListener('click', startLocalSetup);

window.startLocalSetup = startLocalSetup;
