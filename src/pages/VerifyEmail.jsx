import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";

export default function VerifyEmail() {
  const { logout } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    setMessage("");
    try {
      await sendEmailVerification(auth.currentUser);
      setMessage("A new verification link has been sent to your email.");
    } catch (err) {
      setMessage("Failed to send verification email. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-full p-4">
      <div className="w-full max-w-md p-8 space-y-3 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold">Verify Your Email</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          A verification link has been sent to your email address. Please click
          the link to activate your account.
        </p>
        <p className="text-sm text-gray-500">
          (Note: You may need to refresh the page after verifying.)
        </p>
        <p className="font-bold text-sm">
          Don't forget to check your spam folder
        </p>

        {message && (
          <div className="p-3 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800">
            {message}
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Resend Verification Email"}
        </button>

        <button
          onClick={logout}
          className="w-full px-5 py-2.5 text-sm font-medium text-center text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
