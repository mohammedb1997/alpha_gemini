let roomId = localStorage.getItem("roomId");
let timerInterval = null;

function createRoom() {
    db.collection("rooms").add({
        current: null,
        teams: [],
        timer: 30
    }).then(doc => {
        roomId = doc.id;
        localStorage.setItem("roomId", roomId);
        alert("كود الغرفة: " + roomId);
    }).catch(err => {
        alert("خطأ: " + err.message);
    });
}

function joinRoom(id) {
    roomId = id;
    localStorage.setItem("roomId", id);
}

function listen() {
    if (!roomId) {
        console.warn("لا يوجد roomId");
        return;
    }
    db.collection("rooms").doc(roomId)
        .onSnapshot(doc => {
            if (doc.exists) {
                // استدعاء updateUI الموجود في الصفحة المستضيفة
                if (typeof updateUI === "function") {
                    updateUI(doc.data());
                } else {
                    console.warn("updateUI غير معرفة في هذه الصفحة");
                }
            }
        });
}

function update(data) {
    if (!roomId) return;
    db.collection("rooms").doc(roomId).update(data).catch(console.error);
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    let t = 30;
    update({ timer: t });
    timerInterval = setInterval(() => {
        t--;
        update({ timer: t });
        if (t <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            update({ "current.show": true });
        }
    }, 1000);
}

function buzz(team) {
    update({
        "current.buzzer": team,
        "current.show": true
    });
}

// دالة عامة لإيقاف المؤقت يدويًا
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}