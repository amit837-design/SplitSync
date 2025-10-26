import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import PoolItem from "../components/PoolItem";
import AddPoolModal from "../components/AddPoolModal";
import DeleteAccountModal from "../components/DeleteAccountModal";
import InfoModal from "../components/InfoModal";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Plus, UserPlus, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeView, setActiveView] = useState("pools");
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [poolId, setPoolId] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [friendError, setFriendError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const { currentUser, deleteUserAccount } = useAuth();

  // (getPoolId function)
  const getPoolId = (uid1, uid2) => [uid1, uid2].sort().join("_");

  // --- handleAddFriend ---
  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!currentUser) return setFriendError("You must be logged in.");
    if (friendEmail === currentUser.email) {
      return setFriendError("You cannot add yourself as a friend.");
    }
    setFriendError("");

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", friendEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return setFriendError("User not found.");
      }

      const friendData = querySnapshot.docs[0].data();

      if (currentUser.friends?.includes(friendData.uid)) {
        return setFriendError("You are already friends.");
      }
      if (currentUser.sentRequests?.includes(friendData.uid)) {
        return setFriendError("You have already sent a request to this user.");
      }
      if (currentUser.pendingRequests?.includes(friendData.uid)) {
        return setFriendError(
          "This user has already sent you a request. Check your dashboard!"
        );
      }

      const myDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(myDocRef, {
        sentRequests: arrayUnion(friendData.uid),
      });

      const friendDocRef = doc(db, "users", friendData.uid);
      await updateDoc(friendDocRef, {
        pendingRequests: arrayUnion(currentUser.uid),
      });

      setFriendEmail("");
      setSuccessMessage("Friend request sent!"); // <-- Replacing the alert()
    } catch (err) {
      setFriendError("Failed to send request. " + err.message);
    }
  };

  // (useEffect for pool updates)
  useEffect(() => {
    if (!selectedFriend || !currentUser) {
      setExpenses([]);
      return;
    }
    const newPoolId = getPoolId(currentUser.uid, selectedFriend.uid);
    setPoolId(newPoolId);
    const poolDocRef = doc(db, "pools", newPoolId);
    const unsubscribe = onSnapshot(poolDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const sortedExpenses = (data.expenses || []).sort(
          (a, b) => b.createdAt?.toDate() - a.createdAt?.toDate()
        );
        setExpenses(sortedExpenses);
      } else {
        setExpenses([]);
      }
    });
    return () => unsubscribe();
  }, [selectedFriend, currentUser]);

  // (Delete modal handlers)
  const handleOpenDeleteModal = () => {
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      await deleteUserAccount();
      setIsDeleteModalOpen(false);
    } catch (err) {
      setDeleteError(`Failed to delete account. ${err.message}`);
    }
    setDeleteLoading(false);
  };

  const renderContent = () => {
    if (activeView === "dashboard") {
      return <Dashboard onOpenDeleteModal={handleOpenDeleteModal} />;
    }

    // (Pool View render)
    return (
      <div className="p-4 md:p-8">
        <div className="p-4 mb-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h3 className="mb-2 font-semibold">Send a Friend Request</h3>
          <form onSubmit={handleAddFriend} className="flex gap-2">
            <input
              type="email"
              value={friendEmail}
              onChange={(e) => setFriendEmail(e.target.value)}
              placeholder="Friend's email"
              className="flex-1 p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              type="submit"
              className="p-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <UserPlus size={20} />
            </button>
          </form>
          {friendError && (
            <p className="mt-2 text-sm text-red-500">{friendError}</p>
          )}
          {!selectedFriend && (
            <button
              onClick={() =>
                setSelectedFriend({
                  uid: "REPLACE_WITH_FRIEND_UID",
                  email: "friend@example.com",
                  name: "Test Friend",
                })
              }
              className="px-4 py-2 mt-3 text-sm text-white bg-gray-500 rounded-lg"
            >
              Test: Select Friend
            </button>
          )}
        </div>

        {selectedFriend ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                Pool with {selectedFriend.name}
              </h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus size={16} /> Add Expense
              </button>
            </div>

            <div className="max-w-xl mx-auto">
              {expenses.length > 0 ? (
                expenses.map((item) => (
                  <PoolItem key={item.id} item={item} poolId={poolId} />
                ))
              ) : (
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                  <p>No expenses shared yet.</p>
                  <p>Click "Add Expense" to start a pool!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            <p>Select a friend from the sidebar to view your expense pool.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* (Main content, sidebar, and floating button) */}
      <motion.main
        animate={{ filter: isSidebarOpen ? "blur(5px)" : "blur(0px)" }}
        transition={{ duration: 0.3 }}
        className="w-full h-full overflow-y-auto"
      >
        {renderContent()}
      </motion.main>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="fixed top-0 left-0 z-50 h-full"
            >
              <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                onSelectFriend={setSelectedFriend}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
                selectedFriend={selectedFriend}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed bottom-5 left-5 z-30 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
      >
        <ChevronRight size={22} />
      </button>

      {/* (AddPoolModal and DeleteAccountModal) */}
      <AddPoolModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        friendEmail={selectedFriend?.email}
        friendUid={selectedFriend?.uid}
      />

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirmDelete={handleConfirmDelete}
        loading={deleteLoading}
        error={deleteError}
      />

      <InfoModal
        isOpen={!!successMessage} // Show modal if successMessage is not empty
        onClose={() => setSuccessMessage("")} // Clear message on close
        message={successMessage}
      />
    </div>
  );
}
