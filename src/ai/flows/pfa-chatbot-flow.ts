'use server';
/**
 * @fileOverview This file implements a Genkit flow for the Psychosocial First Aid (PFA) AI Triage chatbot.
 * It provides bilingual (English/Swahili) psychological support, performs real-time sentiment analysis,
 * redacts Personally Identifiable Information (PII), and escalates high-risk situations to human counselors
 * via a webhook.
 *
 * - pfaChatbot - The main function to interact with the PFA AI chatbot.
 * - PFAChatbotInput - The input type for the pfaChatbot function.
 * - PFAChatbotOutput - The return type for the pfaChatbot function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- PII Redaction Utility ---
/**
 * Redacts common Personally Identifiable Information (PII) from a given text.
 * This is a basic implementation and might need to be enhanced for production use.
 * @param text The input text potentially containing PII.
 * @returns The text with PII redacted.
 */
function redactPII(text: string): string {
  let redactedText = text;

  // Redact email addresses
  redactedText = redactedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');

  // Redact phone numbers (basic example, can be more complex)
  redactedText = redactedText.replace(/(\+\d{1,2}\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}/g, '[REDACTED_PHONE]');

  // Redact social security numbers or similar identifiers (example pattern)
  redactedText = redactedText.replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, '[REDACTED_SSN]');

  return redactedText;
}

// --- Tools for internal flow logic ---

// Tool to simulate triggering a webhook for counselor alerts
const triggerCounselorAlertTool = ai.defineTool(
  {
    name: 'triggerCounselorAlert',
    description: 'Triggers an alert to a human counselor for high-risk situations detected in user communication.',
    inputSchema: z.object({
      message: z.string().describe('The redacted user message that triggered the alert.'),
      riskScore: z.number().min(0).max(1).describe('The calculated risk score.'),
    }),
    outputSchema: z.object({
      status: z.string().describe('Status of the alert (e.g., "success" or "failed").'),
      alertId: z.string().optional().describe('Unique identifier for the triggered alert.'),
    }),
  },
  async (input) => {
    // In a real application, this would make an HTTP request to an alerting service.
    // For this implementation, we'll log to the console and simulate a response.
    console.warn(`🚨 Counselor Alert Triggered! Risk Score: ${input.riskScore}`);
    console.warn(`Original Redacted Message: "${input.message}"`);
    // Simulate webhook call
    // const response = await fetch('YOUR_WEBHOOK_URL', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(input),
    // });
    // if (!response.ok) {
    //   return { status: 'failed', alertId: `error-${Date.now()}` };
    // }
    return { status: 'success', alertId: `alert-${Date.now()}` };
  }
);

// Internal prompt for sentiment analysis
const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: { schema: z.object({ text: z.string().describe('The text to analyze.') }) },
  output: {
    schema: z.object({
      sentiment: z.string().describe('The overall sentiment (e.g., "positive", "negative", "neutral", "urgent", "distressed").'),
      riskScore: z.number().min(0).max(1).describe('A risk score from 0 (no risk) to 1 (extreme risk).'),
    }).describe('The sentiment and risk score analysis.'),
  },
  prompt: `Analyze the following text for overall sentiment and assign a numerical risk score from 0 (no risk) to 1 (extreme risk).
  Consider psychological distress, urgency, and potential harm indicators.
  The sentiment should be a single word or short phrase (e.g., "calm", "anxious", "depressed", "urgent").
  Output the result as a JSON object with 'sentiment' and 'riskScore' keys.

  Text: "{{{text}}}"

  Output example:
  {
    "sentiment": "distressed",
    "riskScore": 0.9
  }`,
});

// Tool to perform sentiment analysis. Called explicitly by the flow.
const analyzeSentimentTool = ai.defineTool(
  {
    name: 'analyzeSentiment',
    description: 'Analyzes the sentiment of a given text and provides a risk score from 0 (no risk) to 1 (extreme risk).',
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.object({ sentiment: z.string(), riskScore: z.number().min(0).max(1) }),
  },
  async (input) => {
    const { output } = await sentimentAnalysisPrompt(input);
    return output!;
  }
);


// --- Main PFA Chatbot Flow ---

const PFAChatbotInputSchema = z.object({
  message: z.string().describe('The user\'s message to the PFA chatbot.'),
});
export type PFAChatbotInput = z.infer<typeof PFAChatbotInputSchema>;

const PFAChatbotOutputSchema = z.object({
  response: z.string().describe('The AI chatbot\'s empathetic response.'),
  sentiment: z.string().optional().describe('The detected sentiment of the user\'s message.'),
  riskScore: z.number().min(0).max(1).optional().describe('The calculated risk score of the user\'s message.'),
  escalated: z.boolean().optional().describe('True if the situation was escalated to a human counselor.'),
});
export type PFAChatbotOutput = z.infer<typeof PFAChatbotOutputSchema>;


// Main PFA chatbot prompt
const pfaChatbotPrompt = ai.definePrompt({
  name: 'pfaChatbotPrompt',
  input: {
    schema: z.object({
      message: z.string().describe('The redacted user message.'),
      sentiment: z.string().describe('The detected sentiment of the user\'s message.'),
    }),
  },
  output: {
    schema: z.object({
      response: z.string().describe('The AI chatbot\'s empathetic response.'),
    }),
  },
  prompt: `You are a highly empathetic and supportive bilingual (English/Swahili) Psychosocial First Aid (PFA) AI agent.\n  Your primary goal is to provide immediate, calming, and practical psychological support and guidance to disaster victims.\n  Communicate in the language the user initiated the conversation with.\n  Be understanding, non-judgmental, and focus on validating feelings and offering coping strategies or gentle advice.\n  Avoid making medical diagnoses or promises you cannot keep.\n\n  The user's message has been analyzed and its sentiment is: "{{{sentiment}}}". Use this information to tailor your empathetic response.\n\n  User message: "{{{message}}}"`,
});


export async function pfaChatbot(input: PFAChatbotInput): Promise<PFAChatbotOutput> {
  return pfaChatbotFlow(input);
}

const pfaChatbotFlow = ai.defineFlow(
  {
    name: 'pfaChatbotFlow',
    inputSchema: PFAChatbotInputSchema,
    outputSchema: PFAChatbotOutputSchema,
  },
  async (input) => {
    // 1. Redact PII from the user's message
    const redactedMessage = redactPII(input.message);

    // 2. Perform sentiment analysis on the redacted message
    const sentimentResult = await analyzeSentimentTool.run({ text: redactedMessage });

    let escalated = false;
    // 3. Check for high-risk and trigger counselor alert if necessary
    if (sentimentResult.riskScore > 0.85) {
      console.log(`Risk score ${sentimentResult.riskScore} > 0.85. Escalating to human counselor.`);
      await triggerCounselorAlertTool.run({
        message: redactedMessage,
        riskScore: sentimentResult.riskScore,
      });
      escalated = true;
    }

    // 4. Generate chatbot response using the main PFA prompt
    const { output: chatbotOutput } = await pfaChatbotPrompt({
      message: redactedMessage,
      sentiment: sentimentResult.sentiment,
    });

    return {
      response: chatbotOutput!.response,
      sentiment: sentimentResult.sentiment,
      riskScore: sentimentResult.riskScore,
      escalated,
    };
  }
);
