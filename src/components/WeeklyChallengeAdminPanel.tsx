import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek } from 'date-fns';

interface WeeklyChallenge {
  id: string;
  week_start: string;
  week_end: string;
  formula_type: string;
  digit_count: number;
  speed: number;
  problem_count: number;
  seed: number;
}

interface ChallengeFormData {
  week_start: string;
  week_end: string;
  formula_type: string;
  digit_count: number;
  speed: number;
  problem_count: number;
}

const formulaTypes = [
  { value: 'oddiy', label: 'Oddiy' },
  { value: 'formula5', label: '5-formula' },
  { value: 'formula10plus', label: '10+ formula' },
  { value: 'formula10minus', label: '10- formula' },
  { value: 'hammasi', label: 'Hammasi' },
];

const getNextMondayDates = () => {
  const today = new Date();
  const nextMonday = startOfWeek(addDays(today, 7), { weekStartsOn: 1 });
  const nextSunday = addDays(nextMonday, 6);
  return {
    week_start: format(nextMonday, 'yyyy-MM-dd'),
    week_end: format(nextSunday, 'yyyy-MM-dd'),
  };
};

export const WeeklyChallengeAdminPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<WeeklyChallenge | null>(null);
  
  const nextWeekDates = getNextMondayDates();
  const [formData, setFormData] = useState<ChallengeFormData>({
    week_start: nextWeekDates.week_start,
    week_end: nextWeekDates.week_end,
    formula_type: 'oddiy',
    digit_count: 1,
    speed: 0.5,
    problem_count: 5,
  });

  // Check if user is admin
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch all weekly challenges
  const { data: challenges, isLoading } = useQuery({
    queryKey: ['admin-weekly-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_challenges')
        .select('*')
        .order('week_start', { ascending: false });
      if (error) throw error;
      return data as WeeklyChallenge[];
    },
    enabled: isAdmin === true,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: ChallengeFormData) => {
      const { error } = await supabase.from('weekly_challenges').insert({
        ...data,
        seed: Math.floor(Math.random() * 1000000),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-challenge-game'] });
      toast.success("Musobaqa muvaffaqiyatli yaratildi!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChallengeFormData }) => {
      const { error } = await supabase
        .from('weekly_challenges')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-challenge-game'] });
      toast.success("Musobaqa yangilandi!");
      setDialogOpen(false);
      setEditingChallenge(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('weekly_challenges')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-weekly-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-challenge-game'] });
      toast.success("Musobaqa o'chirildi!");
    },
    onError: (error: Error) => {
      toast.error("Xatolik: " + error.message);
    },
  });

  const resetForm = () => {
    const dates = getNextMondayDates();
    setFormData({
      week_start: dates.week_start,
      week_end: dates.week_end,
      formula_type: 'oddiy',
      digit_count: 1,
      speed: 0.5,
      problem_count: 5,
    });
  };

  const handleEdit = (challenge: WeeklyChallenge) => {
    setEditingChallenge(challenge);
    setFormData({
      week_start: challenge.week_start,
      week_end: challenge.week_end,
      formula_type: challenge.formula_type,
      digit_count: challenge.digit_count,
      speed: challenge.speed,
      problem_count: challenge.problem_count,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingChallenge) {
      updateMutation.mutate({ id: editingChallenge.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Haqiqatan ham o'chirmoqchimisiz?")) {
      deleteMutation.mutate(id);
    }
  };

  const isCurrentWeek = (challenge: WeeklyChallenge) => {
    const today = new Date().toISOString().split('T')[0];
    return challenge.week_start <= today && challenge.week_end >= today;
  };

  const getFormulaLabel = (type: string) => {
    const formula = formulaTypes.find(f => f.value === type);
    return formula?.label || type;
  };

  // Don't render if not admin
  if (isAdminLoading || !isAdmin) {
    return null;
  }

  return (
    <Card className="mb-6 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-amber-500" />
            Admin Panel
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingChallenge(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Yangi musobaqa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingChallenge ? 'Musobaqani tahrirlash' : 'Yangi musobaqa yaratish'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Boshlanish sanasi</Label>
                    <Input
                      type="date"
                      value={formData.week_start}
                      onChange={(e) => setFormData(prev => ({ ...prev, week_start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tugash sanasi</Label>
                    <Input
                      type="date"
                      value={formData.week_end}
                      onChange={(e) => setFormData(prev => ({ ...prev, week_end: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Formula turi</Label>
                  <Select
                    value={formData.formula_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, formula_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formulaTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Xona soni</Label>
                    <Select
                      value={String(formData.digit_count)}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, digit_count: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={String(num)}>{num} xonali</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Tezlik (s)</Label>
                    <Select
                      value={String(formData.speed)}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, speed: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0.3, 0.5, 0.7, 1.0, 1.5, 2.0].map((speed) => (
                          <SelectItem key={speed} value={String(speed)}>{speed}s</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Misollar</Label>
                    <Select
                      value={String(formData.problem_count)}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, problem_count: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 7, 10, 12, 15, 20].map((count) => (
                          <SelectItem key={count} value={String(count)}>{count} ta</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saqlanmoqda...' : (editingChallenge ? 'Yangilash' : 'Yaratish')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm text-center py-4">Yuklanmoqda...</p>
        ) : challenges && challenges.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hafta</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead>Sozlamalar</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challenges.map((challenge) => (
                  <TableRow key={challenge.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {format(new Date(challenge.week_start), 'dd.MM')} - {format(new Date(challenge.week_end), 'dd.MM.yy')}
                        </span>
                        {isCurrentWeek(challenge) && (
                          <Badge variant="default" className="text-xs">Faol</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getFormulaLabel(challenge.formula_type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {challenge.digit_count}x, {challenge.speed}s, {challenge.problem_count} misol
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(challenge)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(challenge.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">
            Hozircha musobaqalar yo'q
          </p>
        )}
      </CardContent>
    </Card>
  );
};
