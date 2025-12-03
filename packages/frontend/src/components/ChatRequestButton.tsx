import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { LoadingButton } from './LoadingButton';
import { Modal } from './Modal';
import { useModal } from '../hooks/useModal';

interface ChatRequestButtonProps {
  matchType: 'perfect' | 'partial_type1' | 'partial_type2';
  matchedUserId: string;
  matchId: string;
  onRequestSent?: () => void;
}

export const ChatRequestButton: React.FC<ChatRequestButtonProps> = ({
  matchType,
  matchedUserId,
  matchId,
  onRequestSent,
}) => {
  const navigate = useNavigate();
  const { modalState, showModal, closeModal } = useModal();
  const [chatStatus, setChatStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchChatStatus();
  }, [matchedUserId]);

  const fetchChatStatus = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/chats/status/${matchedUserId}`);
      setChatStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch chat status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      await api.post('/chat-requests', {
        recipientId: matchedUserId,
        matchId,
      });
      showModal('Request Sent!', 'Your chat request has been sent. You\'ll be notified when they respond.', 'success');
      if (onRequestSent) onRequestSent();
      fetchChatStatus();
    } catch (error: any) {
      showModal('Error', error.response?.data?.error || 'Failed to send chat request', 'error');
    }
  };

  const handleInitiateChat = async () => {
    try {
      const response = await api.post('/chats', { matchedUserId });
      navigate(`/chats/${response.data.id}`);
    } catch (error: any) {
      showModal('Error', error.response?.data?.error || 'Failed to create chat', 'error');
    }
  };

  const handleOpenChat = () => {
    if (chatStatus?.chatId) {
      navigate(`/chats/${chatStatus.chatId}`);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="flex-1 px-4 py-2 text-sm bg-gray-400 text-white rounded cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  // Chat already exists
  if (chatStatus?.status === 'active') {
    return (
      <LoadingButton
        onClick={handleOpenChat}
        className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Open Chat
      </LoadingButton>
    );
  }

  // Request already sent
  if (chatStatus?.status === 'request_sent') {
    return (
      <>
        <Modal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
        />
        <button
          disabled
          className="flex-1 px-4 py-2 text-sm bg-yellow-400 text-white rounded cursor-not-allowed"
        >
          Request Pending...
        </button>
      </>
    );
  }

  // Request received - can accept
  if (chatStatus?.status === 'request_received') {
    return (
      <>
        <Modal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
        />
        <LoadingButton
          onClick={handleInitiateChat}
          className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 animate-pulse"
        >
          Accept Chat Request
        </LoadingButton>
      </>
    );
  }

  // Non-privileged (partial_type1) - send request
  if (matchType === 'partial_type1' || chatStatus?.matchType === 'partial_type1') {
    return (
      <>
        <Modal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
        />
        <LoadingButton
          onClick={handleSendRequest}
          className="flex-1 px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Send Chat Request
        </LoadingButton>
      </>
    );
  }

  // Privileged (partial_type2) or perfect match ready - initiate directly
  if (matchType === 'partial_type2' || chatStatus?.matchType === 'partial_type2' || chatStatus?.status === 'both_ready') {
    return (
      <>
        <Modal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
        />
        <LoadingButton
          onClick={handleInitiateChat}
          className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start Chat
        </LoadingButton>
      </>
    );
  }

  // Perfect match - waiting for other
  if (matchType === 'perfect' || chatStatus?.status === 'waiting_for_other') {
    return (
      <>
        <Modal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
        />
        <LoadingButton
          onClick={handleSendRequest}
          className="flex-1 px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Send Chat Request
        </LoadingButton>
      </>
    );
  }

  // Default - can initiate
  return (
    <>
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
      <LoadingButton
        onClick={handleInitiateChat}
        className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Start Chat
      </LoadingButton>
    </>
  );
};
