import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Send, Bot, User, AlertTriangle, Phone, Heart, Plus, History, MessageSquare, X } from 'lucide-react';
import { apiService, CrisisResources } from '../services/api';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
  severity?: 'low' | 'medium' | 'high' | 'crisis';
  emotional_analysis?: {
    requires_intervention: boolean;
    emotional_support_level: string;
    suggested_resources: string[];
  };
}

interface SessionHistoryItem {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  message_count: number;
  last_message_preview: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [emergencyResources, setEmergencyResources] = useState<CrisisResources | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load emergency resources on component mount
  useEffect(() => {
    const loadEmergencyResources = async () => {
      try {
        const resources = await apiService.getEmergencyResources();
        setEmergencyResources(resources);
      } catch (err) {
        console.error('Failed to load emergency resources:', err);
        toast.error('Failed to load emergency resources');
      }
    };
    loadEmergencyResources();
  }, []);

  // Load session history on component mount
  useEffect(() => {
    loadSessionHistory();
  }, []);

  const loadSessionHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const sessions = await apiService.getChatSessions();
      const historyItems: SessionHistoryItem[] = (sessions as any[]).map((session: any) => ({
        id: session.id,
        created_at: session.created_at,
        updated_at: session.updated_at,
        status: session.status,
        message_count: session.messages?.length || 0,
        last_message_preview: session.messages?.[session.messages.length - 1]?.content?.substring(0, 50) || 'No messages'
      }));
      setSessionHistory(historyItems);
    } catch (err) {
      console.error('Failed to load session history:', err);
      toast.error('Failed to load session history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const createNewSession = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setActiveTab('chat');
    toast.success('New chat session started');
  };

  const loadSession = async (sessionId: string) => {
    try {
      const session = await apiService.getChatSession(sessionId);
      setCurrentSessionId(sessionId);
      setActiveTab('chat');

      // Convert session messages to our format
      const sessionMessages: Message[] = (session as any).messages.map((msg: any, index: number) => ({
        id: `${sessionId}_${index}`,
        content: msg.content,
        type: msg.role === 'user' ? 'user' : 'bot',
        timestamp: new Date(msg.timestamp),
        emotional_analysis: msg.emotional_analysis
      }));

      setMessages(sessionMessages);
      toast.success('Session loaded successfully');
    } catch (err) {
      console.error('Failed to load session:', err);
      toast.error('Failed to load session');
    }
  };

  const endCurrentSession = async () => {
    if (currentSessionId) {
      try {
        await apiService.endChatSession(currentSessionId);
        setCurrentSessionId(null);
        setMessages([]);
        loadSessionHistory(); // Refresh history
        toast.success('Session ended successfully');
      } catch (err) {
        console.error('Failed to end session:', err);
        toast.error('Failed to end session');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      if (!currentSessionId) {
        // Start a new chat session
        const sessionResponse: any = await apiService.startChatSession(inputValue, 'neutral');
        setCurrentSessionId(sessionResponse.id);

        // Convert API response to our message format
        const botMessage: Message = {
          id: sessionResponse.id + '_bot',
          content: sessionResponse.messages[1].content,
          type: 'bot',
          timestamp: new Date(sessionResponse.messages[1].timestamp),
          emotional_analysis: sessionResponse.messages[1].emotional_analysis,
        };

        setMessages(prev => [...prev, botMessage]);
      } else {
        // Send message to existing session
        const response: any = await apiService.sendChatMessage(currentSessionId!, inputValue);

        const botMessage: Message = {
          id: Date.now().toString() + '_bot',
          content: response.message,
          type: 'bot',
          timestamp: new Date(),
          emotional_analysis: {
            requires_intervention: response.requires_intervention,
            emotional_support_level: response.emotional_support_level,
            suggested_resources: response.suggested_resources,
          },
        };

        setMessages(prev => [...prev, botMessage]);

        // Show notifications for high-risk situations
        if (botMessage.emotional_analysis?.requires_intervention) {
          toast.error('Crisis detected - Please consider reaching out to professional help', {
            duration: 8000,
          });
        } else if (botMessage.emotional_analysis?.emotional_support_level === 'high') {
          toast('Emotional support recommended - Take care of yourself', {
            icon: '💙',
            duration: 5000,
          });
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'crisis':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Crisis Alert</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">High Concern</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Moderate</Badge>;
      default:
        return null;
    }
  };

  // Markdown rendering component
  const MarkdownMessage = ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          p({ children }: any) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          ul({ children }: any) {
            return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
          },
          ol({ children }: any) {
            return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
          },
          li({ children }: any) {
            return <li className="ml-4">{children}</li>;
          },
          blockquote({ children }: any) {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">
                {children}
              </blockquote>
            );
          },
          strong({ children }: any) {
            return <strong className="font-semibold">{children}</strong>;
          },
          em({ children }: any) {
            return <em className="italic">{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="min-h-screen max-w-6xl mx-auto p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900">AI Mental Health Support</h1>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Safe, confidential, and available 24/7. This AI assistant provides coping strategies and can connect you with professional help when needed.
        </p>
      </div>

      {/* Session Management */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <Button
            onClick={createNewSession}
            variant="outline"
            className="flex items-center space-x-2 w-full sm:w-auto text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Session</span>
          </Button>
          {currentSessionId && (
            <Button
              onClick={endCurrentSession}
              variant="outline"
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full sm:w-auto text-sm"
            >
              <X className="h-4 w-4" />
              <span>End Session</span>
            </Button>
          )}
        </div>
        {currentSessionId && (
          <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
            Session: {currentSessionId.slice(-8)}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'chat' | 'history')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
          <TabsTrigger value="chat" className="flex items-center space-x-2 text-sm">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden xs:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center space-x-2 text-sm">
            <History className="h-4 w-4" />
            <span className="hidden xs:inline">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0">
          {/* Crisis Resources */}
          <Card className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-red-200">
            <div className="flex items-center space-x-2 mb-2 sm:mb-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <span className="font-medium text-red-800 text-sm sm:text-base">Crisis Resources</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
              {emergencyResources ? (
                <>
                  {emergencyResources.crisis_hotlines?.map((hotline: any, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{hotline.name}</div>
                        <div className="text-gray-600">{hotline.number} • {hotline.available}</div>
                      </div>
                    </div>
                  ))}
                  {emergencyResources.online_resources?.slice(0, 2).map((resource: any, index: number) => (
                    <div key={`online-${index}`} className="flex items-center space-x-2">
                      <Heart className="h-4 w-4 text-red-600" />
                      <div>
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-gray-600 text-xs">{resource.description}</div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-red-600" />
                    <span>Suicide Prevention: 988</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-red-600" />
                    <span>Crisis Text: HOME to 741741</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Chat Messages */}
          <Card className="h-[60vh] sm:h-[70vh] mb-4 sm:mb-6">
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[75%] ${
                      message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                      <Avatar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0">
                        {message.type === 'user' ? (
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Avatar>
                      <div className={`rounded-lg p-3 sm:p-4 break-words ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-gray-100'
                      }`}>
                        {message.severity && getSeverityBadge(message.severity)}
                        <div className="prose prose-xs sm:prose-sm max-w-none">
                          <MarkdownMessage content={message.content} />
                        </div>
                        <div className={`text-xs mt-1 sm:mt-2 opacity-70 ${
                          message.type === 'user' ? 'text-primary-foreground' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="border-t p-3 sm:p-4">
                <div className="flex space-x-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Share how you're feeling..."
                    className="flex-1 text-sm sm:text-base"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                    className="flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  This AI provides support and coping strategies. For emergencies, please contact crisis services immediately.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 text-sm"
              onClick={() => setInputValue("I'm feeling anxious about my upcoming exams")}
            >
              <span className="text-xl sm:text-2xl">😰</span>
              <span>Academic Stress</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 text-sm"
              onClick={() => setInputValue("I'm feeling lonely and isolated")}
            >
              <span className="text-xl sm:text-2xl">😔</span>
              <span>Feeling Isolated</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2 text-sm"
              onClick={() => setInputValue("I'm having trouble sleeping")}
            >
              <span className="text-xl sm:text-2xl">😴</span>
              <span>Sleep Issues</span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card>
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Chat Session History</h2>
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600 text-sm">Loading session history...</p>
                </div>
              ) : sessionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-sm sm:text-base">No chat sessions found</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Start a new conversation to begin your session history</p>
                </div>
              ) : (
                <ScrollArea className="h-[50vh] sm:h-96">
                  <div className="space-y-3 sm:space-y-4">
                    {sessionHistory.map((session) => (
                      <div
                        key={session.id}
                        className="border rounded-lg p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm sm:text-base">Session {session.id.slice(-8)}</span>
                          </div>
                          <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {session.status}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed">
                          {session.last_message_preview}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{session.message_count} messages</span>
                          <span>{new Date(session.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
