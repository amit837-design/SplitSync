import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { AlertTriangle } from "lucide-react";
// DELETED: import DeleteAccountModal from "./DeleteAccountModal";

// NEW: Accept 'onOpenDeleteModal' as a prop
export default function Dashboard({ onOpenDeleteModal }) {
  const {
    currentUser,
    updateProfileName,
    acceptFriendRequest,
    declineFriendRequest,
  } = useAuth(); // DELETED: deleteUserAccount (Home will handle it)

  const [name, setName] = useState(currentUser?.name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // DELETED: All 'delete' related state (isDeleteModalOpen, deleteError, deleteLoading)

  // (useEffect for fetching requests is unchanged)
  useEffect(() => {
    if (
      !currentUser?.pendingRequests ||
      currentUser.pendingRequests.length === 0
    ) {
      setRequests([]);
      return;
    }
    const fetchRequests = async () => {
      setLoadingRequests(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("uid", "in", currentUser.pendingRequests)
        );
        const querySnapshot = await getDocs(q);
        const requestData = querySnapshot.docs.map((doc) => doc.data());
        setRequests(requestData);
      } catch (err) {
        console.error("Failed to fetch requests:", err);
      }
      setLoadingRequests(false);
    };
    fetchRequests();
  }, [currentUser?.pendingRequests]);

  // (handleProfileSubmit is unchanged)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (name === currentUser.name && !message) {
      return setMessage("Name is already set to this.");
    }
    try {
      setMessage("");
      setLoading(true);
      await updateProfileName(name);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage(`Failed to update profile. ${err.message}`);
    }
    setLoading(false);
  };

  // (handleAccept is unchanged)
  const handleAccept = async (friendUid) => {
    try {
      await acceptFriendRequest(friendUid);
    } catch (err) {
      alert("Failed to accept request: " + err.message);
    }
  };

  // (handleDecline is unchanged)
  const handleDecline = async (friendUid) => {
    try {
      await declineFriendRequest(friendUid);
    } catch (err) {
      alert("Failed to decline request: " + err.message);
    }
  };

  // DELETED: handleConfirmDelete function

  // NOTE: We don't need <></> wrapper anymore
  return (
    <div className="p-4 md:p-8">
      {/* Profile Update Card (unchanged) */}
      <div className="max-w-xl p-6 mx-auto mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        {/* ... (all profile form code is unchanged) ... */}
        <h2 className="mb-6 text-2xl font-bold">Profile Dashboard</h2>
        {message && (
          <div
            className={`p-3 mb-4 text-sm rounded-lg ${
              message.includes("Failed") || message.includes("try again")
                ? "text-red-700 bg-red-100 dark:bg-red-200 dark:text-red-800"
                : "text-green-700 bg-green-100 dark:bg-green-200 dark:text-green-800"
            }`}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium">
              Email (read-only)
            </label>
            <input
              type="email"
              id="email"
              value={currentUser?.email || ""}
              className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed dark:bg-gray-700 dark:border-gray-600"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="w-full px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Friend Requests Card (unchanged) */}
      <div className="max-w-xl p-6 mx-auto mb-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        {/* ... (all friend request code is unchanged) ... */}
        <h2 className="mb-6 text-2xl font-bold">Friend Requests</h2>
        {loadingRequests ? (
          <p className="text-gray-500 dark:text-gray-400">
            Loading requests...
          </p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No pending friend requests.
          </p>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req.uid}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-700 gap-3"
              >
                <div>
                  <p className="font-medium">{req.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {req.email}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleAccept(req.uid)}
                    className="px-3 py-1 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(req.uid)}
                    className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-500 dark:text-white dark:hover:bg-gray-600"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- DANGER ZONE CARD (MODIFIED) --- */}
      <div className="max-w-xl p-6 mx-auto bg-white border-2 border-red-500 rounded-lg shadow-md dark:bg-gray-800 dark:border-red-600">
        <h2 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-500">
          Danger Zone
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium">Delete your account</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action is permanent and cannot be undone.
            </p>
          </div>
          {/* MODIFIED: This button now calls the prop */}
          <button
            onClick={onOpenDeleteModal}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 dark:bg-red-700 dark:hover:bg-red-800"
          >
            <span className="flex items-center justify-center gap-2">
              <AlertTriangle size={16} /> Delete Account
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
