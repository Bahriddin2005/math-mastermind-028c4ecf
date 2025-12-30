import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Calendar, Users, Clock, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const CompetitionsManager = () => {
  const queryClient = useQueryClient();

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

  // Musobaqa natijalari
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

  // Musobaqani o'chirish
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("daily_challenges")
        .delete()
        .eq("id", id);
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

  // Natijani o'chirish
  const deleteResultMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("daily_challenge_results")
        .delete()
        .eq("id", id);
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

  const getFormulaLabel = (type: string) => {
    const labels: Record<string, string> = {
      oddiy: "Oddiy",
      formula5: "5-formula",
      formula10plus: "10+ formula",
      formula10minus: "10- formula",
      hammasi: "Hammasi",
    };
    return labels[type] || type;
  };

  const totalParticipants = challengeResults?.length || 0;
  const uniqueUsers = new Set(challengeResults?.map((r) => r.user_id)).size;
  const correctAnswers = challengeResults?.filter((r) => r.is_correct).length || 0;

  return (
    <div className="space-y-6">
      {/* Statistika kartlari */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jami musobaqalar</p>
                <p className="text-2xl font-bold">{dailyChallenges?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ishtirokchilar</p>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jami urinishlar</p>
                <p className="text-2xl font-bold">{totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">To'g'ri javoblar</p>
                <p className="text-2xl font-bold">{correctAnswers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="challenges" className="w-full">
        <TabsList>
          <TabsTrigger value="challenges">Musobaqalar</TabsTrigger>
          <TabsTrigger value="results">Natijalar</TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Kunlik musobaqalar</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-daily-challenges"] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yangilash
              </Button>
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
                        <TableHead>Formula turi</TableHead>
                        <TableHead>Raqamlar</TableHead>
                        <TableHead>Tezlik</TableHead>
                        <TableHead>Misollar soni</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dailyChallenges.map((challenge) => (
                        <TableRow key={challenge.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {format(new Date(challenge.challenge_date), "dd.MM.yyyy")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>{getFormulaLabel(challenge.formula_type)}</Badge>
                          </TableCell>
                          <TableCell>{challenge.digit_count} xonali</TableCell>
                          <TableCell>{challenge.speed}s</TableCell>
                          <TableCell>{challenge.problem_count} ta</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(challenge.id)}
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

        <TabsContent value="results" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Musobaqa natijalari</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-challenge-results"] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Yangilash
              </Button>
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
                        <TableHead>Sana</TableHead>
                        <TableHead>Javob</TableHead>
                        <TableHead>To'g'ri javob</TableHead>
                        <TableHead>Natija</TableHead>
                        <TableHead>Ball</TableHead>
                        <TableHead>Vaqt</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challengeResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {result.daily_challenges?.challenge_date
                                ? format(new Date(result.daily_challenges.challenge_date), "dd.MM.yyyy")
                                : "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>{result.answer ?? "-"}</TableCell>
                          <TableCell>{result.correct_answer}</TableCell>
                          <TableCell>
                            <Badge variant={result.is_correct ? "default" : "destructive"}>
                              {result.is_correct ? "To'g'ri" : "Noto'g'ri"}
                            </Badge>
                          </TableCell>
                          <TableCell>{result.score}</TableCell>
                          <TableCell>{(result.completion_time / 1000).toFixed(1)}s</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
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
      </Tabs>
    </div>
  );
};
