
const firebaseConfig = {
    apiKey: "AIzaSyA3yqO4Ba6-MVflDaKnhljg4mojIimyFsc",
    authDomain: "wanderly-8db97.firebaseapp.com",
    projectId: "wanderly-8db97",
    storageBucket: "wanderly-8db97.firebasestorage.app",
    messagingSenderId: "242661781478",
    appId: "1:242661781478:web:a8fca2464a7a76680fb027",
    measurementId: "G-SPN2GMDNSE"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

window.db = db;

console.log("Wanderly Firebase Connected!");
