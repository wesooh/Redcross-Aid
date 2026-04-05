import { BalanceCard } from "@/components/wallet/balance-card";
import { QrDisplay } from "@/components/wallet/qr-display";
import { TransactionsTable } from "@/components/wallet/transactions-table";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createSupabaseServerAdminClient } from "@/lib/supabase/server-admin-client";
import type { Transaction } from "@/lib/definitions";
import { redirect } from "next/navigation";

async function getWalletData(userId: string) {
    const supabase = createSupabaseServerAdminClient();

    // Fetch as array to handle multiple/zero cases gracefully
    const { data: wallets, error: walletError } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('profile_id', userId);
    
    if (walletError) {
        console.error("Error fetching wallet:", walletError.message);
        return {
            userId: userId,
            balance: 0,
            transactions: [],
            error: "Could not load wallet data. There was a database error."
        };
    }

    if (!wallets || wallets.length === 0) {
        console.warn(`No wallet found for user: ${userId}`);
        // This might not be an error, but a user who isn't a victim
        return {
            userId: userId,
            balance: 0,
            transactions: [],
            error: "No aid wallet is associated with your account. Only registered victims have wallets."
        };
    }

    if (wallets.length > 1) {
        console.error(`Inconsistency: Multiple wallets found for user: ${userId}`);
        return {
            userId: userId,
            balance: 0,
            transactions: [],
            error: "Critical data error: Multiple wallets detected for a single user."
        };
    }

    const wallet = wallets[0];

    const { data: transactions, error: txError } = await supabase
        .from('ledger')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50); // Add a limit for performance

    if (txError) {
        console.error("Error fetching transactions:", txError);
        // Return partial data but still show balance
    }
    
    // Map ledger entries to the Transaction type expected by the frontend
    const formattedTransactions: Transaction[] = (transactions || []).map(tx => ({
        ...tx,
        timestamp: tx.created_at,
        type: tx.amount >= 0 ? 'credit' : 'debit'
    }));

    return {
        userId: userId,
        balance: wallet.balance,
        transactions: formattedTransactions,
    };
}


export default async function WalletPage() {
    const supabase = createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const walletData = await getWalletData(user.id);

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
