import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  getDocs
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Firebase configuration from environment variables with fallback to firebase-applet-config.json
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey || "AIzaSyCbz3aA7EFA-eBbuTAZ4jvpN-Q8ya5usro",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain || "ai-studio-applet-webapp-9ef67.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId || "ai-studio-applet-webapp-9ef67",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket || "ai-studio-applet-webapp-9ef67.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId || "29723173919",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId || "1:29723173919:web:9f28295fe6fd081b99e12a"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID from config or fallback
export const db = getFirestore(app, firebaseConfigData.firestoreDatabaseId || "ai-studio-bagdiquarterfood-fdd053aa-42dc-4fde-a83d-58e60580b941");

// Track last known lengths to avoid unnecessary getDocs calls during insertion/updates
const lastKnownLengths: Record<string, number> = {};

// Track stringified representation of each document to only write when changed
const lastSyncedDocCache: Record<string, Record<string, string>> = {};

/**
 * Checks if the database has been seeded. If not, seeds it with initial mock data.
 */
export async function checkAndSeedDatabase(initialDataMap: Record<string, any[]>) {
  try {
    const metaDocRef = doc(db, 'metadata', 'seeded');
    const metaDoc = await getDoc(metaDocRef);

    if (metaDoc.exists() && metaDoc.data()?.seeded) {
      console.log('Firebase Database already seeded.');
      return;
    }

    console.log('Seeding Firebase Database with initial mock data...');
    const batch = writeBatch(db);

    for (const [key, items] of Object.entries(initialDataMap)) {
      if (!items || !Array.isArray(items)) continue;
      
      const keyCache: Record<string, string> = {};
      for (const item of items) {
        if (!item || !item.id) continue;
        const docRef = doc(db, key, String(item.id));
        batch.set(docRef, item);
        keyCache[String(item.id)] = JSON.stringify(item);
      }
      lastSyncedDocCache[key] = keyCache;
    }

    // Set seeded flag
    batch.set(metaDocRef, { seeded: true, timestamp: new Date().toISOString() });
    await batch.commit();
    console.log('Firebase Database seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding Firebase database:', error);
  }
}

/**
 * Syncs a Firestore collection with a React state callback.
 * Also returns an unsubscribe function.
 */
