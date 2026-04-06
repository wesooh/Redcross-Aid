# ResilienceLink: Smart Trust & PFA Triage

This is a Next.js application built in Firebase Studio. It serves as a secure digital voucher ecosystem for the Red Cross to manage and distribute aid to disaster victims. It also includes a bilingual AI-powered chatbot for providing immediate Psychosocial First Aid (PFA).

## Project Flow & User Roles

The platform is designed around four key user roles, each with a specific purpose and dashboard.

### 1. Admin

The Admin has the highest level of access and is responsible for overall platform management.

*   **Dashboard:** Gets a high-level overview of all platform activities, including total victims registered, total aid disbursed, active campaigns, and high-risk PFA triage alerts.
*   **User Management:** Can register, view, and delete Volunteers and Merchants. Admins can also view and delete Victims.
*   **Campaign Management:** Can create and view aid campaigns (e.g., "Likoni Flood Relief").
*   **Aid Disbursement:** Can distribute funds to victims for specific campaigns.
*   **Triage Queue:** Can review conversations flagged by the PFA chatbot as high-risk for manual intervention.

### 2. Volunteer

Volunteers are trusted individuals who can register aid recipients (victims) into the system.

*   **Dashboard:** The main view for a volunteer is a form to register new victims.
*   **Victim Registration:** They can onboard new victims by providing their full name, national ID, and county. This action automatically creates a profile and a digital wallet for the victim.
*   **Victim Management:** Can view a list of victims they have registered and delete them if necessary.

### 3. Merchant

Merchants are local shop owners and partners where victims can spend their digital aid vouchers.

*   **Dashboard:** The merchant dashboard is a simple payment terminal.
*   **Process Payments:** To process a payment, the merchant uses the victim's unique ID (from their QR code) and enters the purchase amount. This securely deducts the funds from the victim's wallet.

### 4. Victim (Aid Recipient)

Victims are the end-users of the aid. They have a secure digital wallet and access to mental health support.

*   **Dashboard:** Provides access to their wallet and the PFA chatbot.
*   **Digital Wallet:** Can view their current aid balance and a history of all transactions (aid received and purchases made).
*   **QR Code:** Has a unique QR code that contains their user ID. They present this to merchants to make purchases.
*   **PFA Chatbot:** Can have a private, secure conversation with the bilingual AI assistant for psychosocial support.

## Core Features

### Digital Wallet & Aid Disbursement

The system is built on a secure, ledger-based digital voucher system.

1.  **Registration:** Volunteers register victims, who are automatically assigned a digital wallet.
2.  **Disbursement:** Admins disburse aid to victims' wallets based on specific campaigns.
3.  **Transaction:** Victims use their QR code at partner merchant stores to purchase goods. The transaction is processed through the merchant's terminal.
4.  **Ledger:** All transactions are recorded on an immutable ledger for full transparency and accountability.

### PFA AI Chatbot & Triage

*   **Bilingual Support:** The chatbot can communicate in both English and Swahili to provide immediate psychological support.
*   **Sentiment Analysis:** It performs real-time analysis of the user's messages to detect their emotional state and risk level.
*   **PII Redaction:** It automatically redacts Personally Identifiable Information (PII) before processing and logging messages to ensure privacy.
*   **Escalation:** If the AI detects a high risk of self-harm or severe distress (risk score > 0.85), it automatically flags the conversation and adds it to the Admin's **Triage Queue** for a human counselor to review.

## Tech Stack

*   **Framework:** Next.js with App Router
*   **Database & Auth:** Supabase
*   **UI:** React, ShadCN UI, Tailwind CSS
*   **AI/Generative:** Google AI (via Genkit)
*   **Deployment:** Vercel
