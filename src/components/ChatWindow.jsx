import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from "firebase/firestore";
import { Send, X } from "lucide-react";

function ChatMessage({ message }) {
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
    } catch {
      return "";
    }
  };

  return (
    <div className={`flex mb-3 ${isSender ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-4 py-2 max-w-[75%] break-words shadow-sm ${
          isSender
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-100 border border-gray-700"
        }`}
      >
        <p className="text-sm">{message.text}</p>
        <p
          className={`text-xs mt-1 text-right opacity-70 ${
            isSender ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {formatTimestamp(message.createdAt)}
        </p>
      </div>
    </div>
  );
}

export default function ChatWindow({ friend, onCloseChat }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const getChatId = (uid1, uid2) => [uid1, uid2].sort().join("_");
  const chatId = getChatId(currentUser.uid, friend.uid);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setLoading(true);
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"), limit(50));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgs);
        setLoading(false);
      },
      () => {
        setError("Could not load messages.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const chatDocRef = doc(db, "chats", chatId);
    setLoading(true);

    try {
      await addDoc(messagesRef, {
        text: trimmed,
        senderId: currentUser.uid,
        senderName: currentUser.name || currentUser.displayName || "User",
        createdAt: serverTimestamp(),
      });

      await setDoc(
        chatDocRef,
        {
          users: [currentUser.uid, friend.uid],
          lastMessage: {
            text: trimmed,
            senderId: currentUser.uid,
            timestamp: serverTimestamp(),
          },
        },
        { merge: true }
      );

      setNewMessage("");
    } catch {
      setError("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 shadow-xl rounded-lg border border-gray-800">
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-gray-100 truncate">
          Chat with {friend.name}
        </h2>
        <button
          onClick={onCloseChat}
          className="p-2 text-gray-400 rounded-lg hover:bg-gray-800 hover:text-white transition"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-900">
        {loading && messages.length === 0 && (
          <p className="text-center text-gray-500">Loading messages...</p>
        )}
        {!loading && error && (
          <p className="text-center text-red-500">{error}</p>
        )}
        {!loading && !error && messages.length === 0 && (
          <p className="text-center text-gray-500">No messages yet. Say hi!</p>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <div className="flex justify-end w-full">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-9/10 p-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoComplete="off"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="p-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-1 focus:ring-blue-400 disabled:opacity-50 transition"
            disabled={!newMessage.trim() || loading}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