export function listenToCollection(key: string, callback: (data: any[]) => void) {
  const colRef = collection(db, key);
  return onSnapshot(colRef, (snapshot) => {
    const items: any[] = [];
    const keyCache: Record<string, string> = {};
    
    snapshot.forEach((doc) => {
      const val = doc.data();
      items.push(val);
      if (val && val.id) {
        keyCache[String(val.id)] = JSON.stringify(val);
      }
    });

    lastSyncedDocCache[key] = keyCache;
    
    // Sort items if they have an ID or timestamp to maintain consistent order
    // Room configs: order by roomNumber numerically
    if (key === 'rooms_db') {
      items.sort((a, b) => {
        const strA = String(a.roomNumber || '');
        const strB = String(b.roomNumber || '');
        const numA = parseInt(strA, 10);
        const numB = parseInt(strB, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return strA.localeCompare(strB);
      });
    } else if (key === 'preload_db') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (key === 'logs_db') {
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (key === 'chats_db') {
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (key === 'demands_db') {
      items.sort((a, b) => new Date(b.timestamp || b.timeSubmitted || 0).getTime() - new Date(a.timestamp || a.timeSubmitted || 0).getTime());
    } else if (key === 'users_db') {
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    lastKnownLengths[key] = items.length;
    callback(items);
  }, (error) => {
    console.error(`Error listening to collection ${key}:`, error);
  });
}

/**
 * Manually fetches a collection from Firestore (fail-safe for websocket dropouts)
 */
export async function fetchCollection(key: string): Promise<any[]> {
  try {
    const colRef = collection(db, key);
    const snapshot = await getDocs(colRef);
    const items: any[] = [];
    const keyCache: Record<string, string> = {};

    snapshot.forEach((doc) => {
      const val = doc.data();
      items.push(val);
      if (val && val.id) {
        keyCache[String(val.id)] = JSON.stringify(val);
      }
    });

    lastSyncedDocCache[key] = keyCache;

    // Sort items to maintain consistent order
    if (key === 'rooms_db') {
      items.sort((a, b) => {
        const strA = String(a.roomNumber || '');
        const strB = String(b.roomNumber || '');
        const numA = parseInt(strA, 10);
        const numB = parseInt(strB, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return strA.localeCompare(strB);
      });
    } else if (key === 'preload_db') {
      items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (key === 'logs_db') {
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (key === 'chats_db') {
      items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (key === 'demands_db') {
      items.sort((a, b) => new Date(b.timeSubmitted || b.timestamp).getTime() - new Date(a.timeSubmitted || a.timestamp).getTime());
    }

    lastKnownLengths[key] = items.length;
    return items;
  } catch (error) {
    console.error(`Error fetching collection ${key} manually:`, error);
    throw error;
  }
}

/**
 * Saves or updates items in a Firestore collection.
 * It writes documents using item.id as the document ID, and deletes documents not in the array.
 * Uses a local cache comparison to only update actual changes, saving heavy network load.
 */
export async function syncArrayToFirestore(key: string, data: any[]) {
  try {
    // Ensure cache exists for this key
    if (!lastSyncedDocCache[key]) {
      lastSyncedDocCache[key] = {};
    }
    const cache = lastSyncedDocCache[key];

    const batch = writeBatch(db);
    let writeCount = 0;

    // 1. Add/Update only changed/new items
    for (const item of data) {
      if (!item || !item.id) continue;
      const itemIdStr = String(item.id);
      const itemStr = JSON.stringify(item);

      if (cache[itemIdStr] !== itemStr) {
        const docRef = doc(db, key, itemIdStr);
        batch.set(docRef, item);
        cache[itemIdStr] = itemStr; // Update cache immediately
        writeCount++;
      }
    }

    // 2. Delete removed items (Safe guard: Never automatically batch-delete users or demands during array-sync,
    // as it can easily wipe out data due to local storage and Firestore sync lags.
    // Explicit deletions should be processed directly).
    if (key !== 'users_db' && key !== 'demands_db') {
      const activeIds = new Set(data.filter(item => item && item.id).map(item => String(item.id)));
      for (const cachedId of Object.keys(cache)) {
        if (!activeIds.has(cachedId)) {
          const docRef = doc(db, key, cachedId);
          batch.delete(docRef);
          delete cache[cachedId]; // Remove from cache
          writeCount++;
        }
      }
    }

    // 3. Commit batch if changes are present
    if (writeCount > 0) {
      await batch.commit();
      console.log(`Successfully synced ${writeCount} changes to Firestore collection: ${key}`);
    } else {
      console.log(`No changes detected for Firestore collection: ${key}, skipping sync.`);
    }
    
    lastKnownLengths[key] = data.length;
  } catch (error) {
    console.error(`Error syncing array to Firestore for ${key}:`, error);
    // Fallback to individual safe setDoc if batch fails
    try {
      const cache = lastSyncedDocCache[key] || {};
      for (const item of data) {
        if (!item || !item.id) continue;
        const itemIdStr = String(item.id);
        const itemStr = JSON.stringify(item);
        if (cache[itemIdStr] !== itemStr) {
          await setDoc(doc(db, key, itemIdStr), item);
          cache[itemIdStr] = itemStr;
        }
      }
    } catch (innerError) {
      console.error(`Individual save fallback failed for ${key}:`, innerError);
    }
  }
}

/**
 * Explicitly deletes a document from Firestore.
 */
export async function deleteDocFromFirestore(key: string, id: string) {
  try {
    const docRef = doc(db, key, String(id));
    await deleteDoc(docRef);
    console.log(`Successfully deleted document ${id} from Firestore collection: ${key}`);
    // Also remove from cache if exists
    if (lastSyncedDocCache[key]) {
      delete lastSyncedDocCache[key][String(id)];
    }
  } catch (error) {
    console.error(`Error deleting document ${id} from Firestore:`, error);
  }
}

/**
 * Saves or updates a single document in Firestore directly.
 */
export async function saveDocToFirestore(key: string, item: any) {
  if (!item || !item.id) return;
  try {
    const docRef = doc(db, key, String(item.id));
    await setDoc(docRef, item);
    console.log(`Successfully saved single document ${item.id} to Firestore collection: ${key}`);
    
    // Update local cache
    if (!lastSyncedDocCache[key]) {
      lastSyncedDocCache[key] = {};
    }
    lastSyncedDocCache[key][String(item.id)] = JSON.stringify(item);
  } catch (error) {
    console.error(`Error saving document ${item.id} to Firestore:`, error);
  }
}
