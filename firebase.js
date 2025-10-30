import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore, collection, addDoc,setDoc, getDocs, updateDoc, deleteDoc, doc, query, where
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


let Email=document.getElementById("email");
let Passowrd=document.getElementById("password");
let Passowrd1=document.getElementById("password1");
let name=document.getElementById("name");
let SingnUpform=document.getElementById("singupForm");

SingnUpform.onsubmit=(e)=>{
    e.preventDefault(); 
    singnup();
}

document.getElementById("check").addEventListener('click',()=>{
  if(Passowrd.type==="password"){
    Passowrd.type="text";
    Passowrd1.type="text";
  }else{
    Passowrd.type="password";
    Passowrd1.type="password";
  }
})

  

let singnup=async()=>{
    if(!name.value){
      alert("Please Fill The Name");
      name.classList.add("border-danger");
    }if(!Email.value){
      alert("Please Fill The Email");
      Email.classList.add("border-danger");
    }if(!Passowrd.value){
      alert("Please Fill The Confirm Password");
      Passowrd.classList.add("border-danger");
    }if(!Passowrd1.value){
      alert("Please Fill The Password");
      Passowrd1.classList.add("border-danger");
    }
    if(Passowrd.value !== Passowrd1.value){
      alert("Password And Confirm Password is not same");
       Passowrd1.classList.add("border-danger");
       Passowrd.classList.add("border-danger");
    }
    try{
       const userCredential= await createUserWithEmailAndPassword(auth,Email.value,Passowrd.value);
        const user=userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
         await setDoc(userDocRef, {
            name:name.value,
            email:Email.value,
          }, { merge: true });
         alert("created success");
         return window.location.href="index.html";
    }catch(e){
        if(e.code==="auth/email-already-in-use"){
          Email.classList.add("border-danger");
          alert("This Email is Registered");
        }else{
          console.log(e.message);
        }
    }
}