import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/hooks/use-chat";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
  MessageCircle, 
  Send, 
  AlertTriangle, 
  Bot, 
  User,
  Phone,
  MessageSquare,
  StopCircle
} from "lucide-react";
import { Link } from "wouter";

const emotionalStates = [
  { value: "anxious", label: "Anxious", color: "bg-orange-100 text-orange-800" },
  { value: "sad", label: "Sad", color: "bg-blue-100 text-blue-800" },
  { value: "stressed", label: "Stressed", color: "bg-red-100 text-red-800" },
  { value: "angry", label: "Angry", color: "bg-red-100 text-red-800" },
  { value: "confused", label: "Confused", color: "bg-purple-100 text-purple-800" },
  { value: "hopeful", label: "Hopeful", color: "bg-green-100 text-green-800" },
];

export default function Chat() {
  const [message, setMessage] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const [showEmotionSelector, setShowEmotionSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentSession,
    currentSessionId,
    sessions,
    startNewChat,
    sendMessage,
    endCurrentSession,
    loadSession,
    isStartingSession,
    isSendingMessage,
    isEndingSession,
  } = useChat();

  // Get emergency resources
  const { data: emergencyResources } = useQuery({
    queryKey: ['/api/v1/chat/emergency-resources'],
    queryFn: api.getEmergencyResources,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    if (currentSessionId) {
      sendMessage(message);
    } else {
      startNewChat(message, selectedEmotion);
      setShowEmotionSelector(false);
    }
    
    setMessage("");
  };

  const handleNewChat = () => {
    setShowEmotionSelector(true);
    setSelectedEmotion("");
  };

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
  };

  return (
    <div className="h-screen flex" data-testid="page-chat">
      {/* Chat History Sidebar */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">Chat History</h2>
            <Button
              onClick={handleNewChat}
              size="sm"
              data-testid="button-new-chat"
            >
              New Chat
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.length > 0 ? (
            sessions.map((session: any) => (
              <div
                key={session.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentSessionId === session.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => loadSession(session.id)}
                data-testid={`chat-session-${session.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge 
                    variant="secondary" 
                    className={
                      emotionalStates.find(e => e.value === session.emotional_state)?.color || 
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {session.emotional_state || "General"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {session.messages?.[0]?.content || "New conversation"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {session.message_count} messages
                  </span>
                  <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {session.status}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No chat history</p>
              <p className="text-sm text-muted-foreground">Start your first conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-card-foreground">EmotiCare Assistant</h1>
                <p className="text-sm text-muted-foreground">AI Mental Health Support • Always here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {currentSessionId && (
                <Button
                  variant="outline"
                  onClick={endCurrentSession}
                  disabled={isEndingSession}
                  data-testid="button-end-session"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  End Session
                </Button>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-chart-2 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 bg-muted/20 space-y-4">
          {!currentSession && !isStartingSession && (
            <div className="flex items-start space-x-3 chat-message">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border max-w-lg">
                <p className="text-card-foreground">
                  Hello! I'm your AI mental health support assistant. How are you feeling today? 
                  I'm here to listen and help you work through any challenges you're facing.
                </p>
                <p className="text-xs text-muted-foreground mt-2">Just now</p>
              </div>
            </div>
          )}

          {currentSession?.messages?.map((msg: any, index: number) => (
            <div
              key={index}
              className={`flex items-start space-x-3 chat-message ${
                msg.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-6 h-6 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={`rounded-lg p-4 shadow-sm max-w-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-card-foreground border border-border'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-2 ${
                  msg.role === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'Just now'}
                </p>
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {(isStartingSession || isSendingMessage) && (
            <div className="flex items-start space-x-3 chat-message">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-6 h-6 text-primary-foreground animate-pulse" />
              </div>
              <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-card border-t border-border p-4 space-y-4">
          {/* Emotional State Selector */}
          {showEmotionSelector && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">How are you feeling right now?</p>
              <div className="flex flex-wrap gap-2">
                {emotionalStates.map((emotion) => (
                  <Button
                    key={emotion.value}
                    variant={selectedEmotion === emotion.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEmotionSelect(emotion.value)}
                    data-testid={`emotion-${emotion.value}`}
                  >
                    {emotion.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex space-x-4" data-testid="form-chat-message">
            <Textarea
              placeholder="Share what's on your mind..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              disabled={!message.trim() || isStartingSession || isSendingMessage}
              className="self-end"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Emergency Resources Quick Access */}
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-sm text-destructive font-medium">Need immediate help?</span>
              </div>
              <div className="flex space-x-2">
                {emergencyResources?.hotlines?.[0] && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    data-testid="button-call-crisis"
                  >
                    <a href={`tel:${emergencyResources.hotlines[0].number}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      Call {emergencyResources.hotlines[0].number}
                    </a>
                  </Button>
                )}
                <Link href="/emergency">
                  <Button 
                    variant="outline" 
                    size="sm"
                    data-testid="button-emergency-resources"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Emergency Resources
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
