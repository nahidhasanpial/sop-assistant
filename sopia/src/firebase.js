import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  updateDoc
} from 'firebase/firestore';

// Paste your Firebase Config here. If left default, the app will run in offline Mock mode.
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "sop-assistant.firebaseapp.com",
  projectId: "sop-assistant",
  storageBucket: "sop-assistant.appspot.com",
  messagingSenderId: "placeholder",
  appId: "placeholder"
};

// Check if Config is real or placeholder
const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY";

let app;
let auth;
let db;
let googleProvider;

if (isConfigured) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error("Failed to initialize real Firebase, falling back to mock mode:", error);
  }
}

// ==========================================
// Firebase Actions (Unified Interface)
// ==========================================

// Mock State for offline use
const mockState = {
  user: null,
  sops: JSON.parse(localStorage.getItem('sop_assistant_mock_sops') || '[]'),
  listeners: []
};

// Helper to trigger state listeners
const triggerListeners = () => {
  mockState.listeners.forEach(cb => cb(mockState.user));
};

export const loginWithGoogle = async () => {
  if (isConfigured && auth) {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } else {
    // Simulated Google Login (Gmail)
    const mockUser = {
      uid: 'mock-user-123',
      displayName: 'Simulated Graduate Student',
      email: 'student.applicant@gmail.com',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=applicant',
      isPremium: localStorage.getItem('sop_assistant_premium') === 'true'
    };
    mockState.user = mockUser;
    localStorage.setItem('sop_assistant_mock_user', JSON.stringify(mockUser));
    triggerListeners();
    return mockUser;
  }
};

export const logout = async () => {
  if (isConfigured && auth) {
    await signOut(auth);
  } else {
    mockState.user = null;
    localStorage.removeItem('sop_assistant_mock_user');
    triggerListeners();
  }
};

export const onAuthChange = (callback) => {
  if (isConfigured && auth) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch premium status from user's document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isPremium = userDoc.exists() ? !!userDoc.data().isPremium : false;
        callback({ ...user, isPremium });
      } else {
        callback(null);
      }
    });
  } else {
    // Mock subscription
    mockState.listeners.push(callback);
    const savedUser = localStorage.getItem('sop_assistant_mock_user');
    if (savedUser) {
      mockState.user = JSON.parse(savedUser);
      mockState.user.isPremium = localStorage.getItem('sop_assistant_premium') === 'true';
    }
    // Fire initially
    setTimeout(() => callback(mockState.user), 100);
    
    // Return unsubscriber
    return () => {
      mockState.listeners = mockState.listeners.filter(cb => cb !== callback);
    };
  }
};

export const saveSop = async (userId, sopData) => {
  const payload = {
    ...sopData,
    userId,
    updatedAt: new Date().toISOString()
  };

  if (isConfigured && db) {
    const docRef = doc(db, 'sops', sopData.id || `sop_${Date.now()}`);
    await setDoc(docRef, payload, { merge: true });
    return payload;
  } else {
    // Local storage mock save
    const sops = [...mockState.sops];
    const index = sops.findIndex(s => s.id === sopData.id);
    const updatedSop = { ...payload, id: sopData.id || `sop_${Date.now()}` };
    
    if (index >= 0) {
      sops[index] = updatedSop;
    } else {
      sops.push(updatedSop);
    }
    
    mockState.sops = sops;
    localStorage.setItem('sop_assistant_mock_sops', JSON.stringify(sops));
    return updatedSop;
  }
};

export const fetchSops = async (userId) => {
  if (isConfigured && db) {
    const sopsCol = collection(db, 'sops');
    const q = query(sopsCol, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } else {
    // Local Storage mock fetch
    return mockState.sops.filter(s => s.userId === userId);
  }
};

export const updatePremiumStatus = async (userId, isPremium) => {
  if (isConfigured && db) {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { isPremium }, { merge: true });
  } else {
    // Mock save
    localStorage.setItem('sop_assistant_premium', isPremium ? 'true' : 'false');
    if (mockState.user) {
      mockState.user.isPremium = isPremium;
      localStorage.setItem('sop_assistant_mock_user', JSON.stringify(mockState.user));
      triggerListeners();
    }
  }
};
