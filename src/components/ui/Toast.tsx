import { X } from 'lucide-react';
import type { Toast as ToastType } from '@/hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const getToastStyles = (type: ToastType['type']) => {
    const baseStyles = "flex items-center justify-between p-4 mb-2 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 translate-x-0";

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-l-green-400 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-l-red-400 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-l-yellow-400 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-l-blue-400 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-l-gray-400 text-gray-800`;
    }
  };

  const getIcon = (type: ToastType['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className={getToastStyles(toast.type)}>
      <div className="flex items-center">
        <span className="mr-2 text-lg">{getIcon(toast.type)}</span>
        <span className="font-medium">{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="토스트 닫기"
      >
        <X size={16} />
      </button>
    </div>
  );
}