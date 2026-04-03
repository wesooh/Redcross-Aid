'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, User, Bot, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { handleUserMessage } from '@/app/actions/chat';

interface Message {
  id: number;
  role: 'user' | 'ai' | 'system';
  content: React.ReactNode;
}

const initialMessage: Message = {
    id: 1,
    role: 'ai',
    content: "Hello, I'm a psychosocial first aid assistant. I'm here to listen and support you. How are you feeling today?",
};

// In a real app, this would come from an authentication context (e.g., Supabase Auth).
// For now, please replace this with a valid 'victim' role UUID from your 'profiles' table.
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000'; // IMPORTANT: REPLACE WITH A REAL UUID

export function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    startTransition(async () => {
      const result = await handleUserMessage(input, FAKE_USER_ID);
      if (result.response) {
        const aiMessage: Message = {
          id: Date.now() + 1,
          role: 'ai',
          content: result.response,
        };
        setMessages((prev) => [...prev, aiMessage]);

        if (result.escalated) {
          const systemMessage: Message = {
            id: Date.now() + 2,
            role: 'system',
            content: (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span>A human counselor has been alerted due to the nature of this conversation and may reach out.</span>
              </div>
            ),
          };
          setMessages((prev) => [...prev, systemMessage]);
        }
      }
    });
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader>
        <h2 className="text-xl font-semibold">Psychosocial First Aid Support</h2>
        <p className="text-sm text-muted-foreground">Chatting as user: <span className="font-mono text-xs bg-muted p-1 rounded">{FAKE_USER_ID}</span></p>
      </CardHeader>
      <CardContent ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.role === 'ai' && <div className="p-2 bg-primary/10 text-primary rounded-full"><Bot className="w-5 h-5" /></div>}
            
            <div
              className={cn(
                'max-w-md rounded-lg p-3 text-sm',
                message.role === 'user' ? 'bg-primary text-primary-foreground' : '',
                message.role === 'ai' ? 'bg-card border' : '',
                message.role === 'system' ? 'w-full bg-destructive/10 text-destructive-foreground border border-destructive/20 text-center' : ''
              )}
            >
              {message.content}
            </div>
            
            {message.role === 'user' && <div className="p-2 bg-accent/20 text-accent-foreground rounded-full"><User className="w-5 h-5 text-accent" /></div>}
          </div>
        ))}
         {isPending && (
          <div className="flex items-start gap-3 justify-start">
             <div className="p-2 bg-primary/10 text-primary rounded-full"><Bot className="w-5 h-5" /></div>
            <div className="flex items-center space-x-2 bg-card border rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="min-h-1 resize-none"
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                }
            }}
            rows={1}
            disabled={isPending}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isPending}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
