export type Transaction = {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  timestamp: string;
};

export type Wallet = {
  id: string;
  userId: string;
  balance: number;
  transactions: Transaction[];
};

export type Merchant = {
  id: string;
  name: string;
  walletId: string;
};

export type User = {
  id: string;
  name: string;
  walletId: string;
};
