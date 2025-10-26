import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";

export default function InfoModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;

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
            className="relative w-full max-w-sm p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute p-1 rounded-full top-3 right-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-green-100 rounded-full dark:bg-green-900/50">
                <CheckCircle
                  size={24}
                  className="text-green-600 dark:text-green-400"
                />
              </div>

              <h3 className="mt-4 mb-2 text-xl font-semibold">Success!</h3>
              <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>

              <button
                onClick={onClose}
                className="w-full px-5 py-2.5 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
