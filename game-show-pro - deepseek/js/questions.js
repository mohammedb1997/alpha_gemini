const QUESTIONS = [
    { letter: "أ", q: "عاصمة السعودية؟" },
    { letter: "ب", q: "حيوان يبدأ بـ ب؟" },
    { letter: "ت", q: "مدينة سعودية؟" },
    { letter: "ج", q: "حيوان مفترس يبدأ بـ ج؟" },
    { letter: "ح", q: "حيوان أليف يبدأ بـ ح؟" }
];

function getQuestion(letter) {
    let arr = QUESTIONS.filter(q => q.letter === letter);
    if (arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}