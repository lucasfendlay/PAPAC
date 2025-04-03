// Import Firebase Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCQUpubWuegQvlxkOOArtz-cVm45QLh2ZQ",
  authDomain: "pacap-d1aef.firebaseapp.com",
  projectId: "pacap-d1aef",
  storageBucket: "pacap-d1aef.firebasestorage.app",
  messagingSenderId: "697946888225",
  appId: "1:697946888225:web:a47ad9e3114aeb7b262b60",
  measurementId: "G-RL5SFT0EXL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore collection name for localStorage data
const collectionName = "localStorage";

// Helper function to get a Firestore document reference
function getFirestoreDoc(key) {
    return doc(db, collectionName, key);
}

// Override localStorage methods
window.localStorage = {
    async getItem(key) {
        try {
            const docRef = getFirestoreDoc(key);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().value;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error getting item from Firestore:", error);
            return null;
        }
    },
    async setItem(key, value) {
        try {
            const docRef = getFirestoreDoc(key);
            await setDoc(docRef, { value });
            console.log(`Saved ${key} to Firestore.`);
        } catch (error) {
            console.error("Error setting item in Firestore:", error);
        }
    },
    async removeItem(key) {
        try {
            const docRef = getFirestoreDoc(key);
            await deleteDoc(docRef);
            console.log(`Removed ${key} from Firestore.`);
        } catch (error) {
            console.error("Error removing item from Firestore:", error);
        }
    },
    async clear() {
        try {
            const querySnapshot = await getDocs(collection(db, collectionName));
            const batch = db.batch();
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log("Cleared all items from Firestore.");
        } catch (error) {
            console.error("Error clearing Firestore:", error);
        }
    }
};