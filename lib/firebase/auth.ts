import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

// Register a new user and create their Firestore user document
export async function registerUser(
  email: string,
  password: string,
  displayName: string
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Create the user document in Firestore
  await setDoc(doc(db, "users", user.uid), {
    email,
    displayName,
    createdAt: serverTimestamp(),
  });

  return user;
}

// Sign in an existing user
export async function signIn(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// Sign out the current user
export async function signOut() {
  await firebaseSignOut(auth);
}

// Subscribe to auth state changes — returns an unsubscribe function
export function subscribeToAuthChanges(
  callback: (user: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, callback);
}
