import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { Timestamp } from "firebase/firestore";
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { X } from "lucide-react";

const AddPoolModal = ({ isOpen, onClose, friendEmail, friendUid }) => {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

  // Generate consistent pool ID from two UIDs
  const getPoolId = (uid1, uid2) => [uid1, uid2].sort().join("_");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!friendUid) return setError("No friend selected.");
    setLoading(true);
    setError("");

    const poolId = getPoolId(currentUser.uid, friendUid);
    const poolDocRef = doc(db, "pools", poolId);

    const newExpense = {
      id: new Date().toISOString(),
      amount: parseFloat(amount),
      reason: reason || "No reason",
      done: false,
      createdAt: Timestamp.now(),
      addedBy: currentUser.uid,
      addedByName: currentUser.name,
    };

    try {
      const docSnap = await getDoc(poolDocRef);

      if (!docSnap.exists()) {
        await setDoc(poolDocRef, {
          users: [currentUser.uid, friendUid],
          expenses: [newExpense],
        });
      } else {
        await updateDoc(poolDocRef, {
          expenses: arrayUnion(newExpense),
        });
      }

      setAmount("");
      setReason("");
      onClose();
    } catch (err) {
      setError("Failed to add expense: " + err.message);
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()} // prevent modal close on inner click
          >
            <button
              onClick={onClose}
              className="absolute p-1 rounded-full top-3 right-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>

            <h3 className="mb-6 text-xl font-semibold">
              Add Expense with {friendEmail || "Friend"}
            </h3>

            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="amount"
                  className="block mb-2 text-sm font-medium"
                >
                  Amount (₹)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="block mb-2 text-sm font-medium"
                >
                  Reason (optional)
                </label>
                <input
                  type="text"
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Snacks, Taxi fare"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Expense"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddPoolModal;
