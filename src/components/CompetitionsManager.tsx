import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trophy, Calendar, Users, Clock, RefreshCw, Trash2, Plus, Download, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";

const FORMULA_TYPES = [
  { value: "oddiy", label: "Oddiy" },
  { value: "formula5", label: "5-formula" },
  { value: "formula10plus", label: "10+ formula" },
  { value: "formula10minus", label: "10- formula" },
  { value: "hammasi", label: "Hammasi" },
];

export const CompetitionsManager = () => {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<"daily" | "weekly">("daily");
  const [newChallenge, setNewChallenge] = useState({
    formula_type: "hammasi",
    digit_count: 1,
    speed: 0.5,
    problem_count: 5,
    challenge_date: format(new Date(), "yyyy-MM-dd"),
  });

  // Kunlik musobaqalar
  const { data: dailyChallenges, isLoading: loadingChallenges } = useQuery({
    queryKey: ["admin-daily-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_challenges")
        .select("*")
        .order("challenge_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  // Haftalik musobaqalar
  const { data: weeklyChallenges, isLoading: loadingWeekly } = useQuery({
    queryKey: ["admin-weekly-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_challenges")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  // Kunlik natijalar
  const { data: challengeResults, isLoading: loadingResults } = useQuery({
    queryKey: ["admin-challenge-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_challenge_results")
        .select("*, daily_challenges(challenge_date)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Haftalik natijalar
  const { data: weeklyResults } = useQuery({
    queryKey: ["admin-weekly-results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_challenge_results")
        .select("*, weekly_challenges(week_start, week_end)")
        .order("total_score", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Kunlik musobaqa yaratish
  const createDailyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("daily_challenges").insert({
        challenge_date: newChallenge.challenge_date,
        formula_type: newChallenge.formula_type,
        digit_count: newChallenge.digit_count,
        speed: newChallenge.speed,
        problem_count: newChallenge.problem_count,
        seed: Math.floor(Math.random() * 1000000),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-daily-challenges"] });
      toast.success("Kunlik musobaqa yaratildi");
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Xatolik yuz berdi");
    },
  });

  // Haftalik musobaqa yaratish
  const createWeeklyMutation = useMutation({
    mutationFn: async () => {
      const weekStart = startOfWeek(new Date(newChallenge.challenge_date), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(newChallenge.challenge_date), { weekStartsOn: 1 });
      
      console.log("Creating weekly challenge:", {
        week_start: format(weekStart, "yyyy-MM-dd"),
        week_end: format(weekEnd, "yyyy-MM-dd"),
        formula_type: newChallenge.formula_type,
        digit_count: newChallenge.digit_count,
        speed: newChallenge.speed,
        problem_count: newChallenge.problem_count,
      });
      
      const { data, error } = await supabase.from("weekly_challenges").insert({
        week_start: format(weekStart, "yyyy-MM-dd"),
        week_end: format(weekEnd, "yyyy-MM-dd"),
        formula_type: newChallenge.formula_type,
        digit_count: newChallenge.digit_count,
        speed: newChallenge.speed,
        problem_count: newChallenge.problem_count,
        seed: Math.floor(Math.random() * 1000000),
      }).select();
      
      console.log("Insert result:", { data, error });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      console.log("Weekly challenge created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["admin-weekly-challenges"] });
      toast.success("Haftalik musobaqa yaratildi");
      setCreateDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Error creating weekly challenge:", error);
      toast.error(error.message || "Xatolik yuz berdi");
    },
  });

  // Kunlik musobaqani o'chirish
  const deleteDailyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-daily-challenges"] });
      toast.success("Musobaqa o'chirildi");
    },
    onError: () => {
      toast.error("Xatolik yuz berdi");
    },
  });

  // Haftalik musobaqani o'chirish
  const deleteWeeklyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("weekly_challenges").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-weekly-challenges"] });
      toast.success("Haftalik musobaqa o'chirildi");
    },
    onError: () => {
      toast.error("Xatolik yuz berdi");
    },
  });

  // Natijani o'chirish
  const deleteResultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_challenge_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenge-results"] });
      toast.success("Natija o'chirildi");
    },
    onError: () => {
      toast.error("Xatolik yuz berdi");
    },
  });

  // CSV eksport funksiyasi
  const exportToCSV = (type: "daily" | "weekly") => {
    let csvContent = "";
    let filename = "";

    if (type === "daily" && challengeResults) {
      csvContent = "Foydalanuvchi,Sana,Javob,To'g'ri javob,Natija,Ball,Vaqt (s)\n";
      challengeResults.forEach((result) => {
        const date = result.daily_challenges?.challenge_date
          ? format(new Date(result.daily_challenges.challenge_date), "dd.MM.yyyy")
          : "-";
        csvContent += `"${result.username}","${date}",${result.answer ?? "-"},${result.correct_answer},${result.is_correct ? "To'g'ri" : "Noto'g'ri"},${result.score},${(result.completion_time / 1000).toFixed(1)}\n`;
      });
      filename = `kunlik-natijalar-${format(new Date(), "yyyy-MM-dd")}.csv`;
    } else if (type === "weekly" && weeklyResults) {
      csvContent = "Foydalanuvchi,Hafta,Jami ball,O'yinlar soni,To'g'ri javoblar,Eng yaxshi vaqt\n";
      weeklyResults.forEach((result: any) => {
        const week = result.weekly_challenges
          ? `${format(new Date(result.weekly_challenges.week_start), "dd.MM")}-${format(new Date(result.weekly_challenges.week_end), "dd.MM.yyyy")}`
          : "-";
        csvContent += `"${result.username}","${week}",${result.total_score},${result.games_played},${result.correct_answers},${result.best_time ? (result.best_time / 1000).toFixed(1) : "-"}\n`;
      });
      filename = `haftalik-natijalar-${format(new Date(), "yyyy-MM-dd")}.csv`;
    }

    // BOM qo'shish UTF-8 uchun
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    toast.success("CSV fayl yuklab olindi");
  };

  const getFormulaLabel = (type: string) => {
    return FORMULA_TYPES.find((f) => f.value === type)?.label || type;
  };

  const totalParticipants = challengeResults?.length || 0;
  const uniqueUsers = new Set(challengeResults?.map((r) => r.user_id)).size;
  const correctAnswers = challengeResults?.filter((r) => r.is_correct).length || 0;

  const openCreateDialog = (type: "daily" | "weekly") => {
    setCreateType(type);
    setNewChallenge({
      formula_type: "hammasi",
      digit_count: 1,
      speed: 0.5,
      problem_count: type === "daily" ? 5 : 10,
      challenge_date: format(new Date(), "yyyy-MM-dd"),
    });
    setCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Statistika kartlari */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
                <Trophy className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Kunlik</p>
                <p className="text-lg md:text-2xl font-bold">{dailyChallenges?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-purple-500/10 rounded-lg">
                <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Haftalik</p>
                <p className="text-lg md:text-2xl font-bold">{weeklyChallenges?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Ishtirokchi</p>
                <p className="text-lg md:text-2xl font-bold">{uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">To'g'ri</p>
                <p className="text-lg md:text-2xl font-bold">{correctAnswers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="daily" className="text-xs md:text-sm py-2">Kunlik</TabsTrigger>
          <TabsTrigger value="weekly" className="text-xs md:text-sm py-2">Haftalik</TabsTrigger>
          <TabsTrigger value="daily-results" className="text-xs md:text-sm py-2">Natijalar</TabsTrigger>
          <TabsTrigger value="weekly-results" className="text-xs md:text-sm py-2">Hafta nat.</TabsTrigger>
        </TabsList>

        {/* Kunlik musobaqalar */}
        <TabsContent value="daily" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base md:text-lg">Kunlik musobaqalar</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-daily-challenges"] })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => openCreateDialog("daily")}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Yangi</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingChallenges ? (
                <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
              ) : !dailyChallenges?.length ? (
                <div className="text-center py-8 text-muted-foreground">Musobaqalar topilmadi</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Formula</TableHead>
                        <TableHead className="hidden sm:table-cell">Raqam</TableHead>
                        <TableHead className="hidden sm:table-cell">Tezlik</TableHead>
                        <TableHead className="hidden sm:table-cell">Misollar</TableHead>
                        <TableHead className="text-right">Amal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyChallenges.map((challenge) => (
                        <TableRow key={challenge.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(challenge.challenge_date), "dd.MM.yy")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="text-xs">{getFormulaLabel(challenge.formula_type)}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{challenge.digit_count}</TableCell>
                          <TableCell className="hidden sm:table-cell">{challenge.speed}s</TableCell>
                          <TableCell className="hidden sm:table-cell">{challenge.problem_count}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              onClick={() => deleteDailyMutation.mutate(challenge.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Haftalik musobaqalar */}
        <TabsContent value="weekly" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base md:text-lg">Haftalik musobaqalar</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-weekly-challenges"] })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => openCreateDialog("weekly")}>
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Yangi</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingWeekly ? (
                <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
              ) : !weeklyChallenges?.length ? (
                <div className="text-center py-8 text-muted-foreground">Haftalik musobaqalar topilmadi</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hafta</TableHead>
                        <TableHead>Formula</TableHead>
                        <TableHead className="hidden sm:table-cell">Raqam</TableHead>
                        <TableHead className="hidden sm:table-cell">Tezlik</TableHead>
                        <TableHead className="hidden sm:table-cell">Misollar</TableHead>
                        <TableHead className="text-right">Amal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyChallenges.map((challenge: any) => (
                        <TableRow key={challenge.id}>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(challenge.week_start), "dd.MM")}-{format(new Date(challenge.week_end), "dd.MM")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="text-xs">{getFormulaLabel(challenge.formula_type)}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{challenge.digit_count}</TableCell>
                          <TableCell className="hidden sm:table-cell">{challenge.speed}s</TableCell>
                          <TableCell className="hidden sm:table-cell">{challenge.problem_count}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              onClick={() => deleteWeeklyMutation.mutate(challenge.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kunlik natijalar */}
        <TabsContent value="daily-results" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base md:text-lg">Kunlik natijalar</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV("daily")}>
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-challenge-results"] })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingResults ? (
                <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
              ) : !challengeResults?.length ? (
                <div className="text-center py-8 text-muted-foreground">Natijalar topilmadi</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Foydalanuvchi</TableHead>
                        <TableHead className="hidden sm:table-cell">Sana</TableHead>
                        <TableHead>Natija</TableHead>
                        <TableHead>Ball</TableHead>
                        <TableHead className="hidden sm:table-cell">Vaqt</TableHead>
                        <TableHead className="text-right">Amal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challengeResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium text-xs md:text-sm">{result.username}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {result.daily_challenges?.challenge_date
                                ? format(new Date(result.daily_challenges.challenge_date), "dd.MM")
                                : "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={result.is_correct ? "default" : "destructive"} className="text-xs">
                              {result.is_correct ? "✓" : "✗"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{result.score}</TableCell>
                          <TableCell className="hidden sm:table-cell">{(result.completion_time / 1000).toFixed(1)}s</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              onClick={() => deleteResultMutation.mutate(result.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Haftalik natijalar */}
        <TabsContent value="weekly-results" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base md:text-lg">Haftalik natijalar</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToCSV("weekly")}>
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">CSV</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-weekly-results"] })}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!weeklyResults?.length ? (
                <div className="text-center py-8 text-muted-foreground">Haftalik natijalar topilmadi</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Foydalanuvchi</TableHead>
                        <TableHead>Ball</TableHead>
                        <TableHead className="hidden sm:table-cell">O'yinlar</TableHead>
                        <TableHead className="hidden sm:table-cell">To'g'ri</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyResults.map((result: any, index: number) => (
                        <TableRow key={result.id}>
                          <TableCell>
                            {index < 3 ? (
                              <span className={`text-lg ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600"}`}>
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-xs md:text-sm">{result.username}</TableCell>
                          <TableCell className="font-bold text-primary">{result.total_score}</TableCell>
                          <TableCell className="hidden sm:table-cell">{result.games_played}</TableCell>
                          <TableCell className="hidden sm:table-cell">{result.correct_answers}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Musobaqa yaratish dialogi */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {createType === "daily" ? "Yangi kunlik musobaqa" : "Yangi haftalik musobaqa"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{createType === "daily" ? "Sana" : "Hafta (sana tanlang)"}</Label>
              <Input
                type="date"
                value={newChallenge.challenge_date}
                onChange={(e) => setNewChallenge({ ...newChallenge, challenge_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Formula turi</Label>
              <Select
                value={newChallenge.formula_type}
                onValueChange={(value) => setNewChallenge({ ...newChallenge, formula_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMULA_TYPES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Raqamlar</Label>
                <Select
                  value={String(newChallenge.digit_count)}
                  onValueChange={(value) => setNewChallenge({ ...newChallenge, digit_count: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 xonali</SelectItem>
                    <SelectItem value="2">2 xonali</SelectItem>
                    <SelectItem value="3">3 xonali</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tezlik</Label>
                <Select
                  value={String(newChallenge.speed)}
                  onValueChange={(value) => setNewChallenge({ ...newChallenge, speed: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.3">0.3s</SelectItem>
                    <SelectItem value="0.5">0.5s</SelectItem>
                    <SelectItem value="0.7">0.7s</SelectItem>
                    <SelectItem value="1">1s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Misollar</Label>
                <Select
                  value={String(newChallenge.problem_count)}
                  onValueChange={(value) => setNewChallenge({ ...newChallenge, problem_count: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 ta</SelectItem>
                    <SelectItem value="7">7 ta</SelectItem>
                    <SelectItem value="10">10 ta</SelectItem>
                    <SelectItem value="15">15 ta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Bekor
            </Button>
            <Button
              onClick={() => {
                if (createType === "daily") {
                  createDailyMutation.mutate();
                } else {
                  createWeeklyMutation.mutate();
                }
              }}
              disabled={createDailyMutation.isPending || createWeeklyMutation.isPending}
            >
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
