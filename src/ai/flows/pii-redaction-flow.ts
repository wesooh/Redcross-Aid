'use server';
/**
 * @fileOverview This file provides a Genkit flow for redacting Personally Identifiable Information (PII) from text.
 *
 * - redactPii - A function that takes a string of text, identifies and redacts PII, and returns the modified text along with an indicator if PII was detected.
 * - PiiRedactionInput - The input type for the redactPii function.
 * - PiiRedactionOutput - The return type for the redactPii function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PiiRedactionInputSchema = z.object({
  text: z
    .string()
    .describe(
      'The input text from which PII (Personally Identifiable Information) needs to be redacted.'
    ),
});
export type PiiRedactionInput = z.infer<typeof PiiRedactionInputSchema>;

const PiiRedactionOutputSchema = z.object({
  redactedText: z
    .string()
    .describe('The input text with all detected PII replaced by `[REDACTED_PII]` markers.'),
  piiDetected: z.boolean().describe('True if any PII was detected and redacted; otherwise, false.'),
});
export type PiiRedactionOutput = z.infer<typeof PiiRedactionOutputSchema>;

export async function redactPii(input: PiiRedactionInput): Promise<PiiRedactionOutput> {
  return piiRedactionFlow(input);
}

const piiRedactionPrompt = ai.definePrompt({
  name: 'piiRedactionPrompt',
  input: {schema: PiiRedactionInputSchema},
  output: {schema: PiiRedactionOutputSchema},
  prompt: `You are an expert PII (Personally Identifiable Information) redaction agent.
Your task is to identify and redact any PII present in the user's message. Replace all identified PII with the placeholder '[REDACTED_PII]'.

PII includes, but is not limited to: full names, addresses, phone numbers, email addresses, social security numbers, national ID numbers, dates of birth, and financial account details.

After redaction, also indicate whether any PII was detected and redacted.

Input Text: {{{text}}}

Output in JSON format with 'redactedText' and 'piiDetected' fields.`,
});

const piiRedactionFlow = ai.defineFlow(
  {
    name: 'piiRedactionFlow',
    inputSchema: PiiRedactionInputSchema,
    outputSchema: PiiRedactionOutputSchema,
  },
  async input => {
    const {output} = await piiRedactionPrompt(input);

    if (!output) {
      throw new Error('PII redaction failed: No output from prompt.');
    }

    // The prompt is designed to set piiDetected, but as a safeguard, we can also infer it.
    const piiDetectedInferred = output.redactedText.includes('[REDACTED_PII]');

    return {
      redactedText: output.redactedText,
      piiDetected: output.piiDetected || piiDetectedInferred, // Prefer LLM's flag, but infer if not set or incorrect.
    };
  }
);
