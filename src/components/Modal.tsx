import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps { isOpen: boolean; onClose: () => void; children: React.ReactNode; }
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        key="backdrop"
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
    )}
    {isOpen && (
      <motion.div
        key="content"
        className="modal-content"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);