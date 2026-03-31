# **App Name**: ResilienceLink

## Core Features:

- Secure Digital Wallet Interface: Aid recipients can securely view their voucher balances and transaction history via a responsive web interface.
- Merchant Payment Terminal: Local merchants can accept voucher payments by scanning recipient QR codes or verifying transaction codes through a dedicated web terminal.
- Atomic & Idempotent Ledger: Backend system managing voucher balances and transactions, ensuring ACID compliance, double-spending prevention, and an append-only, idempotent transaction log in PostgreSQL.
- QR Code Generation & Validation: System to securely generate unique QR codes for beneficiary vouchers and validate them during merchant transactions.
- Bilingual AI Psychosocial Chatbot: An AI assistant providing immediate, bilingual (English/Swahili) psychological support to disaster victims through conversational AI.
- Real-time Sentiment & Risk Analysis: An AI tool to perform real-time sentiment analysis on chat inputs, detecting high-risk situations and triggering alerts to human counselors via webhooks.
- PII Redaction & Security: Automated redaction of Personally Identifiable Information (PII) from user inputs to the AI tool, ensuring data privacy and security.

## Style Guidelines:

- The interface will adopt a light color scheme, providing an approachable and universally comforting aesthetic for users during crisis. The primary brand color, conveying trust and dependability, is a deep blue (#288CBD).
- The background will feature a soft, nearly neutral, desaturated light blue (#F0F3F4), offering a clean and calming canvas for content.
- An accent color, a gentle lavender purple (#8F7DE8), will highlight critical actions and draw attention without overwhelming, subtly reinforcing a sense of care and modern efficiency.
- The application will utilize 'Inter' (sans-serif) for all text elements. Its modern, clear, and neutral characteristics ensure high readability, essential for conveying mission-critical information and empathetic AI responses effectively.
- Icons will be clean, contemporary line-art, chosen for universal recognition and clarity, avoiding intricate details to ensure rapid comprehension for users in diverse circumstances.
- The layout will prioritize simplicity and responsiveness, featuring clean lines, ample white space, and a clear hierarchy of information to ensure accessibility and ease of use on any device, especially for stressed users.
- Subtle and purposeful animations will be employed for user feedback, such as successful transactions, message sending, and loading states, enhancing perceived responsiveness without causing distraction.