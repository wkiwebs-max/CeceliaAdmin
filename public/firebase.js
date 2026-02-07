import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmVcLPY_d5tjs_ITDaiaIpFOPvcoYp7r0",
  authDomain: "clayanddou.firebaseapp.com",
  projectId: "clayanddou",
  storageBucket: "clayanddou.firebasestorage.app",
  messagingSenderId: "53238674045",
  appId: "1:53238674045:web:c76c7c0c6636fe0558b714",
  measurementId: "G-FRW0CNB9WX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
