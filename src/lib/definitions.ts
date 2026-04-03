export type Transaction = {
  id: number; // bigint
  created_at: string;
  wallet_id: string; // uuid
  campaign_id: string | null; // uuid
  amount: number;
  transaction_type: 'AID_DISBURSEMENT' | 'PURCHASE' | 'FUNDS_RETURN';
  idempotency_key: string; // uuid
  description: string | null;
  metadata: any | null;
};

export type Wallet = {
  id: string; // uuid
  created_at: string;
  profile_id: string; // uuid
  balance: number;
};

export type Profile = {
  id: string; // uuid
  created_at: string;
  updated_at: string;
  full_name: string | null;
  national_id: string | null;
  phone_number: string | null;
  role: 'admin' | 'volunteer' | 'merchant' | 'victim';
};

export type Merchant = Profile & { role: 'merchant' };

export type Victim = Profile & { role: 'victim' };

export type Campaign = {
  id: string; // uuid
  created_at: string;
  name: string;
  description: string | null;
};

export type TriageSession = {
    id: number;
    created_at: string;
    victim_id: string;
    last_message: string | null;
    risk_score: number | null;
    escalated: boolean | null;
    notes: string | null;
    status: string;
    profiles: { full_name: string | null } | null;
};
