const QUESTIONS = [
  {letter:"أ", q:"عاصمة السعودية؟"},
  {letter:"ب", q:"حيوان يبدأ بـ ب؟"},
  {letter:"ت", q:"مدينة سعودية؟"}
];

function getQuestion(letter){
  let arr = QUESTIONS.filter(q=>q.letter === letter);
  return arr[Math.floor(Math.random()*arr.length)];
}
