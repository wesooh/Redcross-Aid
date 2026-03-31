import { BalanceCard } from "@/components/wallet/balance-card";
import { QrDisplay } from "@/components/wallet/qr-display";
import { TransactionsTable } from "@/components/wallet/transactions-table";
import { users, wallets } from "@/lib/data";

// In a real app, this would come from an authentication context
const FAKE_USER_ID = 'user-1';

async function getWalletData() {
    const user = users.find(u => u.id === FAKE_USER_ID);
    if (!user) return null;

    const wallet = wallets.find(w => w.id === user.walletId);
    if (!wallet) return null;

    return {
        userId: user.id,
        balance: wallet.balance,
        transactions: wallet.transactions,
    };
}


export default async function WalletPage() {
    const walletData = await getWalletData();

    if (!walletData) {
        return <div>Could not load wallet data. Please try again.</div>
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
