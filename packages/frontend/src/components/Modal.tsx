import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getIconAndColor = () => {
    switch (type) {
      case 'error':
        return { icon: '❌', color: 'red' };
      case 'warning':
        return { icon: '⚠️', color: 'yellow' };
      case 'success':
        return { icon: '✅', color: 'green' };
      case 'confirm':
        return { icon: '❓', color: 'blue' };
      default:
        return { icon: 'ℹ️', color: 'blue' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div
              className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center text-2xl`}
            >
              {icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-600 text-center mb-6">{message}</p>

          {/* Buttons */}
          <div className="flex gap-3">
            {type === 'confirm' && onConfirm ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-${color}-600 rounded-md hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-${color}-500`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`w-full px-4 py-2 text-sm font-medium text-white bg-${color}-600 rounded-md hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-${color}-500`}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
