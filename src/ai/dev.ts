import { config } from 'dotenv';
config();

import '@/ai/flows/pii-redaction-flow.ts';
import '@/ai/flows/risk-assessment-escalation-flow.ts';
import '@/ai/flows/pfa-chatbot-flow.ts';