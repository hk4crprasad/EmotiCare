import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  AlertTriangle, 
  Heart,
  Lightbulb,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { api } from '../../lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatSession {
  id: string;
  chat_title: string;
  emotional_state: string;
  status: string;
  created_at: string;
  message_count: number;
  messages?: Message[];
}

export function ChatInterface() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newSessionData, setNewSessionData] = useState({
    initial_message: '',
    emotional_state: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatSessions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatSessions = async () => {
    try {
      console.log('Loading chat sessions...');
      const sessions = await api.getChatSessions();
      console.log('Chat sessions loaded:', sessions);
      setSessions(sessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      console.log('Loading session messages for:', sessionId);
      const session = await api.getChatSession(sessionId);
      console.log('Session loaded:', session);
      setCurrentSession(session);
      setMessages(session.messages || []);
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  };

  const startNewSession = async () => {
    if (!newSessionData.initial_message || !newSessionData.emotional_state) return;

    setIsLoading(true);
    try {
      console.log('Starting new session with data:', newSessionData);
      const session = await api.startChatSession(
        newSessionData.initial_message,
        newSessionData.emotional_state
      );
      console.log('Session started successfully:', session);
      setCurrentSession(session);
      setMessages(session.messages || []);
      setShowNewSessionForm(false);
      setNewSessionData({ initial_message: '', emotional_state: '' });
      await loadChatSessions();
    } catch (error) {
      console.error('Error starting new session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(currentSession.id, newMessage);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check for intervention requirements
      if (response.requires_intervention) {
        // Show emergency resources or alert
        console.log('Intervention required:', response);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      await api.endChatSession(currentSession.id);
      setCurrentSession(null);
      setMessages([]);
      await loadChatSessions();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const getEmotionalStateColor = (state: string) => {
    const colors: { [key: string]: string } = {
      very_distressed: 'bg-red-100 text-red-800',
      distressed: 'bg-orange-100 text-orange-800',
      neutral: 'bg-gray-100 text-gray-800',
      calm: 'bg-blue-100 text-blue-800',
      positive: 'bg-green-100 text-green-800',
      // Legacy values for backward compatibility
      anxious: 'bg-yellow-100 text-yellow-800',
      depressed: 'bg-blue-100 text-blue-800',
      stressed: 'bg-red-100 text-red-800',
      angry: 'bg-orange-100 text-orange-800',
      sad: 'bg-gray-100 text-gray-800',
      happy: 'bg-green-100 text-green-800'
    };
    return colors[state] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-full flex overflow-hidden bg-background relative">
      {/* Sidebar with chat sessions */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-300 border-r bg-muted/30 flex flex-col overflow-hidden shrink-0`}>
        <div className={`${sidebarCollapsed ? 'hidden' : 'block'} h-full flex flex-col`}>
          <div className="p-4 border-b bg-background/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Chat Sessions</h2>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewSessionForm(true)}
                  disabled={showNewSessionForm}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered emotional support conversations
            </p>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
            {showNewSessionForm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">New Session</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      How are you feeling?
                    </label>
                    <Select
                      value={newSessionData.emotional_state}
                      onValueChange={(value: string) => 
                        setNewSessionData(prev => ({ ...prev, emotional_state: value }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very_distressed">Very Distressed</SelectItem>
                        <SelectItem value="distressed">Distressed</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="positive">Positive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">
                      What's on your mind?
                    </label>
                    <Textarea
                      placeholder="Tell me what's bothering you..."
                      value={newSessionData.initial_message}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                        setNewSessionData(prev => ({ ...prev, initial_message: e.target.value }))
                      }
                      className="h-20 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={startNewSession}
                      disabled={isLoading || !newSessionData.initial_message || !newSessionData.emotional_state}
                      className="flex-1"
                    >
                      Start Chat
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowNewSessionForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {sessions.map((session) => (
              <Card 
                key={session.id}
                className={`cursor-pointer transition-all duration-200 hover:bg-accent/60 hover:shadow-md ${
                  currentSession?.id === session.id ? 'bg-accent border-primary shadow-sm ring-1 ring-primary/20' : 'hover:border-accent-foreground/20'
                }`}
                onClick={() => loadSessionMessages(session.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      variant="outline" 
                      className={`${getEmotionalStateColor(session.emotional_state)} text-xs px-2 py-1`}
                    >
                      {session.emotional_state}
                    </Badge>
                    <Badge 
                      variant={session.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs px-2 py-1"
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-medium mb-2 line-clamp-2 leading-relaxed">
                    {session.chat_title || 'New Chat Session'}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {session.message_count} messages
                    </span>
                    <span>
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </ScrollArea>
        </div>
        </div>
      </div>

      {/* Sidebar toggle button */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute top-4 right-4 z-10 h-8 w-8 p-0 bg-background/90 backdrop-blur-sm border shadow-md hover:bg-accent"
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
        {currentSession ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur-sm flex-shrink-0 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">{currentSession.chat_title || 'Chat Session'}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getEmotionalStateColor(currentSession.emotional_state)}>
                      {currentSession.emotional_state}
                    </Badge>
                    <Badge variant={currentSession.status === 'active' ? 'default' : 'secondary'}>
                      {currentSession.status}
                    </Badge>
                  </div>
                  {currentSession.status === 'active' && (
                    <Button variant="outline" size="sm" onClick={endSession}>
                      End Session
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden bg-muted/20 min-h-0">
              <ScrollArea className="h-full">
                <div className="p-6 min-h-full">
                  <div className="space-y-6 max-w-4xl mx-auto min-h-full flex flex-col justify-end">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-background border shadow-sm'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.timestamp && (
                            <p className="text-xs opacity-70 mt-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-background border rounded-2xl px-4 py-3 shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <p className="text-sm text-muted-foreground">AI is thinking...</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Message input */}
            {currentSession.status === 'active' && (
              <div className="p-4 border-t bg-background/95 backdrop-blur-sm flex-shrink-0 shadow-sm">
                <div className="flex gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message... (Press Enter to send)"
                      value={newMessage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && sendMessage()}
                      disabled={isLoading}
                      className="h-12 pr-12 text-sm rounded-2xl border-2 focus:border-primary/50"
                    />
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={isLoading || !newMessage.trim()}
                    size="lg"
                    className="h-12 px-6 rounded-2xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full overflow-hidden bg-gradient-to-br from-muted/20 to-muted/40">
            <div className="text-center space-y-6 p-8 max-w-lg">
              <div className="bg-primary/10 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
                <MessageCircle className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">Welcome to AI Chat Support</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Connect with our compassionate AI counselor for personalized emotional support. 
                  Your mental wellbeing matters to us.
                </p>
              </div>
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowNewSessionForm(true)}
                  size="lg"
                  className="px-8 py-3 text-base rounded-2xl"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Start Your First Session
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/50 border">
                    <Heart className="h-6 w-6 text-red-500" />
                    <span className="text-sm font-medium">24/7 Support</span>
                    <span className="text-xs text-muted-foreground text-center">Always here when you need us</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/50 border">
                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                    <span className="text-sm font-medium">Crisis Detection</span>
                    <span className="text-xs text-muted-foreground text-center">Immediate help when critical</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background/50 border">
                    <Lightbulb className="h-6 w-6 text-yellow-500" />
                    <span className="text-sm font-medium">Personalized Help</span>
                    <span className="text-xs text-muted-foreground text-center">Tailored to your needs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}