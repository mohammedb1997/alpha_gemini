import { $id } from '../core/utils.js';

function startJudgeSetup() {
  const params = {
    cols: parseInt($id('js-cols').value),
    rows: parseInt($id('js-rows').value),
    rounds: parseInt($id('js-rounds').value),
    timerA: parseInt($id('js-timer-a').value),
    timerB: parseInt($id('js-timer-b').value),
    teamAColor: $id('js-ca').value,
    teamBColor: $id('js-cb').value,
    teamAName: $id('js-name-a').value || 'أ',
    teamBName: $id('js-name-b').value || 'ب'
  };
  sessionStorage.setItem('judgeParams', JSON.stringify(params));
  window.navigateTo('judge-game');
}

$id('js-ca').addEventListener('input', function() {
  $id('js-ci-a').style.background = this.value;
  $id('js-ti-a').style.background = this.value;
});
$id('js-cb').addEventListener('input', function() {
  $id('js-ci-b').style.background = this.value;
  $id('js-ti-b').style.background = this.value;
});

$id('js-start').addEventListener('click', startJudgeSetup);

window.startJudgeSetup = startJudgeSetup;
