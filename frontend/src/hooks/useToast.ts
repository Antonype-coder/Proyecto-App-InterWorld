import { useUIStore } from '@store/uiStore';
import type { ToastVariant } from '@tipos/index';

export function useToast() {
  const toast = useUIStore((s) => s.toast);
  const showToast = useUIStore((s) => s.showToast);
  const hideToast = useUIStore((s) => s.hideToast);

  return {
    toast,
    showToast: (message: string, variant?: ToastVariant) =>
      showToast(message, variant),
    hideToast,
  };
}