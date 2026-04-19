const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_APP.firebaseapp.com",
  projectId: "YOUR_APP"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
