import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqFADtK5JDC6vDaQ7F4uV-v4xokYZ4BnE",
  authDomain: "fir-test-403f2.firebaseapp.com",
  projectId: "fir-test-403f2",
  storageBucket: "fir-test-403f2.firebasestorage.app",
  messagingSenderId: "334851316125",
  appId: "1:334851316125:web:fc5fc08ad06b894f7ff774",
  measurementId: "G-B5NXGV949T"
};

const app = initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);

let SingupBtn=document.getElementById("singnup");
let Email=document.getElementById("email");
let Passowrd=document.getElementById("password");
let SingnUpform=document.getElementById("singupForm");

SingnUpform.onsubmit=(e)=>{
    e.preventDefault(); 
    singnup();
}

let singnup=async()=>{
    try{
        await createUserWithEmailAndPassword(auth,Email.value,Passowrd.value);
        alert("created success");
    }catch(e){
        alert(e.message);
    }
}