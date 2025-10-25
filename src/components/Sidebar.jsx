import React, { useState, useEffect } from "react"; // Added useState, useEffect
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { db } from "../firebase"; // Import Firestore db
import { collection, query, where, getDocs } from "firebase/firestore"; // Import query tools

// NEW: Pass in `selectedFriend` prop to highlight the active friend
export default function Sidebar({
  activeView,
  setActiveView,
  onSelectFriend,
  isOpen,
  setIsOpen,
  selectedFriend, // New prop
}) {
  const { currentUser, logout } = useAuth();
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // This hook fetches friends from Firestore when the component loads
  // or when the currentUser's friends list changes
  useEffect(() => {
    // Check if we have the necessary data to fetch friends
    if (currentUser && currentUser.friends && currentUser.friends.length > 0) {
      setLoadingFriends(true);
      const fetchFriends = async () => {
        try {
          const usersRef = collection(db, "users");
          // Use a 'where in' query to get all friend documents in one go
          const q = query(usersRef, where("uid", "in", currentUser.friends));
          const querySnapshot = await getDocs(q);
          const friendsData = querySnapshot.docs.map((doc) => doc.data());
          setFriendsList(friendsData);
        } catch (err) {
          console.error("Failed to fetch friends:", err);
        }
        setLoadingFriends(false);
      };

      fetchFriends();
    } else {
      setFriendsList([]); // Clear list if no friends
    }
  }, [currentUser]); // Re-run when currentUser changes

  const sidebarVariants = {
    open: {
      width: "260px",
      transition: { type: "spring", damping: 20, stiffness: 100 },
    },
    closed: {
      width: "60px",
      transition: { type: "spring", damping: 20, stiffness: 100 },
    },
  };

  const textVariants = {
    open: { opacity: 1, x: 0, display: "block" },
    closed: { opacity: 0, x: -10, display: "none" },
  };

  const navItem = (icon, text, view) => (
    <li
      onClick={() => {
        setActiveView(view);
        // Deselect friend if we click Dashboard
        if (view === "dashboard") {
          onSelectFriend(null);
        }
      }}
      className={`
        flex items-center p-2 rounded-lg cursor-pointer
        hover:bg-gray-200 dark:hover:bg-gray-700
        ${
          activeView === view && !selectedFriend
            ? "bg-gray-200 dark:bg-gray-700"
            : ""
        }
      `}
    >
      {icon}
      <motion.span
        variants={textVariants}
        animate={isOpen ? "open" : "closed"}
        className="ml-3 overflow-hidden whitespace-nowrap"
      >
        {text}
      </motion.span>
    </li>
  );

  return (
    <motion.nav
      variants={sidebarVariants}
      animate={isOpen ? "open" : "closed"}
      className="relative flex flex-col h-full p-3 bg-white shadow-lg dark:bg-gray-800"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute z-10 p-1 bg-gray-200 rounded-full -right-3 top-9 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Main Nav */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="mb-4">
          {navItem(<LayoutDashboard size={20} />, "Dashboard", "dashboard")}
          {navItem(<Users size={20} />, "Friend Pools", "pools")}
        </div>

        {/* --- NEW FRIENDS LIST SECTION --- */}
        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
          <motion.span
            variants={textVariants}
            animate={isOpen ? "open" : "closed"}
            className="ml-3 text-xs font-semibold text-gray-400 uppercase"
          >
            Friends
          </motion.span>

          {loadingFriends && isOpen && (
            <span className="ml-3 text-sm text-gray-400">Loading...</span>
          )}

          {friendsList.map((friend) => (
            <li
              key={friend.uid}
              onClick={() => {
                setActiveView("pools"); // Ensure we are in the 'pools' view
                onSelectFriend(friend); // Set this friend as active
              }}
              className={`
                flex items-center p-2 rounded-lg cursor-pointer
                hover:bg-gray-200 dark:hover:bg-gray-700
                ${
                  /* Highlight if this friend is selected */
                  activeView === "pools" && selectedFriend?.uid === friend.uid
                    ? "bg-gray-200 dark:bg-gray-700"
                    : ""
                }
              `}
            >
              <User size={20} />
              <motion.span
                variants={textVariants}
                animate={isOpen ? "open" : "closed"}
                className="ml-3 overflow-hidden whitespace-nowrap"
              >
                {friend.name}
              </motion.span>
            </li>
          ))}
        </div>
        {/* --- END OF FRIENDS LIST SECTION --- */}
      </div>

      {/* User Info & Logout */}
      <div className="overflow-hidden">
        {/* ... (This part is unchanged) ... */}
        <div className="flex items-center p-2 border-t border-gray-200 dark:border-gray-700">
          <User className="flex-shrink-0" size={20} />
          <motion.div
            variants={textVariants}
            animate={isOpen ? "open" : "closed"}
            className="ml-3 overflow-hidden whitespace-nowrap"
          >
            <div className="text-sm font-medium truncate">
              {currentUser?.name || "User"}
            </div>
            <div className="text-xs text-gray-500 truncate dark:text-gray-400">
              {currentUser?.email}
            </div>
          </motion.div>
        </div>
        <li
          onClick={logout}
          className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <LogOut size={20} />
          <motion.span
            variants={textVariants}
            animate={isOpen ? "open" : "closed"}
            className="ml-3 overflow-hidden whitespace-nowrap"
          >
            Logout
          </motion.span>
        </li>
      </div>
    </motion.nav>
  );
}
