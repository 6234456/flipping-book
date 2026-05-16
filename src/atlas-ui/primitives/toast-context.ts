import { createContext } from 'react';

export type ToastVariant = 'default' | 'success' | 'error';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export type ToastOptions = {
  duration?: number;
  variant?: ToastVariant;
};

export type ToastFn = (message: string, options?: ToastOptions) => void;

export const ToastContext = createContext<ToastFn | null>(null);
