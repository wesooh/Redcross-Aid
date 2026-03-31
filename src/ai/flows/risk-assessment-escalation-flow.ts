'use server';
/**
 * @fileOverview This file implements a Genkit flow for real-time sentiment analysis and risk assessment
 * of disaster victim conversations. If a high-risk situation is detected, it triggers
 * a webhook to alert a human counselor.
 *
 * - assessCrisisRisk - A function that handles the crisis risk assessment and escalation process.
 * - CrisisEscalationInput - The input type for the assessCrisisRisk function.
 * - CrisisEscalationOutput - The return type for the assessCrisisRisk function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CrisisEscalationInputSchema = z.object({
  conversationHistory: z
    .array(z.string())
    .describe('The recent conversation history between the user and the AI chatbot.'),
  language: z.enum(['en', 'sw']).describe(
    'The language of the conversation. "en" for English, "sw" for Swahili.'
  ),
});
export type CrisisEscalationInput = z.infer<typeof CrisisEscalationInputSchema>;

const CrisisEscalationOutputSchema = z.object({
  sentiment: z.enum(['very negative', 'negative', 'neutral', 'positive', 'very positive']).describe('The overall sentiment of the conversation.'),
  riskScore: z.number().min(0).max(1).describe(
    'A numerical score between 0.0 and 1.0 indicating the level of distress or risk. Higher scores indicate higher risk.'
  ),
  escalationTriggered: z.boolean().describe('True if a human counselor alert was triggered, false otherwise.'),
  escalationReason: z
    .string()
    .optional()
    .describe('The reason for triggering the escalation, if any.'),
});
export type CrisisEscalationOutput = z.infer<typeof CrisisEscalationOutputSchema>;

// A simple PII redaction function. In a real-world scenario, this would be more robust.
function redactPii(text: string): string {
  // Redact common PII patterns: names, phone numbers, email addresses, general addresses.
  // This is a basic example and might not cover all cases.
  let redactedText = text;

  // Names (simple heuristic: two capitalized words together, often followed by more text)
  redactedText = redactedText.replace(/([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})/g, '[REDACTED_NAME]');
  // Phone numbers (various formats)
  redactedText = redactedText.replace(
    /(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g,
    '[REDACTED_PHONE]'
  );
  // Email addresses
  redactedText = redactedText.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '[REDACTED_EMAIL]'
  );
  // Basic address pattern (numbers, street names, city/country) - very broad
  redactedText = redactedText.replace(
    /(\d+\s[A-Za-z0-9\s,]+\s(?:Street|Road|Avenue|Lane|Blvd|St|Rd|Ave|Ln|Blvd)\b(?:,\s[A-Za-z\s]+){0,2})/g,
    '[REDACTED_ADDRESS]'
  );

  return redactedText;
}

// Define a tool for triggering the crisis alert webhook
const triggerCrisisAlertWebhook = ai.defineTool(
  {
    name: 'triggerCrisisAlertWebhook',
    description: 'Triggers a webhook to alert a human counselor about a high-risk situation.',
    inputSchema: z.object({
      riskScore: z
        .number()
        .min(0)
        .max(1)
        .describe('The risk score that triggered the alert.'),
      conversationSnippet: z
        .string()
        .describe('A relevant snippet from the redacted conversation leading to the alert.'),
      language: z
        .enum(['en', 'sw'])
        .describe('The language of the conversation (e.g., "en", "sw").'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string().optional(),
    }),
  },
  async (input) => {
    console.log(`
    !!! HIGH-RISK ALERT !!!
    Risk Score: ${input.riskScore}
    Language: ${input.language}
    Conversation Snippet: "${input.conversationSnippet}"
    Triggering webhook...
    `);
    // In a real application, this would make an actual HTTP request to a webhook URL.
    // For this example, we'll simulate the webhook call.
    try {
      // const response = await fetch(process.env.CRISIS_WEBHOOK_URL!, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(input),
      // });
      // if (!response.ok) {
      //   throw new Error(`Webhook failed with status: ${response.status}`);
      // }
      // const data = await response.json(); // Assuming webhook returns some JSON
      return { success: true, message: 'Webhook simulated successfully.' };
    } catch (error: any) {
      console.error('Error triggering webhook:', error);
      return { success: false, message: `Webhook failed: ${error.message}` };
    }
  }
);

const riskAssessmentPrompt = ai.definePrompt({
  name: 'riskAssessmentPrompt',
  input: { schema: CrisisEscalationInputSchema },
  output: { schema: CrisisEscalationOutputSchema.omit({ escalationTriggered: true, escalationReason: true }) },
  prompt: `You are a Psychosocial First Aid AI agent assisting disaster victims. Your goal is to assess the user's emotional state, sentiment, and potential risk level based on the conversation history. Respond only with a JSON object.

Instructions:
1. Analyze the provided conversation history carefully. The conversation is in {{{language}}}.
2. Determine the overall sentiment (e.g., 'very negative', 'negative', 'neutral', 'positive', 'very positive').
3. Assign a 'riskScore' between 0.0 (no risk) and 1.0 (extremely high risk/distress) based on indicators of trauma, self-harm ideation, severe anxiety, hopelessness, or imminent danger. Consider keywords, tone, and emotional intensity. A score above 0.85 indicates a critical need for human intervention.
4. **CRITICAL:** Do NOT include any Personally Identifiable Information (PII) in your output. If the conversation contains PII, replace it with '[REDACTED]'.
5. Your response MUST be a JSON object with 'sentiment' and 'riskScore' fields.

Conversation History:

{{#each conversationHistory}}
- {{{this}}}
{{/each}}

Example Output (English, high risk):
{
  "sentiment": "very negative",
  "riskScore": 0.92
}

Example Output (Swahili, moderate risk):
{
  "sentiment": "negative",
  "riskScore": 0.65
}

Your JSON response:`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }, // Allow discussion of difficult topics for crisis support
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    ],
    // Enable JSON mode for structured output
    responseMimeType: 'application/json',
  },
});

const CRISIS_ESCALATION_THRESHOLD = 0.85;

export async function assessCrisisRisk(input: CrisisEscalationInput): Promise<CrisisEscalationOutput> {
  return crisisEscalationFlow(input);
}

const crisisEscalationFlow = ai.defineFlow(
  {
    name: 'crisisEscalationFlow',
    inputSchema: CrisisEscalationInputSchema,
    outputSchema: CrisisEscalationOutputSchema,
  },
  async (input) => {
    // 1. Redact PII from the conversation history before sending to the LLM
    const redactedConversationHistory = input.conversationHistory.map(redactPii);

    // 2. Perform sentiment analysis and risk assessment using the AI model
    const { output } = await riskAssessmentPrompt({
      conversationHistory: redactedConversationHistory,
      language: input.language,
    });

    if (!output) {
      throw new Error('Failed to get a valid response from the risk assessment prompt.');
    }

    const { sentiment, riskScore } = output;

    let escalationTriggered = false;
    let escalationReason: string | undefined;

    // 3. Check if the risk score exceeds the threshold
    if (riskScore >= CRISIS_ESCALATION_THRESHOLD) {
      console.log('Risk score exceeded threshold. Triggering crisis alert webhook.');
      escalationTriggered = true;
      escalationReason = `Risk score (${riskScore}) exceeded threshold (${CRISIS_ESCALATION_THRESHOLD}).`;

      // 4. Trigger the webhook tool
      const webhookResult = await triggerCrisisAlertWebhook({
        riskScore,
        conversationSnippet: redactedConversationHistory[redactedConversationHistory.length - 1] || 'No recent message',
        language: input.language,
      });

      if (!webhookResult.success) {
        console.error('Failed to trigger crisis alert webhook:', webhookResult.message);
        // Optionally, handle webhook failure (e.g., retry, log to a different system)
      }
    }

    return {
      sentiment,
      riskScore,
      escalationTriggered,
      escalationReason,
    };
  }
);
