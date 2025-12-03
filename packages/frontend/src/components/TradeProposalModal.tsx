import React, { useState } from 'react';
import { LoadingButton } from './LoadingButton';

interface Book {
  id: string;
  title: string;
  author: string;
  condition: string;
  hasActiveLock?: boolean;
  isAvailable?: boolean;
}

interface TradeProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBooks: Book[];
  matchedUserBooks: Book[];
  matchedUserName: string;
  onSubmit: (offeredBookIds: string[], requestedBookIds: string[]) => Promise<void>;
  existingOffered?: string[];
  existingRequested?: string[];
}

export const TradeProposalModal: React.FC<TradeProposalModalProps> = ({
  isOpen,
  onClose,
  userBooks,
  matchedUserBooks,
  matchedUserName,
  onSubmit,
  existingOffered = [],
  existingRequested = [],
}) => {
  const [offeredBookIds, setOfferedBookIds] = useState<string[]>(existingOffered);
  const [requestedBookIds, setRequestedBookIds] = useState<string[]>(existingRequested);
  const [error, setError] = useState('');

  const toggleOffered = (bookId: string) => {
    setOfferedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
    setError('');
  };

  const toggleRequested = (bookId: string) => {
    setRequestedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    );
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (offeredBookIds.length === 0) {
      setError('Please select at least one book to offer');
      return;
    }
    if (requestedBookIds.length === 0) {
      setError('Please select at least one book to request');
      return;
    }

    try {
      await onSubmit(offeredBookIds, requestedBookIds);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit trade proposal');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 transform transition-all max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Propose Trade</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instructions:</strong> Select books you want to offer (green) and books you want to request (blue). You must select at least one of each.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Your Books (Offered) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📚 Your Books (Select to Offer)
              </h3>
              {userBooks.length === 0 ? (
                <p className="text-gray-500 text-sm">No books available</p>
              ) : (
                <div className="space-y-2">
                  {userBooks.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => toggleOffered(book.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        offeredBookIds.includes(book.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <p className="font-medium text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-600">by {book.author}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Condition: {book.condition}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">
                Selected: {offeredBookIds.length} book(s)
              </p>
            </div>

            {/* Their Books (Requested) */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                📖 {matchedUserName}'s Books (Select to Request)
              </h3>
              {matchedUserBooks.length === 0 ? (
                <p className="text-gray-500 text-sm">No books available</p>
              ) : (
                <div className="space-y-2">
                  {matchedUserBooks.map((book) => {
                    const isLocked = book.hasActiveLock || !book.isAvailable;
                    return (
                      <button
                        key={book.id}
                        onClick={() => !isLocked && toggleRequested(book.id)}
                        disabled={isLocked}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          isLocked
                            ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                            : requestedBookIds.includes(book.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{book.title}</p>
                            <p className="text-sm text-gray-600">by {book.author}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Condition: {book.condition}
                            </p>
                          </div>
                          {isLocked && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                              🔒 Locked
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">
                Selected: {requestedBookIds.length} book(s)
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <LoadingButton
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              loadingText="Submitting..."
            >
              Submit Proposal
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
};
