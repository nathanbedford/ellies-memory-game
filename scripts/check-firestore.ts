import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAbdQa7Bm63yrGezbShVDmkzC5N-2Z7F-c",
  authDomain: "matchimus.firebaseapp.com",
  databaseURL: "https://matchimus-default-rtdb.firebaseio.com",
  projectId: "matchimus",
  storageBucket: "matchimus.firebasestorage.app",
  messagingSenderId: "370532465626",
  appId: "1:370532465626:web:a527c8dd996f8e9dd65ee3",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "main-firestore");
const auth = getAuth(app);

async function main() {
  // Sign in anonymously first
  const userCred = await signInAnonymously(auth);
  console.log("Signed in anonymously as: " + userCred.user.uid);

  // List rooms (public read)
  console.log("\n=== Rooms Collection ===");
  const roomsSnap = await getDocs(collection(db, "rooms"));

  if (roomsSnap.empty) {
    console.log("No rooms found");
  } else {
    for (const docSnap of roomsSnap.docs) {
      const data = docSnap.data();
      console.log("\nRoom: " + docSnap.id);
      console.log("  status: " + data.status);
      console.log("  hostId: " + data.hostId);
      console.log("  players: " + JSON.stringify(Object.keys(data.players || {})));

      // Try to read the corresponding game doc
      console.log("  Checking /games/" + docSnap.id + "...");
      try {
        const gameDoc = await getDoc(doc(db, "games", docSnap.id));
        if (gameDoc.exists()) {
          const gameData = gameDoc.data();
          console.log("    Game exists!");
          console.log("    syncVersion: " + gameData.syncVersion);
          console.log("    currentPlayer: " + gameData.currentPlayer);
          const flipped = (gameData.cards || []).filter((c: any) => c.isFlipped && !c.isMatched);
          console.log("    flipped cards: " + flipped.map((c: any) => c.id).join(", "));
        } else {
          console.log("    No game document exists");
        }
      } catch (e: any) {
        console.log("    Cannot read game: " + e.code);
      }
    }
  }

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
