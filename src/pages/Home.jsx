import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Dashboard from "../components/Dashboard";
import PoolItem from "../components/PoolItem";
import AddPoolModal from "../components/AddPoolModal";
import DeleteAccountModal from "../components/DeleteAccountModal";
import InfoModal from "../components/InfoModal";
import ChatWindow from "../components/ChatWindow";
import { useAuth } from "../context/AuthContext";
import { db, auth } from "../firebase";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
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
// --- CHANGE 1: Replaced 'Menu' with 'ChevronRight' ---
import { Plus, UserPlus, MessageCircle, ChevronRight } from "lucide-react";
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
  const [chattingWith, setChattingWith] = useState(null);

  const { currentUser, deleteUserAccount } = useAuth();

  const getPoolId = (uid1, uid2) => [uid1, uid2].sort().join("_");

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
      setSuccessMessage("Friend request sent!");
    } catch (err) {
      setFriendError("Failed to send request. " + err.message);
    }
  };

  useEffect(() => {
    if (!selectedFriend || !currentUser || activeView !== "pools") {
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
  }, [selectedFriend, currentUser, activeView]);

  const handleOpenDeleteModal = () => {
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (password) => {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found.");
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteUserAccount();
      setIsDeleteModalOpen(false);
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setDeleteError("Wrong password. Please try again.");
      } else {
        setDeleteError(`Failed to delete account. ${err.message}`);
      }
    }
    setDeleteLoading(false);
  };

  const handleCloseChat = () => {
    setChattingWith(null);
    setSelectedFriend(null);
    setActiveView("pools");
  };

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard onOpenDeleteModal={handleOpenDeleteModal} />;
      case "chat":
        if (!chattingWith) {
          setActiveView("pools");
          return (
            <p className="p-4 text-center text-red-500">
              Error: No chat selected.
            </p>
          );
        }
        return (
          <div className="h-full flex flex-col">
            <ChatWindow friend={chattingWith} onCloseChat={handleCloseChat} />
          </div>
        );
      case "pools":
      default:
        return (
          <div className="p-4 md:p-8">
            {!selectedFriend && (
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
              </div>
            )}

            {selectedFriend ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-center sm:text-left">
                    Pool with {selectedFriend.name}
                  </h2>

                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    >
                      <Plus size={16} /> Add Expense
                    </button>
                    <button
                      onClick={() => {
                        setChattingWith(selectedFriend);
                        setActiveView("chat");
                      }}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                      aria-label={`Chat with ${selectedFriend.name}`}
                    >
                      <MessageCircle size={16} /> Chat
                    </button>
                  </div>
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
              !chattingWith && (
                <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                  <p>
                    Select a friend from the sidebar to view their expense pool
                    or start a chat.
                  </p>
                  <p className="text-sm">
                    Or, go to Dashboard to manage friend requests.
                  </p>
                </div>
              )
            )}
          </div>
        );
    }
  };

  return (
    <div className="relative h-screen w-full flex overflow-hidden">
      {/* Sidebar for Desktop (always visible) */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onSelectFriend={setSelectedFriend}
          onSelectChatFriend={setChattingWith}
          setIsOpen={setIsSidebarOpen}
          selectedFriend={selectedFriend}
          chattingWith={chattingWith}
        />
      </div>

      {/* Sidebar for Mobile (sliding) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            className="absolute z-20 h-full lg:hidden"
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Sidebar
              activeView={activeView}
              setActiveView={setActiveView}
              onSelectFriend={setSelectedFriend}
              onSelectChatFriend={setChattingWith}
              setIsOpen={setIsSidebarOpen}
              selectedFriend={selectedFriend}
              chattingWith={chattingWith}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="absolute inset-0 z-10 bg-black opacity-50 lg:hidden"
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div
              className="absolute bottom-4 left-4 z-10 lg:hidden"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-white rounded-full shadow dark:bg-gray-800"
              >
                <ChevronRight size={24} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {renderContent()}
      </main>

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
        isOpen={!!successMessage}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
      />
    </div>
  );
}
