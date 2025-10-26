import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  ChevronLeft, // For the close button
  User,
  LogOut,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { db } from "../firebase"; // Import Firestore db
import { collection, query, where, getDocs } from "firebase/firestore"; // Import query tools

export default function Sidebar({
  activeView,
  setActiveView,
  onSelectFriend,
  isOpen, // This prop is used by Home.jsx
  setIsOpen, // This prop is used by Home.jsx
  selectedFriend, // New prop
}) {
  const { currentUser, logout } = useAuth();
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Check for pending requests for the notification badge
  const hasPendingRequests = currentUser?.pendingRequests?.length > 0;

  // This hook fetches friends from Firestore
  useEffect(() => {
    if (currentUser && currentUser.friends && currentUser.friends.length > 0) {
      setLoadingFriends(true);
      const fetchFriends = async () => {
        try {
          const usersRef = collection(db, "users");
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
  }, [currentUser?.friends]); // Re-run when the friends list changes

  // Variants for the text, to fade in/out (no width animation)
  const textVariants = {
    open: { opacity: 1, x: 0, display: "block" },
    closed: { opacity: 0, x: -10, display: "none" },
  };

  // Standard nav item
  const navItem = (icon, text, view) => (
    <li
      onClick={() => {
        setActiveView(view);
        if (view === "dashboard") {
          onSelectFriend(null);
        }
        setIsOpen(false); // Close sidebar on selection
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
      <div className="relative">
        {icon}
        {/* Notification Badge */}
        {view === "dashboard" && hasPendingRequests && (
          <span className="absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
        )}
      </div>
      <span className="ml-3 overflow-hidden whitespace-nowrap">{text}</span>
    </li>
  );

  return (
    // This nav is always 260px wide. Home.jsx animates its position.
    <nav className="relative flex flex-col h-full p-3 bg-white shadow-lg dark:bg-gray-800 w-[260px]">
      {/* This is the close button *inside* the sidebar */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute z-10 p-1 bg-gray-200 rounded-full -right-3 top-9 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Main Nav */}
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="mb-4">
          {navItem(<LayoutDashboard size={20} />, "Dashboard", "dashboard")}
          {navItem(<Users size={20} />, "Friend Pools", "pools")}
        </div>

        {/* --- FRIENDS LIST SECTION --- */}
        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="ml-3 text-xs font-semibold text-gray-400 uppercase">
            Friends
          </span>

          {loadingFriends && (
            <span className="ml-3 text-sm text-gray-400">Loading...</span>
          )}

          {friendsList.map((friend) => (
            <li
              key={friend.uid}
              onClick={() => {
                setActiveView("pools");
                onSelectFriend(friend);
                setIsOpen(false); // Close sidebar on selection
              }}
              className={`
                flex items-center p-2 rounded-lg cursor-pointer
                hover:bg-gray-200 dark:hover:bg-gray-700
                ${
                  activeView === "pools" && selectedFriend?.uid === friend.uid
                    ? "bg-gray-200 dark:bg-gray-700"
                    : ""
                }
              `}
            >
              <User size={20} />
              <span className="ml-3 overflow-hidden whitespace-nowrap">
                {friend.name}
              </span>
            </li>
          ))}
        </div>
        {/* --- END OF FRIENDS LIST SECTION --- */}
      </div>

      {/* User Info & Logout */}
      <div className="overflow-hidden">
        <div className="flex items-center p-2 border-t border-gray-200 dark:border-gray-700">
          <User className="flex-shrink-0" size={20} />
          <div className="ml-3 overflow-hidden whitespace-nowrap">
            <div className="text-sm font-medium truncate">
              {currentUser?.name || "User"}
            </div>
            <div className="text-xs text-gray-500 truncate dark:text-gray-400">
              {currentUser?.email}
            </div>
          </div>
        </div>
        <li
          onClick={() => {
            logout();
            setIsOpen(false); // Close sidebar on logout
          }}
          className="flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <LogOut size={20} />
          <span className="ml-3 overflow-hidden whitespace-nowrap">Logout</span>
        </li>
      </div>
    </nav>
  );
}
