const firebaseConfig = {
  apiKey: "AIzaSyB0g2wgTdgkaJdJfdhjwHHm8Q39t-qalYU",
  authDomain: "gesturegamefyp.firebaseapp.com",
  projectId: "gesturegamefyp",
  storageBucket: "gesturegamefyp.firebasestorage.app",
  messagingSenderId: "798363868776",
  appId: "1:798363868776:web:2c4da3157f6c3b1b5ba5dd",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
