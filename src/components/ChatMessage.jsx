import React from "react";
import { useAuth } from "../context/AuthContext";

const ChatMessage = ({ message }) => {
  const { currentUser } = useAuth();
  const isSender = message.senderId === currentUser.uid;

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return "";
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Error formatting timestamp:", timestamp);
      return "";
    }
  };

  return (
    <div className={`flex mb-3 ${isSender ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-lg px-4 py-2 max-w-[70%] break-words ${
          isSender
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <p
          className={`text-xs mt-1 text-right opacity-75 ${
            isSender ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {formatTimestamp(message.createdAt)}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
