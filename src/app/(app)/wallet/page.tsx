import { BalanceCard } from "@/components/wallet/balance-card";
import { QrDisplay } from "@/components/wallet/qr-display";
import { TransactionsTable } from "@/components/wallet/transactions-table";
import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import type { Transaction } from "@/lib/definitions";

// In a real app, this would come from an authentication context (e.g., Supabase Auth).
// For now, please replace this with a valid 'victim' role UUID from your 'profiles' table.
const FAKE_USER_ID = '123e4567-e89b-12d3-a456-426614174000'; // IMPORTANT: REPLACE WITH A REAL UUID

async function getWalletData() {
    const supabase = createSupabaseServerAdminClient();

    const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('profile_id', FAKE_USER_ID)
        .single();
    
    if (walletError || !wallet) {
        console.error("Error fetching wallet:", walletError?.message);
        return {
            userId: FAKE_USER_ID,
            balance: 0,
            transactions: [],
            error: "Could not load wallet data. Ensure the user ID is correct and a wallet exists."
        };
    }

    const { data: transactions, error: txError } = await supabase
        .from('ledger')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50); // Add a limit for performance

    if (txError) {
        console.error("Error fetching transactions:", txError);
        // Return partial data
    }
    
    // Map ledger entries to the Transaction type expected by the frontend
    const formattedTransactions: Transaction[] = (transactions || []).map(tx => ({
        ...tx,
        timestamp: tx.created_at,
        type: tx.amount >= 0 ? 'credit' : 'debit'
    }));

    return {
        userId: FAKE_USER_ID,
        balance: wallet.balance,
        transactions: formattedTransactions,
    };
}


export default async function WalletPage() {
    const walletData = await getWalletData();

    if (walletData.error) {
        return <div className="text-destructive font-semibold p-4 bg-destructive/10 rounded-md">{walletData.error}</div>
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="lg:col-span-2 space-y-4">
                <BalanceCard balance={walletData.balance} />
                <QrDisplay userId={walletData.userId} />
            </div>
            <div className="lg:col-span-5">
                <TransactionsTable transactions={walletData.transactions} />
            </div>
        </div>
    );
}
