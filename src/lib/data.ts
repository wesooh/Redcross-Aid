import type { User, Wallet, Merchant } from './definitions';

export const users: User[] = [
  { id: 'user-1', name: 'Amina Yusuf', walletId: 'wallet-1' },
];

export const wallets: Wallet[] = [
  {
    id: 'wallet-1',
    userId: 'user-1',
    balance: 1575.50,
    transactions: [
      { id: 'txn-1', amount: 2000.00, type: 'credit', description: 'Initial Aid Disbursement', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'txn-2', amount: 250.00, type: 'debit', description: 'Purchase at Duka la Mama', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'txn-3', amount: 174.50, type: 'debit', description: 'Purchase at Soko la Mjini', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'wallet-merchant-1',
    userId: 'merchant-1',
    balance: 12420.00,
    transactions: [],
  },
  {
    id: 'wallet-merchant-2',
    userId: 'merchant-2',
    balance: 8765.25,
    transactions: [],
  },
];

export const merchants: Merchant[] = [
    { id: 'merchant-1', name: 'Duka la Mama', walletId: 'wallet-merchant-1' },
    { id: 'merchant-2', name: 'Soko la Mjini', walletId: 'wallet-merchant-2' },
];
