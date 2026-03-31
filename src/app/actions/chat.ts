'use server';

import { pfaChatbot } from '@/ai/flows/pfa-chatbot-flow';

export async function handleUserMessage(message: string) {
  if (!message) {
    return { error: 'Message cannot be empty.' };
  }

  try {
    const result = await pfaChatbot({ message });
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
