let roomId = localStorage.getItem("roomId");
let timerInterval;

function createRoom(){
  db.collection("rooms").add({current:null,teams:[]})
  .then(doc=>{
    roomId = doc.id;
    localStorage.setItem("roomId", roomId);
    alert("كود الغرفة: " + roomId);
  });
}

function joinRoom(id){
  roomId = id;
  localStorage.setItem("roomId", id);
}

function listen(){
  db.collection("rooms").doc(roomId)
  .onSnapshot(doc=>{
    updateUI(doc.data());
  });
}

function update(data){
  db.collection("rooms").doc(roomId).update(data);
}

function startTimer(){
  let t = 30;
  timerInterval = setInterval(()=>{
    t--;
    update({timer:t});
    if(t<=0){
      clearInterval(timerInterval);
      update({"current.show":true});
    }
  },1000);
}

function buzz(team){
  update({
    "current.buzzer":team,
    "current.show":true
  });
}
