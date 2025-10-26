import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser, // <-- Import deleteUser
} from "firebase/auth";
import { auth, db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  deleteDoc, // <-- Import deleteDoc
} from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // (signup function is unchanged)
  const signup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    await updateProfile(user, { displayName: name });
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      email: user.email,
      friends: [],
      pendingRequests: [],
      sentRequests: [],
    });
    return userCredential;
  };

  // (login function is unchanged)
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // (logout function is unchanged)
  const logout = () => {
    return signOut(auth);
  };

  // (updateProfileName function is unchanged)
  const updateProfileName = async (name) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is logged in.");
    if (!currentUser) throw new Error("User data not loaded.");
    const nameLastUpdatedAt = currentUser.nameLastUpdatedAt;
    if (nameLastUpdatedAt) {
      const lastUpdateDate = nameLastUpdatedAt.toDate();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastUpdateDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 29) {
        const daysRemaining = 29 - diffDays;
        throw new Error(
          `You can only change your name once every 29 days. Please try again in ${
            daysRemaining + 1
          } day(s).`
        );
      }
    }
    try {
      await updateProfile(user, { displayName: name });
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        name: name,
        nameLastUpdatedAt: serverTimestamp(),
      });
      setCurrentUser((prev) => ({
        ...prev,
        displayName: name,
        name: name,
        nameLastUpdatedAt: Timestamp.now(),
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  // (acceptFriendRequest function is unchanged)
  const acceptFriendRequest = async (friendUid) => {
    if (!currentUser) return;
    const myDocRef = doc(db, "users", currentUser.uid);
    const friendDocRef = doc(db, "users", friendUid);
    await updateDoc(myDocRef, {
      friends: arrayUnion(friendUid),
      pendingRequests: arrayRemove(friendUid),
    });
    await updateDoc(friendDocRef, {
      friends: arrayUnion(currentUser.uid),
      sentRequests: arrayRemove(currentUser.uid),
    });
    setCurrentUser((prev) => ({
      ...prev,
      friends: [...(prev.friends || []), friendUid],
      pendingRequests: (prev.pendingRequests || []).filter(
        (uid) => uid !== friendUid
      ),
    }));
  };

  // (declineFriendRequest function is unchanged)
  const declineFriendRequest = async (friendUid) => {
    if (!currentUser) return;
    const myDocRef = doc(db, "users", currentUser.uid);
    const friendDocRef = doc(db, "users", friendUid);
    await updateDoc(myDocRef, {
      pendingRequests: arrayRemove(friendUid),
    });
    await updateDoc(friendDocRef, {
      sentRequests: arrayRemove(currentUser.uid),
    });
    setCurrentUser((prev) => ({
      ...prev,
      pendingRequests: (prev.pendingRequests || []).filter(
        (uid) => uid !== friendUid
      ),
    }));
  };

  // --- NEW FUNCTION: DELETE USER ACCOUNT ---
  const deleteUserAccount = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("No user is logged in.");

    try {
      // 1. Delete Firestore document
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);

      // 2. Delete Auth user
      await deleteUser(user);
    } catch (error) {
      console.error("Error deleting user account:", error);
      if (error.code === "auth/requires-recent-login") {
        throw new Error(
          "This is a sensitive operation. Please log out and log back in, then try again."
        );
      }
      throw error;
    }
  };

  // (useEffect for onAuthStateChanged is unchanged)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const unsubDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setCurrentUser({ ...user, ...docSnap.data() });
          } else {
            setCurrentUser(user);
          }
          setLoading(false);
        });
        return () => unsubDoc();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- ADDED deleteUserAccount TO VALUE ---
  const value = {
    currentUser,
    signup,
    login,
    logout,
    updateProfileName,
    acceptFriendRequest,
    declineFriendRequest,
    deleteUserAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
