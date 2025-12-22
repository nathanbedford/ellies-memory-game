import { initializeApp } from "firebase/app";
import {
	getAuth,
	onAuthStateChanged,
	signInAnonymously,
	type User,
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   appId: import.meta.env.VITE_FIREBASE_APP_ID,
//   databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
// };

const firebaseConfig = {
	apiKey: "AIzaSyAbdQa7Bm63yrGezbShVDmkzC5N-2Z7F-c",
	authDomain: "matchimus.firebaseapp.com",
	databaseURL: "https://matchimus-default-rtdb.firebaseio.com",
	projectId: "matchimus",
	storageBucket: "matchimus.firebasestorage.app",
	messagingSenderId: "370532465626",
	appId: "1:370532465626:web:a527c8dd996f8e9dd65ee3",
	measurementId: "G-X80PFLRLP1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore for game state and rooms
// Use named database if specified, otherwise default
const firestoreDbName = "main-firestore";
export const db = getFirestore(app, firestoreDbName);

// Realtime Database for presence
export const rtdb = getDatabase(app);

// Auth for anonymous sessions
export const auth = getAuth(app);

// Sign in anonymously and return the user
export async function signInAnon(): Promise<User> {
	const { user } = await signInAnonymously(auth);
	return user;
}

// Get current user or wait for auth to initialize
export function getCurrentUser(): Promise<User | null> {
	return new Promise((resolve) => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			unsubscribe();
			resolve(user);
		});
	});
}

// Get or create anonymous user ID
export async function getOrCreateUserId(): Promise<string> {
	let user = await getCurrentUser();
	if (!user) {
		user = await signInAnon();
	}
	return user.uid;
}
