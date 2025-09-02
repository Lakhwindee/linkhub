import React, { useState, useEffect, useRef } from 'react';
import { database } from '../lib/firebase';
import { ref, push, onValue, serverTimestamp, off } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Send, Image, Paperclip } from "lucide-react";

interface Message {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
}

interface FirebaseChatProps {
  conversationId: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
    city?: string;
    country?: string;
    plan?: string;
  };
}

export function FirebaseChat({ conversationId, otherUser }: FirebaseChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen to messages
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = ref(database, `conversations/${conversationId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        setMessages(messagesList.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => {
      off(messagesRef, 'value', unsubscribe);
    };
  }, [conversationId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messagesRef = ref(database, `conversations/${conversationId}/messages`);
    
    await push(messagesRef, {
      text: newMessage.trim(),
      userId: user.id,
      userName: user.username || user.displayName || 'User',
      userAvatar: user.profileImageUrl || '',
      timestamp: serverTimestamp()
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-[600px] flex flex-col bg-background rounded-xl border shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="bg-accent/5 border-b px-4 py-3 flex items-center space-x-3">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={otherUser.avatar} alt={otherUser.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {otherUser.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-background"></div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{otherUser.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center space-x-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Online • 📍 {otherUser.city}, {otherUser.country}</span>
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          otherUser.plan === 'creator' 
            ? 'bg-purple-100 text-purple-700'
            : otherUser.plan === 'traveler'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {otherUser.plan === 'creator' ? '⭐ Creator' : otherUser.plan === 'traveler' ? '✈️ Traveler' : '🆓 Free'}
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-800/20 dark:to-slate-900/20">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className="space-y-2 max-w-xs">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex items-end space-x-2 ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar for received messages */}
                    {message.userId !== user?.id && (
                      <Avatar className="w-6 h-6 mb-1">
                        <AvatarImage src={message.userAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                          {message.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-xs lg:max-w-md space-y-1 ${
                      message.userId === user?.id ? 'items-end' : 'items-start'
                    } flex flex-col`}>
                      <div className={`px-4 py-2 rounded-2xl ${
                        message.userId === user?.id
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white dark:bg-gray-800 border rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-sm leading-relaxed break-words">{message.text}</p>
                      </div>
                      <span className="text-xs text-muted-foreground px-1">
                        {new Date(message.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                  <Send className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Start the conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    Send a message to {otherUser.name} to start chatting!
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Message Input */}
          <div className="border-t bg-background/50 p-4">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <Image className="w-4 h-4" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${otherUser.name}...`}
                  className="pr-12 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 rounded-full"
                />
              </div>
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm" 
                className="h-9 w-9 p-0 rounded-full bg-blue-500 hover:bg-blue-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}