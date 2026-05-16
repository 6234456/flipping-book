import { useContext } from 'react';
import { ToastContext, type ToastFn } from './toast-context';

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
}
