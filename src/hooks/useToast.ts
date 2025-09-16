import { useState, useCallback, useEffect } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

const toastState: ToastState = { toasts: [] };
let listeners: Array<(state: ToastState) => void> = [];

const emit = () => {
  listeners.forEach((listener) => listener(toastState));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export const toast = {
  success: (message: string, duration = 3000) => {
    const newToast: Toast = {
      id: generateId(),
      message,
      type: "success",
      duration,
    };
    toastState.toasts.push(newToast);
    emit();

    if (duration > 0) {
      setTimeout(() => toast.dismiss(newToast.id), duration);
    }
  },

  error: (message: string, duration = 5000) => {
    const newToast: Toast = {
      id: generateId(),
      message,
      type: "error",
      duration,
    };
    toastState.toasts.push(newToast);
    emit();

    if (duration > 0) {
      setTimeout(() => toast.dismiss(newToast.id), duration);
    }
  },

  info: (message: string, duration = 3000) => {
    const newToast: Toast = {
      id: generateId(),
      message,
      type: "info",
      duration,
    };
    toastState.toasts.push(newToast);
    emit();

    if (duration > 0) {
      setTimeout(() => toast.dismiss(newToast.id), duration);
    }
  },

  warning: (message: string, duration = 4000) => {
    const newToast: Toast = {
      id: generateId(),
      message,
      type: "warning",
      duration,
    };
    toastState.toasts.push(newToast);
    emit();

    if (duration > 0) {
      setTimeout(() => toast.dismiss(newToast.id), duration);
    }
  },

  dismiss: (id: string) => {
    toastState.toasts = toastState.toasts.filter((toast) => toast.id !== id);
    emit();
  },
};

export const useToast = () => {
  const [state, setState] = useState(toastState);

  const subscribe = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    return subscribe(setState);
  }, [subscribe]);

  return {
    toasts: state.toasts,
    toast,
    dismiss: toast.dismiss,
  };
};
