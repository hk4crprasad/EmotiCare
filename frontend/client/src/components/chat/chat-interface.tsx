import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/hooks/use-chat";
import { Send, Bot, User, StopCircle } from "lucide-react";

interface ChatInterfaceProps {
  onEmotionSelect?: (emotion: string) => void;
  showEmotionSelector?: boolean;
  className?: string;
}

const emotionalStates = [
  { value: "anxious", label: "Anxious", color: "bg-orange-100 text-orange-800" },
  { value: "sad", label: "Sad", color: "bg-blue-100 text-blue-800" },
  { value: "stressed", label: "Stressed", color: "bg-red-100 text-red-800" },
  { value: "angry", label: "Angry", color: "bg-red-100 text-red-800" },
  { value: "confused", label: "Confused", color: "bg-purple-100 text-purple-800" },
  { value: "hopeful", label: "Hopeful", color: "bg-green-100 text-green-800" },
];

export default function ChatInterface({ 
  onEmotionSelect, 
  showEmotionSelector = false, 
  className = "" 
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentSession,
    currentSessionId,
    startNewChat,
    sendMessage,
    endCurrentSession,
    isStartingSession,
    isSendingMessage,
  } = useChat();

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
    }
    
    setMessage("");
  };

  const handleEmotionSelect = (emotion: string) => {
    setSelectedEmotion(emotion);
    onEmotionSelect?.(emotion);
  };

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid="chat-interface">
      {/* Chat Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">EmotiCare Assistant</h3>
            <p className="text-sm text-muted-foreground">AI Mental Health Support</p>
          </div>
        </div>
        {currentSessionId && (
          <Button
            variant="outline"
            size="sm"
            onClick={endCurrentSession}
            data-testid="button-end-session"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            End Session
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/20 space-y-4">
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
      </div>
    </div>
  );
}
