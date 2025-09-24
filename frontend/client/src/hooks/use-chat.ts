import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChatSession, ChatMessage } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useChat() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [emotionalState, setEmotionalState] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get chat sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/v1/chat/sessions'],
    queryFn: api.getChatSessions,
  });

  // Get current chat session
  const { data: currentSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ['/api/v1/chat/sessions', currentSessionId],
    queryFn: () => currentSessionId ? api.getChatSession(currentSessionId) : null,
    enabled: !!currentSessionId,
  });

  // Start new chat session
  const startSessionMutation = useMutation({
    mutationFn: ({ message, emotional_state }: { message: string; emotional_state?: string }) =>
      api.startChatSession({ initial_message: message, emotional_state }),
    onSuccess: (session: ChatSession) => {
      setCurrentSessionId(session.id);
      queryClient.invalidateQueries({ queryKey: ['/api/v1/chat/sessions'] });
      toast({
        title: "Chat started",
        description: "Your conversation with the AI assistant has begun.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start chat",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: string; message: string }) =>
      api.sendChatMessage(sessionId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/chat/sessions', currentSessionId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // End session
  const endSessionMutation = useMutation({
    mutationFn: api.endChatSession,
    onSuccess: () => {
      setCurrentSessionId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/v1/chat/sessions'] });
      toast({
        title: "Chat ended",
        description: "Your chat session has been ended.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to end chat",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const startNewChat = (message: string, emotional_state?: string) => {
    startSessionMutation.mutate({ message, emotional_state });
  };

  const sendMessage = (message: string) => {
    if (currentSessionId) {
      sendMessageMutation.mutate({ sessionId: currentSessionId, message });
    }
  };

  const endCurrentSession = () => {
    if (currentSessionId) {
      endSessionMutation.mutate(currentSessionId);
    }
  };

  const loadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  return {
    sessions,
    currentSession,
    currentSessionId,
    emotionalState,
    setEmotionalState,
    isLoadingSessions,
    isLoadingSession,
    startNewChat,
    sendMessage,
    endCurrentSession,
    loadSession,
    isStartingSession: startSessionMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isEndingSession: endSessionMutation.isPending,
  };
}
