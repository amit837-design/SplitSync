import React from "react";
import { db } from "../firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function PoolItem({ item, poolId }) {
  const { currentUser } = useAuth();

  // Determine if the current user added this item
  const isOurs = item.addedBy === currentUser.uid;

  // Get the name and initial for the avatar
  const addedByName = isOurs ? "You" : item.addedByName || "Friend";
  const initials = addedByName.charAt(0).toUpperCase();

  const avatarColor = isOurs
    ? "bg-blue-500 text-white"
    : "bg-gray-500 text-white";
  const borderColor = isOurs
    ? "border-l-4 border-blue-500"
    : "border-l-4 border-gray-400";
  const doneBgColor = item.done
    ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600";

  // Function to toggle the 'done' status
  const handleToggleDone = async () => {
    const poolDocRef = doc(db, "pools", poolId);
    try {
      const docSnap = await getDoc(poolDocRef);
      if (docSnap.exists()) {
        const expenses = docSnap.data().expenses || [];
        // Find and update the specific item
        const updatedExpenses = expenses.map((expense) =>
          expense.id === item.id ? { ...expense, done: !expense.done } : expense
        );
        // Write the new array back to Firestore
        await updateDoc(poolDocRef, {
          expenses: updatedExpenses,
        });
      }
    } catch (err) {
      console.error("Error updating document: ", err);
    }
  };

  return (
    <div
      className={`
      flex items-center p-4 mb-3 bg-white rounded-lg shadow-sm
      dark:bg-gray-800 transition-opacity
      ${borderColor} 
      ${item.done ? "opacity-40" : "opacity-100"}
    `}
    >
      {/* Avatar Indicator */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${avatarColor}`}
      >
        {initials}
      </div>

      {/* Expense Details */}
      <div className="flex-1 min-w-0 mx-4">
        <p className="text-lg font-semibold">₹{item.amount.toFixed(2)}</p>
        <p className="text-sm text-gray-600 truncate dark:text-gray-400">
          {item.reason}
        </p>
        <p className="text-xs text-gray-500">Added by {addedByName}</p>
      </div>

      {/* Done Button */}
      <div className="flex items-center ml-auto">
        <button
          onClick={handleToggleDone}
          className={`p-2 rounded-full transition-colors ${doneBgColor}`}
          title={item.done ? "Mark as Not Done" : "Mark as Done"}
        >
          <Check size={16} />
        </button>
      </div>
    </div>
  );
}
