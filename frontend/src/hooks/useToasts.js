import { useEffect, useState } from "react";

let toastIdSeq = 0;
const toastSubscribers = new Set();
let toastSnapshot = [];

const publishToasts = () => {
  toastSubscribers.forEach((fn) => fn(toastSnapshot));
};

export const showToast = (message, variant = "success") => {
  const id = ++toastIdSeq;
  toastSnapshot = [...toastSnapshot, { id, message, variant }];
  publishToasts();
  setTimeout(() => {
    toastSnapshot = toastSnapshot.filter((t) => t.id !== id);
    publishToasts();
  }, 3000);
};

export const useToasts = () => {
  const [toasts, setToasts] = useState(toastSnapshot);
  useEffect(() => {
    const fn = (snap) => setToasts(snap);
    toastSubscribers.add(fn);
    return () => toastSubscribers.delete(fn);
  }, []);
  return toasts;
};
