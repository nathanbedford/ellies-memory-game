import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, collection, getDocs } from "firebase/firestore";
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

// Get room code from command line
const roomCode = process.argv[2];
if (!roomCode) {
  console.log("Usage: bun scripts/test-subscription.ts <ROOMCODE>");
  process.exit(1);
}

async function main() {
  console.log(`Testing subscription for room: ${roomCode}`);

  // Sign in anonymously (this won't match any player in the room)
  const userCred = await signInAnonymously(auth);
  console.log("Signed in as:", userCred.user.uid);

  // First, check if room exists and get player UIDs
  console.log("\n=== Checking Room ===");
  const roomsSnap = await getDocs(collection(db, "rooms"));
  const room = roomsSnap.docs.find(d => d.id === roomCode);

  if (room) {
    const data = room.data();
    console.log("Room found:", roomCode);
    console.log("  status:", data.status);
    console.log("  Player UIDs in room:", Object.keys(data.players || {}).join(", "));
    console.log("\n  Your UID:", userCred.user.uid);
    console.log("  Are you a player?:", userCred.user.uid in (data.players || {}));
  } else {
    console.log("Room not found:", roomCode);
    process.exit(1);
  }

  // Try to subscribe to game state
  console.log("\n=== Attempting to subscribe to /games/" + roomCode + " ===");

  const gameRef = doc(db, "games", roomCode);

  let updateCount = 0;

  const unsubscribe = onSnapshot(
    gameRef,
    (snapshot) => {
      updateCount++;
      console.log(`\n[Update #${updateCount}] ${new Date().toISOString()}`);

      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log("  syncVersion:", data.syncVersion);
        console.log("  gameRound:", data.gameRound);
        console.log("  currentPlayer:", data.currentPlayer);
        console.log("  lastUpdatedBy:", data.lastUpdatedBy);
        console.log("  selectedCards:", data.selectedCards?.length || 0);

        const flipped = (data.cards || []).filter((c: { isFlipped: boolean; isMatched: boolean }) => c.isFlipped && !c.isMatched);
        console.log("  flipped (unmatched):", flipped.map((c: { id: string }) => c.id).join(", ") || "none");
      } else {
        console.log("  Document does not exist");
      }
    },
    (error) => {
      console.error("Subscription error:", error.code, error.message);
      process.exit(1);
    }
  );

  console.log("Subscription started. Waiting 10s for updates...");
  console.log("(Note: You won't receive updates if you're not a player in the room due to security rules)");

  // Wait 10 seconds then exit
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log("\nExiting after 10 seconds...");
  unsubscribe();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
