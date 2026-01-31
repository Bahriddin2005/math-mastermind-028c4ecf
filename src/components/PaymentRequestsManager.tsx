import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  CreditCard, 
  Check, 
  X, 
  Eye, 
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

interface PaymentRequest {
  id: string;
  user_id: string;
  plan_type: string;
  amount: number;
  receipt_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  reviewed_at: string | null;
  subscription_end: string | null;
  created_at: string;
}

const PLAN_LABELS: Record<string, string> = {
  'bolajon_monthly': 'Bolajon PRO (Oylik)',
  'bolajon_yearly': 'Bolajon PRO (Yillik)',
  'ustoz_monthly': 'Ustoz PRO (Oylik)',
  'ustoz_yearly': 'Ustoz PRO (Yillik)',
};

export const PaymentRequestsManager = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  // Fetch user profiles for username display
  const { data: profiles } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username');
      if (error) throw error;
      return data;
    },
  });

  const getUserInfo = (userId: string) => {
    const profile = profiles?.find(p => p.user_id === userId);
    return {
      username: profile?.username || 'Noma\'lum',
    };
  };

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['payment-requests', filter],
    queryFn: async () => {
      let query = supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentRequest[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: 'approve' | 'reject'; note: string }) => {
      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_note: note,
        reviewed_at: new Date().toISOString(),
      };

      // If approving, set subscription end date
      if (action === 'approve' && selectedRequest) {
        const isYearly = selectedRequest.plan_type.includes('yearly');
        const endDate = new Date();
        if (isYearly) {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }
        updateData.subscription_end = endDate.toISOString();
      }

      const { error } = await supabase
        .from('payment_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Send Telegram notification
      if (selectedRequest) {
        const userInfo = getUserInfo(selectedRequest.user_id);
        try {
          await supabase.functions.invoke('send-telegram-notification', {
            body: {
              type: action === 'approve' ? 'payment_approved' : 'payment_rejected',
              username: userInfo.username,
              planType: selectedRequest.plan_type,
              amount: selectedRequest.amount,
              adminNote: note,
              receiptUrl: selectedRequest.receipt_url,
              requestDate: selectedRequest.created_at,
            },
          });
        } catch (telegramError) {
          console.error('Telegram notification failed:', telegramError);
          // Don't throw - payment was processed, just notification failed
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      toast.success(
        variables.action === 'approve' 
          ? "To'lov tasdiqlandi va obuna faollashtirildi" 
          : "To'lov rad etildi"
      );
      setReviewDialogOpen(false);
      setAdminNote('');
      setSelectedRequest(null);
    },
    onError: (error) => {
      console.error('Review error:', error);
      toast.error("Xatolik yuz berdi");
    },
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30 bg-amber-500/10"><Clock className="w-3 h-3" /> Kutilmoqda</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-emerald-500"><CheckCircle2 className="w-3 h-3" /> Tasdiqlangan</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rad etilgan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const openReviewDialog = (request: PaymentRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setAdminNote('');
    setReviewDialogOpen(true);
  };

  const handleReview = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      id: selectedRequest.id,
      action: reviewAction,
      note: adminNote,
    });
  };

  const filteredRequests = requests?.filter(r => {
    if (!searchTerm) return true;
    return r.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.plan_type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">To'lov so'rovlari</CardTitle>
              <p className="text-sm text-muted-foreground">
                Foydalanuvchilardan kelgan to'lov so'rovlarini boshqaring
              </p>
            </div>
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white">{pendingCount} yangi</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Yangilash
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-2">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'pending' && 'Kutilmoqda'}
                {f === 'approved' && 'Tasdiqlangan'}
                {f === 'rejected' && 'Rad etilgan'}
                {f === 'all' && 'Hammasi'}
              </Button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredRequests?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Hozircha so'rovlar yo'q
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sana</TableHead>
                  <TableHead>Reja</TableHead>
                  <TableHead>Summa</TableHead>
                  <TableHead>Chek</TableHead>
                  <TableHead>Holat</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="text-sm">
                      {format(new Date(request.created_at), 'dd MMM, HH:mm', { locale: uz })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{PLAN_LABELS[request.plan_type] || request.plan_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(request.amount)}
                    </TableCell>
                    <TableCell>
                      {request.receipt_url ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReceiptDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ko'rish
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">Yo'q</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => openReviewDialog(request, 'approve')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openReviewDialog(request, 'reject')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      {request.status !== 'pending' && request.admin_note && (
                        <span className="text-xs text-muted-foreground">{request.admin_note}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? "To'lovni tasdiqlash" : "To'lovni rad etish"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {PLAN_LABELS[selectedRequest.plan_type]} - {formatAmount(selectedRequest.amount)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Izoh (ixtiyoriy)</label>
              <Textarea
                placeholder="Admin izohi..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className={reviewAction === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
              variant={reviewAction === 'reject' ? 'destructive' : 'default'}
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {reviewAction === 'approve' ? 'Tasdiqlash' : 'Rad etish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>To'lov cheki</DialogTitle>
          </DialogHeader>
          {selectedRequest?.receipt_url && (
            <img
              src={selectedRequest.receipt_url}
              alt="To'lov cheki"
              className="w-full rounded-lg border"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
