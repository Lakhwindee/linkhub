import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Send, Image, Paperclip } from "lucide-react";

interface Message {
  id: string;
  text?: string;
  type: 'text' | 'image' | 'file';
  fileData?: string; // base64 for images/files
  fileName?: string;
  fileSize?: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: number;
  conversationId: string;
}

interface SimpleChatProps {
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

export function SimpleChat({ conversationId, otherUser }: SimpleChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from localStorage
  useEffect(() => {
    const storageKey = `chat-${conversationId}`;
    const storedMessages = localStorage.getItem(storageKey);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
    setLoading(false);
  }, [conversationId]);

  // Save messages to localStorage
  const saveMessages = (newMessages: Message[]) => {
    const storageKey = `chat-${conversationId}`;
    localStorage.setItem(storageKey, JSON.stringify(newMessages));
    setMessages(newMessages);
  };

  // WebSocket connection
  useEffect(() => {
    if (!user || !conversationId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for chat');
      wsRef.current = ws;
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message' && data.conversationId === conversationId) {
          const newMessage: Message = {
            id: `msg-${Date.now()}-${Math.random()}`,
            text: data.text,
            type: data.type || 'text',
            fileData: data.fileData,
            fileName: data.fileName,
            fileSize: data.fileSize,
            userId: data.userId,
            userName: data.userName,
            userAvatar: data.userAvatar,
            timestamp: Date.now(),
            conversationId: conversationId
          };
          
          setMessages(prev => {
            const updated = [...prev, newMessage];
            localStorage.setItem(`chat-${conversationId}`, JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      wsRef.current = null;
    };
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [conversationId, user]);

  const sendMessage = async (messageData?: Partial<Message>) => {
    if (!user) return;
    
    // Check if it's a text message and if it's empty
    if (!messageData && !newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text: messageData?.text || newMessage.trim(),
      type: messageData?.type || 'text',
      fileData: messageData?.fileData,
      fileName: messageData?.fileName,
      fileSize: messageData?.fileSize,
      userId: user.id,
      userName: user.displayName || user.username || 'User',
      userAvatar: user.profileImageUrl || '',
      timestamp: Date.now(),
      conversationId: conversationId
    };

    // Add to local messages immediately
    const updatedMessages = [...messages, message];
    saveMessages(updatedMessages);

    // Send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        conversationId: conversationId,
        messageType: message.type,
        text: message.text,
        fileData: message.fileData,
        fileName: message.fileName,
        fileSize: message.fileSize,
        userId: message.userId,
        userName: message.userName,
        userAvatar: message.userAvatar
      }));
    }

    setNewMessage('');
  };

  // File upload helper function
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    try {
      const base64Data = await convertFileToBase64(file);
      await sendMessage({
        type: 'image',
        text: `📷 Image: ${file.name}`,
        fileData: base64Data,
        fileName: file.name,
        fileSize: file.size
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }

    // Reset file input
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }

    try {
      const base64Data = await convertFileToBase64(file);
      await sendMessage({
        type: 'file',
        text: `📎 File: ${file.name}`,
        fileData: base64Data,
        fileName: file.name,
        fileSize: file.size
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                        {message.type === 'image' && message.fileData ? (
                          <div className="space-y-2">
                            <img 
                              src={message.fileData} 
                              alt={message.fileName || 'Shared image'}
                              className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.fileData, '_blank')}
                            />
                            <p className="text-xs opacity-75">{message.fileName} • {message.fileSize ? formatFileSize(message.fileSize) : ''}</p>
                          </div>
                        ) : message.type === 'file' && message.fileData ? (
                          <div className="space-y-2 max-w-xs">
                            <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <Paperclip className="w-4 h-4 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{message.fileName}</p>
                                <p className="text-xs opacity-75">{message.fileSize ? formatFileSize(message.fileSize) : ''}</p>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = message.fileData!;
                                link.download = message.fileName || 'file';
                                link.click();
                              }}
                              className="w-full"
                            >
                              Download
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed break-words">{message.text}</p>
                        )}
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
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept="*/*"
              />
              <input
                ref={imageInputRef}
                type="file"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                accept="image/*"
              />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => fileInputRef.current?.click()}
                title="Attach File"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => imageInputRef.current?.click()}
                title="Share Image"
              >
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
                onClick={() => sendMessage()}
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