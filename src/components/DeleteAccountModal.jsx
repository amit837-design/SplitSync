import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirmDelete,
  loading,
  error,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute p-1 rounded-full top-3 right-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={loading}
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/50">
                <AlertTriangle
                  size={24}
                  className="text-red-600 dark:text-red-400"
                />
              </div>

              <h3 className="mt-4 mb-2 text-xl font-semibold">Are you sure?</h3>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                This will permanently delete your account, your user data, and
                all shared pool history. This action cannot be undone.
              </p>

              {error && (
                <div className="p-3 mb-4 w-full text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
                  {error}
                </div>
              )}

              <div className="flex justify-center w-full gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirmDelete}
                  disabled={loading}
                  className="w-full px-5 py-2.5 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
