import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { currentUser, updateProfileName } = useAuth();
  const [name, setName] = useState(currentUser?.name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name === currentUser.name) {
      return setMessage("Name is already set to this.");
    }
    try {
      setMessage("");
      setLoading(true);
      await updateProfileName(name);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setMessage("Failed to update profile. " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-xl p-6 mx-auto bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-6 text-2xl font-bold">Profile Dashboard</h2>
        {message && (
          <div
            className={`p-3 mb-4 text-sm rounded-lg ${
              message.includes("Failed")
                ? "text-red-700 bg-red-100 dark:bg-red-200 dark:text-red-800"
                : "text-green-700 bg-green-100 dark:bg-green-200 dark:text-green-800"
            }`}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
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
    </div>
  );
}
