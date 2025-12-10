# Firebase Setup Guide

This guide walks you through setting up Firebase and gathering all the configuration values needed for your `.env` file.

## Understanding the Architecture

This app uses two databases:

| Database | Purpose | Where It Lives |
|----------|---------|----------------|
| **Firestore** | Game state, rooms | Google Cloud Platform (GCP) |
| **Realtime Database** | Player presence (online/offline) | Firebase |

Firestore is a GCP product. Firebase is a layer on top of GCP. You can:
- Create Firestore directly in GCP Console
- Create Firestore via Firebase Console (which creates it in GCP behind the scenes)
- Link an existing GCP project to Firebase to use both

## Prerequisites

- A Google account
- Access to [Google Cloud Console](https://console.cloud.google.com) (for Firestore)
- Access to [Firebase Console](https://console.firebase.google.com) (for Realtime DB & Auth)

---

## Step 1: Link Your GCP Project to Firebase (If Not Already)

If you created Firestore in GCP and want to use Firebase services:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Select **"Add Firebase to a Google Cloud project"**
4. Choose your existing GCP project from the dropdown
5. Continue through the setup

This links Firebase to your GCP project, giving you access to:
- Your existing Firestore database
- Firebase Authentication
- Firebase Realtime Database

---

## Step 2: Register a Web App

1. From your project's dashboard, click the **web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "Matchimus Web")
3. Skip Firebase Hosting for now
4. Click **"Register app"**

You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

**Copy these values to your `.env` file:**

| Config Property | .env Variable |
|-----------------|---------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

### Finding These Values Later

If you need to find these values again:

1. Go to Firebase Console → Your Project
2. Click the **gear icon** (next to "Project Overview")
3. Select **"Project settings"**
4. Scroll down to **"Your apps"** section
5. Click on your web app to see the config

---

## Step 3: Enable Anonymous Authentication

The game uses anonymous auth so players don't need to create accounts.

1. In Firebase Console, go to **Build → Authentication**
2. Click **"Get started"**
3. Go to the **"Sign-in method"** tab
4. Click **"Anonymous"**
5. Toggle **"Enable"** to ON
6. Click **"Save"**

---

## Step 4: Set Up Firestore Database

Firestore stores rooms and game state.

### Option A: Firestore Already Exists in GCP

If you created Firestore directly in GCP Console:

1. Go to [GCP Console → Firestore](https://console.cloud.google.com/firestore)
2. Your database should appear - note the **database name** in the header
3. If it's named anything other than `(default)`, you'll need to set it in `.env`

### Option B: Create Firestore via Firebase

1. Go to Firebase Console → **Build → Firestore Database**
2. Click **"Create database"**
3. Choose a location (pick one close to your users)
4. Start in **"test mode"** for development
5. Click **"Create"**

### Finding Your Firestore Database Name

**In GCP Console:**
1. Go to [console.cloud.google.com/firestore](https://console.cloud.google.com/firestore)
2. Look at the dropdown or header showing database name
3. Common names: `(default)`, `main-firestore`, or a custom name

**In Firebase Console:**
1. Go to Firestore Database
2. Click "All databases" dropdown at top
3. See which database is selected

### If Your Database is NOT Named "(default)"

Add to your `.env`:
```
VITE_FIREBASE_FIRESTORE_DB=main-firestore
```

Replace `main-firestore` with your actual database name.

---

## Step 5: Set Up Realtime Database

Realtime Database handles player presence (online/offline status).

1. Go to **Build → Realtime Database**
2. Click **"Create Database"**
3. Choose a location (ideally same region as Firestore)
4. Start in **"test mode"** for development
5. Click **"Enable"**

### Get the Database URL

After creation, you'll see your database URL at the top:

```
https://your-project-default-rtdb.firebaseio.com/
```

**Copy this to your `.env` file:**

```
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

---

## Step 6: Create Your .env File

1. In your project root, copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in all the values:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyB...your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:123456789:web:abc123...
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com

# Only if your Firestore database is not named "(default)"
 P```

---

## Step 7: Configure Security Rules (Before Going Live)

### Firestore Rules

Go to **Firestore Database → Rules** and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rooms collection
    match /rooms/{roomCode} {
      // Anyone can read rooms (to join)
      allow read: if true;

      // Authenticated users can create rooms
      allow create: if request.auth != null;

      // Only players in the room can update
      allow update: if request.auth != null
        && request.auth.uid in resource.data.players;

      // Only host can delete
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.hostId;
    }
  }
}
```

### Realtime Database Rules

Go to **Realtime Database → Rules** and set:

```json
{
  "rules": {
    "presence": {
      "$roomCode": {
        "$odahId": {
          ".read": true,
          ".write": "$odahId === auth.uid"
        }
      }
    }
  }
}
```

---

## Troubleshooting

### "Permission Denied" Errors

- Make sure Anonymous Authentication is enabled
- Check that your security rules allow the operation
- Verify you're signed in (check browser console for auth state)

### "Database not found" Errors

- Verify `VITE_FIREBASE_PROJECT_ID` is correct
- If using a named Firestore database, set `VITE_FIREBASE_FIRESTORE_DB`
- Make sure the database exists in Firebase Console

### "Network Error" or Timeout

- Check your `VITE_FIREBASE_DATABASE_URL` is correct
- Ensure Realtime Database is created and enabled
- Verify your internet connection

### Changes Not Taking Effect

- Restart the dev server after changing `.env`
- Clear browser cache/localStorage
- Check browser console for errors

---

## Quick Reference

| What You Need | Where to Find It | Which Console |
|---------------|------------------|---------------|
| API Key | Project Settings → Your Apps → Config | Firebase |
| Auth Domain | Project Settings → Your Apps → Config | Firebase |
| Project ID | Project Settings → General | Firebase or GCP |
| App ID | Project Settings → Your Apps → Config | Firebase |
| Database URL | Realtime Database → URL in header | Firebase |
| Firestore DB Name | Firestore → Database name in header | GCP or Firebase |

### Console Links

- **Firebase Console:** [console.firebase.google.com](https://console.firebase.google.com)
- **GCP Console:** [console.cloud.google.com](https://console.cloud.google.com)
- **GCP Firestore:** [console.cloud.google.com/firestore](https://console.cloud.google.com/firestore)

---

## Next Steps

After setup, run the app:

```bash
npm run dev
```

Then test online multiplayer:
1. Click "Start Game"
2. Select "Play Online"
3. Create a room
4. Open another browser/tab and join with the code
