'use server';

import { pfaChatbot } from '@/ai/flows/pfa-chatbot-flow';
import { z } from 'zod';

const ChatSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty.'),
    userId: z.string().uuid('A valid user ID is required for chat.'),
});

export async function handleUserMessage(message: string, userId: string) {

  const validation = ChatSchema.safeParse({ message, userId });
  if (!validation.success) {
      const error = validation.error.flatten().fieldErrors;
      console.error('Chat validation error:', error);
      return { 
        response: 'There was an issue starting the chat session. Invalid user or message.',
        error: JSON.stringify(error)
     };
  }

  try {
    const result = await pfaChatbot({ message, userId });
    return result;
  } catch (error) {
    console.error('Error in PFA chatbot flow:', error);
    return {
      response: 'I apologize, but I encountered an error. Please try again later.',
      sentiment: 'error',
      riskScore: 0,
      escalated: false,
    };
  }
}
