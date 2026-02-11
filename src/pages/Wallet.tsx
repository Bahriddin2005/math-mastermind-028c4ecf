import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Clock, TrendingUp, CreditCard, Gift, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const TX_TYPE_MAP: Record<string, { label: string; icon: typeof ArrowUpCircle; color: string }> = {
  topup: { label: 'To\'ldirish', icon: ArrowUpCircle, color: 'text-green-500' },
  spend: { label: 'Sarflash', icon: ArrowDownCircle, color: 'text-red-500' },
  bonus: { label: 'Bonus', icon: Gift, color: 'text-amber-500' },
  payout: { label: 'Yechish', icon: CreditCard, color: 'text-blue-500' },
  refund: { label: 'Qaytarish', icon: RefreshCw, color: 'text-purple-500' },
};

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Kutilmoqda', variant: 'secondary' },
  completed: { label: 'Bajarildi', variant: 'default' },
  failed: { label: 'Xato', variant: 'destructive' },
  cancelled: { label: 'Bekor', variant: 'outline' },
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('uz-UZ').format(amount);
};

const WalletPage = () => {
  const { soundEnabled, toggleSound } = useSound();
  const { wallet, transactions, loading } = useWallet();

  return (
    <div className="min-h-screen bg-background">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6 pb-24">
        {/* Balans kartasi */}
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/20">
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-48" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <WalletIcon className="h-4 w-4" />
                  <span>Balans</span>
                  {wallet?.is_frozen && <Badge variant="destructive" className="text-xs">Muzlatilgan</Badge>}
                </div>
                <p className="text-4xl font-bold text-foreground">
                  {formatAmount(wallet?.balance || 0)} <span className="text-lg text-muted-foreground">so'm</span>
                </p>
                <div className="flex gap-3 mt-4">
                  <Button className="flex-1 gap-2" size="lg">
                    <ArrowUpCircle className="h-4 w-4" />
                    To'ldirish
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2" size="lg" disabled={!wallet?.balance}>
                    <CreditCard className="h-4 w-4" />
                    Yechish
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Qisqa statistika */}
        {!loading && wallet && (
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Jami kirim</p>
                <p className="text-lg font-bold text-green-600">+{formatAmount(wallet.total_topup + wallet.total_bonus)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Jami chiqim</p>
                <p className="text-lg font-bold text-red-500">-{formatAmount(wallet.total_spent + wallet.total_payout)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tranzaksiyalar tarixi */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Tranzaksiyalar tarixi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Hali tranzaksiyalar yo'q</p>
                <p className="text-xs mt-1">Balansni to'ldirib mashq qilishni boshlang!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => {
                  const typeInfo = TX_TYPE_MAP[tx.tx_type] || TX_TYPE_MAP.topup;
                  const statusInfo = STATUS_MAP[tx.status] || STATUS_MAP.pending;
                  const Icon = typeInfo.icon;
                  const isPositive = tx.amount > 0;

                  return (
                    <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-muted ${typeInfo.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || typeInfo.label}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'dd.MM.yyyy HH:mm')}
                          </span>
                          <Badge variant={statusInfo.variant} className="text-[10px] px-1.5 py-0">
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{formatAmount(tx.amount)} so'm
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default WalletPage;
