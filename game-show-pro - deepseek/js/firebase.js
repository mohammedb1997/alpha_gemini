// استبدل القيم التالية ببيانات مشروعك على Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD7PcSIqz0D7xxkJGN-7qnZ-CXiDJaHGC4",
  authDomain: "alpha-8ef9a.firebaseapp.com",
   projectId: "alpha-8ef9a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();