# Memory Card Game: Sync Architecture

## Overview

This document describes the synchronization architecture for a two-player online memory card game. The architecture prioritizes responsive UI through optimistic updates while maintaining consistency via Firestore as the authoritative source of truth.

## Mental Model: Database Replication

Think of this like database replication:

- **Firestore** = Primary database (source of truth)
- **Zustand** = Replica on each client

Like a replica:

- It serves reads locally (fast UI rendering)
- It accepts writes optimistically (immediate visual feedback)
- It eventually converges with the primary
- When there's a conflict, the primary wins

## Why Optimistic Updates Matter

In real-world conditions (school WiFi, spotty connections), network latency of 500-1000ms is common. Waiting for Firestore confirmation before showing a card flip creates unacceptable UX. The user clicked—they should see immediate feedback.

## Core Architecture

```
Player Action
     ↓
Optimistic Update → Zustand Store → UI Re-renders (immediate)
     ↓
Write to Firestore (async, may retry)
     ↓
Firestore confirms & broadcasts
     ↓
Snapshot Listener fires (both clients)
     ↓
Version Check → Apply if newer, ignore if same
     ↓
Zustand Store → UI Re-renders
```

## Version Counter Strategy

Every write to Firestore increments a `version` number. This enables consistent ordering:

1. When a player makes a move, increment version locally and in the Firestore write
2. When a snapshot arrives, compare versions:
   - If snapshot version > local version → apply the update
   - If snapshot version = local version → ignore (already applied optimistically)
   - If snapshot version < local version → ignore (stale)

## Game State Structure

### Firestore Document (`/games/{gameId}`)

```typescript
interface GameState {
  version: number;                    // Increments on every state change
  status: 'waiting' | 'playing' | 'ended';
  currentTurn: 'player1' | 'player2';
  flippedThisTurn: string[];          // Card IDs currently flipped (0, 1, or 2)
  
  cards: {
    [cardId: string]: {
      value: string;                  // The matching identifier
      state: 'facedown' | 'faceup' | 'matched';
      matchedBy?: 'player1' | 'player2';
    }
  };
  
  players: {
    player1: { id: string; name: string };
    player2: { id: string; name: string };
  };
}
```

### Derived State (computed in Zustand selectors)

```typescript
// Scores derived from cards
const scores = {
  player1: Object.values(cards).filter(c => c.matchedBy === 'player1').length / 2,
  player2: Object.values(cards).filter(c => c.matchedBy === 'player2').length / 2,
};

// Game ended when all cards matched
const isGameOver = Object.values(cards).every(c => c.state === 'matched');
```

## Zustand Store Shape

```typescript
interface GameStore extends GameState {
  // Sync action - called by Firestore listener
  syncFromFirestore: (state: GameState) => void;
  
  // Player actions - optimistic + Firestore write
  flipCard: (cardId: string) => Promise<void>;
  resolveMatch: () => Promise<void>;
  resolveNoMatch: () => Promise<void>;
}
```

## Key Scenarios

### 1. Flipping a Card (Optimistic Update)

```typescript
async function flipCard(cardId: string) {
  const state = get();
  
  // Optimistic local update
  const newVersion = state.version + 1;
  set({
    version: newVersion,
    cards: {
      ...state.cards,
      [cardId]: { ...state.cards[cardId], state: 'faceup' }
    },
    flippedThisTurn: [...state.flippedThisTurn, cardId],
  });
  
  // Write to Firestore (will retry automatically on network issues)
  await updateDoc(gameRef, {
    version: newVersion,
    [`cards.${cardId}.state`]: 'faceup',
    flippedThisTurn: arrayUnion(cardId),
  });
}
```

### 2. Applying Firestore Snapshots

```typescript
function syncFromFirestore(incoming: GameState) {
  const current = get();
  
  // Only apply if this is newer than what we have
  if (incoming.version > current.version) {
    set(incoming);
  }
  // If versions match, we already applied this optimistically—ignore
}
```

### 3. Match Resolution Timing

The pause to show both cards before resolving is a **local UI concern**, not replicated state.

When the state shows `flippedThisTurn.length === 2`:

1. Each client independently runs a setTimeout (e.g., 1500ms)
2. The active player's client writes the resolution after the delay
3. Only the active player writes—keeps it simple

```typescript
useEffect(() => {
  if (flippedThisTurn.length === 2 && isMyTurn) {
    const timer = setTimeout(() => {
      const [card1, card2] = flippedThisTurn;
      if (cards[card1].value === cards[card2].value) {
        resolveMatch();
      } else {
        resolveNoMatch();
      }
    }, 1500);
    return () => clearTimeout(timer);
  }
}, [flippedThisTurn, isMyTurn]);
```

### 4. Turn Transitions

On no match:

- Flip both cards back to `facedown`
- Clear `flippedThisTurn`
- Switch `currentTurn` to opponent
- Increment `version`

On match:

- Set both cards to `matched` with `matchedBy` = current player
- Clear `flippedThisTurn`
- Keep `currentTurn` the same (player goes again)
- Increment `version`

## Firestore Configuration

Enable persistence for resilience on flaky networks:

```typescript
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
  localCache: persistentLocalCache({})
});
```

This ensures:

- Writes are queued in IndexedDB if offline
- Queued writes survive page refresh or browser close
- Automatic retry when connectivity returns

## Useful Metadata

Firestore snapshots include metadata you can use for UI indicators:

```typescript
onSnapshot(gameRef, (snapshot) => {
  const data = snapshot.data();
  const metadata = snapshot.metadata;
  
  if (metadata.hasPendingWrites) {
    // Show subtle "syncing..." indicator
  }
  
  if (metadata.fromCache) {
    // Data came from local cache, not server
  }
  
  syncFromFirestore(data);
});
```

## Edge Cases to Handle

1. **Player disconnects mid-turn**: If the active player closes their browser after flipping two cards but before resolution, the game stalls. Future enhancement: add a timeout or let the other player take over after N seconds.

2. **Rapid clicking**: Debounce or disable card clicks while a flip is in progress to prevent race conditions.

3. **Stale tabs**: If a player has multiple tabs open, only one should be active. Consider using Firestore's multi-tab persistence or detecting/blocking duplicate sessions.

## Summary

| Component | Role |
|-----------|------|
| Zustand | Local state for UI, accepts optimistic updates |
| Firestore | Source of truth, handles persistence and sync |
| Version counter | Ensures updates applied in correct order |
| Snapshot listener | Keeps both clients in sync |
| Persistence | Handles offline/flaky network gracefully |
