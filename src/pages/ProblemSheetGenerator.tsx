import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { PageBackground } from '@/components/layout/PageBackground';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, FileText, Save, FolderOpen, Trash2, Loader2, Share2, Copy, Globe, Lock, Columns, Hash, Calculator, Layers, LayoutGrid } from 'lucide-react';
import { generateProblem, getLegacyFormulas, FORMULA_LABELS, validateProblemSequence } from '@/lib/sorobanEngine';
import { ProblemSheetTable } from '@/components/ProblemSheetTable';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';


interface Problem {
  id: number;
  sequence: number[];
  answer: number;
}

interface GeneratedSheet {
  problems: Problem[];
  settings: {
    digitCount: number;
    operationCount: number;
    formulaType: string;
    problemCount: number;
  };
}

interface SavedSheet {
  id: string;
  title: string;
  digit_count: number;
  operation_count: number;
  formula_type: string;
  problem_count: number;
  columns_per_row: number;
  problems: Problem[];
  created_at: string;
  is_public: boolean;
  share_code: string | null;
}

const settingsConfig = [
  { id: 'digitCount', label: 'Xona soni', icon: Hash },
  { id: 'operationCount', label: 'Ustun soni', icon: Columns },
  { id: 'formulaType', label: 'Formula turi', icon: Calculator },
  { id: 'problemCount', label: 'Misollar soni', icon: Layers },
  { id: 'columnsPerRow', label: 'Qatorga ustun', icon: LayoutGrid },
];

const ProblemSheetGenerator = () => {
  const { soundEnabled, toggleSound, playSound } = useSound();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Settings
  const [digitCount, setDigitCount] = useState(1);
  const [operationCount, setOperationCount] = useState(8);
  const [formulaType, setFormulaType] = useState('formulasiz');
  const [problemCount, setProblemCount] = useState(50);
  const [columnsPerRow, setColumnsPerRow] = useState(10);
  
  // Generated sheet
  const [sheet, setSheet] = useState<GeneratedSheet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Saved sheets
  const [savedSheets, setSavedSheets] = useState<SavedSheet[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingSheet, setSavingSheet] = useState(false);
  const [sheetTitle, setSheetTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [currentShareSheet, setCurrentShareSheet] = useState<SavedSheet | null>(null);
  const [updatingShare, setUpdatingShare] = useState(false);
  
  const playClick = () => playSound('tick');
  
  // Load shared sheet from URL
  useEffect(() => {
    const shareCode = searchParams.get('code');
    if (shareCode) {
      loadSharedSheet(shareCode);
    }
  }, [searchParams]);
  
  const loadSharedSheet = async (code: string) => {
    setLoadingSaved(true);
    const { data, error } = await supabase
      .from('problem_sheets')
      .select('*')
      .eq('share_code', code)
      .eq('is_public', true)
      .single();
    
    if (error || !data) {
      toast.error("Varaq topilmadi yoki yopiq");
    } else {
      const savedSheet = { ...data, problems: data.problems as unknown as Problem[] };
      setDigitCount(savedSheet.digit_count);
      setOperationCount(savedSheet.operation_count);
      setFormulaType(savedSheet.formula_type);
      setProblemCount(savedSheet.problem_count);
      setColumnsPerRow(savedSheet.columns_per_row);
      setSheet({
        problems: savedSheet.problems,
        settings: {
          digitCount: savedSheet.digit_count,
          operationCount: savedSheet.operation_count,
          formulaType: savedSheet.formula_type,
          problemCount: savedSheet.problem_count,
        },
      });
      toast.success(`"${savedSheet.title}" yuklandi`);
    }
    setLoadingSaved(false);
  };
  
  const fetchSavedSheets = useCallback(async () => {
    if (!user) return;
    setLoadingSaved(true);
    const { data, error } = await supabase
      .from('problem_sheets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching sheets:', error);
    } else {
      setSavedSheets((data || []).map(d => ({ ...d, problems: d.problems as unknown as Problem[] })));
    }
    setLoadingSaved(false);
  }, [user]);
  
  useEffect(() => {
    if (showLoadDialog) fetchSavedSheets();
  }, [showLoadDialog, fetchSavedSheets]);
  
  const saveSheet = async () => {
    if (!user || !sheet) return;
    if (!sheetTitle.trim()) { toast.error("Iltimos, varaq nomini kiriting"); return; }
    setSavingSheet(true);
    const { error } = await supabase
      .from('problem_sheets')
      .insert([{
        user_id: user.id, title: sheetTitle.trim(),
        digit_count: digitCount, operation_count: operationCount,
        formula_type: formulaType, problem_count: problemCount,
        columns_per_row: columnsPerRow,
        problems: JSON.parse(JSON.stringify(sheet.problems)),
      }]);
    if (error) { toast.error("Saqlashda xatolik yuz berdi"); }
    else { toast.success("Varaq muvaffaqiyatli saqlandi!"); setShowSaveDialog(false); setSheetTitle(''); }
    setSavingSheet(false);
  };
  
  const loadSheet = (savedSheet: SavedSheet) => {
    setDigitCount(savedSheet.digit_count);
    setOperationCount(savedSheet.operation_count);
    setFormulaType(savedSheet.formula_type);
    setProblemCount(savedSheet.problem_count);
    setColumnsPerRow(savedSheet.columns_per_row);
    setSheet({
      problems: savedSheet.problems,
      settings: {
        digitCount: savedSheet.digit_count, operationCount: savedSheet.operation_count,
        formulaType: savedSheet.formula_type, problemCount: savedSheet.problem_count,
      },
    });
    setShowLoadDialog(false);
    toast.success(`"${savedSheet.title}" yuklandi`);
  };
  
  const deleteSheet = async (id: string) => {
    const { error } = await supabase.from('problem_sheets').delete().eq('id', id);
    if (error) { toast.error("O'chirishda xatolik"); }
    else { setSavedSheets(prev => prev.filter(s => s.id !== id)); toast.success("Varaq o'chirildi"); }
  };
  
  const generateShareCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };
  
  const toggleSheetPublic = async (sheet: SavedSheet, makePublic: boolean) => {
    setUpdatingShare(true);
    const shareCode = makePublic && !sheet.share_code ? generateShareCode() : sheet.share_code;
    const { error } = await supabase
      .from('problem_sheets')
      .update({ is_public: makePublic, share_code: makePublic ? shareCode : sheet.share_code })
      .eq('id', sheet.id);
    if (error) { toast.error("Xatolik yuz berdi"); }
    else {
      setSavedSheets(prev => prev.map(s => s.id === sheet.id ? { ...s, is_public: makePublic, share_code: shareCode } : s));
      setCurrentShareSheet(prev => prev ? { ...prev, is_public: makePublic, share_code: shareCode } : null);
      toast.success(makePublic ? "Varaq ommaviy qilindi" : "Varaq yopiq qilindi");
    }
    setUpdatingShare(false);
  };
  
  const copyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/problem-sheet?code=${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Havola nusxalandi!");
  };
  
  const openShareDialog = (sheet: SavedSheet) => {
    setCurrentShareSheet(sheet);
    setShowShareDialog(true);
  };
  
  const generateSheet = useCallback(() => {
    playClick();
    setIsGenerating(true);
    setTimeout(() => {
      const problems: GeneratedSheet['problems'] = [];
      const allowedFormulas = getLegacyFormulas(formulaType);
      for (let i = 0; i < problemCount; i++) {
        const problem = generateProblem({ digitCount, operationCount, allowedFormulas, ensurePositiveResult: true });
        const fullSequence = [problem.startValue, ...problem.sequence];
        const isLengthOk = fullSequence.length === operationCount;
        const hasEmpty = fullSequence.some(n => n === undefined || n === null || Number.isNaN(n));
        const validation = validateProblemSequence(fullSequence, allowedFormulas);
        if (isLengthOk && !hasEmpty && validation.isValid) {
          problems.push({ id: i + 1, sequence: fullSequence, answer: problem.finalAnswer });
        } else { i--; }
      }
      setSheet({ problems, settings: { digitCount, operationCount, formulaType, problemCount } });
      setIsGenerating(false);
    }, 100);
  }, [digitCount, operationCount, formulaType, problemCount, playClick]);
  
  const downloadPDF = useCallback(() => {
    if (!sheet) return;
    playClick();
    const formulaLabel = FORMULA_LABELS[formulaType]?.label || formulaType;
    const title = `${sheet.settings.operationCount} ustun ${formulaLabel} ${sheet.settings.digitCount} xona`;
    const fileName = `IqroMax_${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPos = margin;
    
    doc.setFontSize(16); doc.setTextColor(33, 150, 243);
    doc.text('IqroMax', pageWidth / 2, yPos + 5, { align: 'center' });
    doc.setFontSize(12); doc.setTextColor(100);
    doc.text(title, pageWidth / 2, yPos + 12, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`${sheet.settings.problemCount} ta misol • ${new Date().toLocaleDateString('uz-UZ')}`, pageWidth / 2, yPos + 18, { align: 'center' });
    yPos += 25;
    doc.setDrawColor(33, 150, 243); doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    const totalRows = Math.ceil(sheet.problems.length / columnsPerRow);
    const cellWidth = (pageWidth - 2 * margin) / columnsPerRow;
    const cellHeight = 6;
    
    for (let row = 0; row < totalRows; row++) {
      const startIdx = row * columnsPerRow;
      const rowProblems = sheet.problems.slice(startIdx, startIdx + columnsPerRow);
      if (rowProblems.length === 0) continue;
      const maxOps = Math.max(...rowProblems.map(p => p.sequence.length));
      const tableHeight = (maxOps + 2) * cellHeight;
      if (yPos + tableHeight > pageHeight - margin) { doc.addPage(); yPos = margin; }
      
      doc.setFillColor(99, 102, 241); doc.setTextColor(255, 255, 255); doc.setFontSize(9);
      rowProblems.forEach((p, idx) => {
        const x = margin + idx * cellWidth;
        doc.rect(x, yPos, cellWidth, cellHeight, 'F');
        doc.text(String(p.id), x + cellWidth / 2, yPos + cellHeight - 1.5, { align: 'center' });
      });
      yPos += cellHeight;
      
      doc.setTextColor(33, 33, 33); doc.setFontSize(10);
      for (let opIdx = 0; opIdx < maxOps; opIdx++) {
        const isEven = opIdx % 2 === 0;
        rowProblems.forEach((p, idx) => {
          const x = margin + idx * cellWidth;
          if (isEven) { doc.setFillColor(248, 250, 252); doc.rect(x, yPos, cellWidth, cellHeight, 'F'); }
          doc.setDrawColor(200, 200, 200); doc.rect(x, yPos, cellWidth, cellHeight);
          const value = p.sequence[opIdx];
          if (value !== undefined) doc.text(String(value), x + cellWidth / 2, yPos + cellHeight - 1.5, { align: 'center' });
        });
        yPos += cellHeight;
      }
      
      doc.setFillColor(255, 249, 196);
      rowProblems.forEach((_, idx) => {
        const x = margin + idx * cellWidth;
        doc.rect(x, yPos, cellWidth, cellHeight, 'F');
        doc.setDrawColor(251, 192, 45); doc.rect(x, yPos, cellWidth, cellHeight);
      });
      yPos += cellHeight + 8;
    }
    
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text("IqroMax - Mental Arifmetika O'quv Platformasi", pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Answers page
    doc.addPage(); yPos = margin;
    doc.setFontSize(16); doc.setTextColor(76, 175, 80);
    doc.text('Javoblar', pageWidth / 2, yPos + 5, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(title, pageWidth / 2, yPos + 12, { align: 'center' });
    yPos += 20;
    doc.setDrawColor(76, 175, 80); doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
    
    const answersPerRow = 10;
    const answerCellWidth = (pageWidth - 2 * margin) / answersPerRow;
    const answerRows = Math.ceil(sheet.problems.length / answersPerRow);
    
    for (let row = 0; row < answerRows; row++) {
      const startIdx = row * answersPerRow;
      const rowProblems = sheet.problems.slice(startIdx, startIdx + answersPerRow);
      if (yPos + 14 > pageHeight - margin) { doc.addPage(); yPos = margin; }
      
      doc.setFillColor(76, 175, 80); doc.setTextColor(255, 255, 255); doc.setFontSize(8);
      rowProblems.forEach((p, idx) => {
        const x = margin + idx * answerCellWidth;
        doc.rect(x, yPos, answerCellWidth, cellHeight, 'F');
        doc.text(String(p.id), x + answerCellWidth / 2, yPos + cellHeight - 1.5, { align: 'center' });
      });
      yPos += cellHeight;
      
      doc.setFillColor(232, 245, 233); doc.setTextColor(33, 33, 33); doc.setFontSize(10);
      rowProblems.forEach((p, idx) => {
        const x = margin + idx * answerCellWidth;
        doc.rect(x, yPos, answerCellWidth, cellHeight, 'F');
        doc.setDrawColor(200, 200, 200); doc.rect(x, yPos, answerCellWidth, cellHeight);
        doc.text(String(p.answer), x + answerCellWidth / 2, yPos + cellHeight - 1.5, { align: 'center' });
      });
      yPos += cellHeight + 4;
    }
    
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text("IqroMax - Mental Arifmetika O'quv Platformasi", pageWidth / 2, pageHeight - 5, { align: 'center' });
    doc.save(fileName);
    toast.success("PDF muvaffaqiyatli yuklab olindi!");
  }, [sheet, formulaType, columnsPerRow, playClick]);
  
  return (
    <PageBackground>
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 md:p-10 animate-fade-in">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl shadow-lg shadow-primary/25 shrink-0">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  Misol Varag'i Generatori
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  Soroban misollarini jadval shaklida generatsiya qiling va PDF sifatida yuklab oling
                </p>
              </div>
              {sheet && (
                <Badge variant="secondary" className="text-sm px-3 py-1.5 shrink-0">
                  {sheet.problems.length} ta misol tayyor
                </Badge>
              )}
            </div>
          </div>
          
          {/* Settings Card */}
          <Card className="border-border/50 shadow-sm animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-primary" />
                </div>
                Sozlamalar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Digit Count */}
                <div className="space-y-2">
                  <Label htmlFor="digitCount" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Xona soni
                  </Label>
                  <Select value={String(digitCount)} onValueChange={(v) => setDigitCount(Number(v))}>
                    <SelectTrigger id="digitCount" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 xonali</SelectItem>
                      <SelectItem value="2">2 xonali</SelectItem>
                      <SelectItem value="3">3 xonali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Operation Count */}
                <div className="space-y-2">
                  <Label htmlFor="operationCount" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Columns className="w-3.5 h-3.5" /> Ustun soni
                  </Label>
                  <Select value={String(operationCount)} onValueChange={(v) => setOperationCount(Number(v))}>
                    <SelectTrigger id="operationCount" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 6, 7, 8, 9, 10, 12, 15].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} ta</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Formula Type */}
                <div className="space-y-2">
                  <Label htmlFor="formulaType" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" /> Formula turi
                  </Label>
                  <Select value={formulaType} onValueChange={setFormulaType}>
                    <SelectTrigger id="formulaType" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formulasiz">📘 Formulasiz</SelectItem>
                      <SelectItem value="kichik_dost">🔢 Kichik do'st (5)</SelectItem>
                      <SelectItem value="katta_dost">🔟 Katta do'st (10)</SelectItem>
                      <SelectItem value="mix">🎯 Aralash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Problem Count */}
                <div className="space-y-2">
                  <Label htmlFor="problemCount" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Misollar soni
                  </Label>
                  <Select value={String(problemCount)} onValueChange={(v) => setProblemCount(Number(v))}>
                    <SelectTrigger id="problemCount" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[20, 30, 40, 50, 60, 80, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} ta</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Columns Per Row */}
                <div className="space-y-2">
                  <Label htmlFor="columnsPerRow" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <LayoutGrid className="w-3.5 h-3.5" /> Qatorga ustun
                  </Label>
                  <Select value={String(columnsPerRow)} onValueChange={(v) => setColumnsPerRow(Number(v))}>
                    <SelectTrigger id="columnsPerRow" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 8, 10, 12].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} ta</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/50">
                <Button 
                  onClick={generateSheet}
                  disabled={isGenerating}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/20"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generatsiya...' : 'Generatsiya'}
                </Button>
                
                <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Saqlangan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-primary" />
                        Saqlangan varaqlar
                      </DialogTitle>
                    </DialogHeader>
                    {loadingSaved ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : savedSheets.length === 0 ? (
                      <div className="text-center py-12">
                        <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Saqlangan varaqlar yo'q</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedSheets.map((s) => (
                          <div 
                            key={s.id}
                            className="group flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/20 transition-all cursor-pointer"
                            onClick={() => loadSheet(s)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold truncate">{s.title}</h4>
                                {s.is_public ? (
                                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 shrink-0">
                                    <Globe className="w-2.5 h-2.5 mr-0.5" /> Ommaviy
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0">
                                    <Lock className="w-2.5 h-2.5 mr-0.5" /> Yopiq
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {s.digit_count} xona • {s.operation_count} ustun • {s.problem_count} misol • {FORMULA_LABELS[s.formula_type]?.label || s.formula_type}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                {new Date(s.created_at).toLocaleDateString('uz-UZ')}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"
                                onClick={(e) => { e.stopPropagation(); openShareDialog(s); }}>
                                <Share2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                onClick={(e) => { e.stopPropagation(); deleteSheet(s.id); }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                
                {sheet && (
                  <>
                    <div className="w-px h-8 bg-border/50 hidden sm:block" />
                    <Button variant="outline" size="lg" onClick={downloadPDF}>
                      <Download className="w-4 h-4 mr-2" />
                      PDF yuklab olish
                    </Button>
                    
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="lg" className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
                          <Save className="w-4 h-4 mr-2" />
                          Saqlash
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Save className="w-5 h-5 text-emerald-500" />
                            Varaqni saqlash
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label htmlFor="sheetTitle">Varaq nomi</Label>
                            <Input
                              id="sheetTitle"
                              placeholder="Masalan: 8 ustun oddiy 1-xona"
                              value={sheetTitle}
                              onChange={(e) => setSheetTitle(e.target.value)}
                              className="h-11"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">{digitCount} xona</Badge>
                            <Badge variant="secondary">{operationCount} ustun</Badge>
                            <Badge variant="secondary">{problemCount} misol</Badge>
                            <Badge variant="secondary">{FORMULA_LABELS[formulaType]?.label || formulaType}</Badge>
                          </div>
                          <Button onClick={saveSheet} disabled={savingSheet || !sheetTitle.trim()} className="w-full h-11">
                            {savingSheet ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {savingSheet ? 'Saqlanmoqda...' : 'Saqlash'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Share Dialog */}
          <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Varaqni ulashish
                </DialogTitle>
              </DialogHeader>
              {currentShareSheet && (
                <div className="space-y-4 pt-2">
                  <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                    <h4 className="font-semibold text-sm">{currentShareSheet.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentShareSheet.digit_count} xona • {currentShareSheet.operation_count} ustun • {currentShareSheet.problem_count} misol
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-2">
                      {currentShareSheet.is_public ? (
                        <Globe className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">
                        {currentShareSheet.is_public ? "Ommaviy" : "Yopiq"}
                      </span>
                    </div>
                    <Switch
                      checked={currentShareSheet.is_public}
                      onCheckedChange={(checked) => toggleSheetPublic(currentShareSheet, checked)}
                      disabled={updatingShare}
                    />
                  </div>
                  
                  {currentShareSheet.is_public && currentShareSheet.share_code && (
                    <div className="space-y-2">
                      <Label className="text-xs">Ulashish havolasi</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`${window.location.origin}/problem-sheet?code=${currentShareSheet.share_code}`}
                          className="text-xs h-10"
                        />
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0"
                          onClick={() => copyShareLink(currentShareSheet.share_code!)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Generated Sheet Preview */}
          {sheet && (
            <Card className="border-border/50 shadow-sm animate-fade-in">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    Generatsiya natijasi
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {sheet.problems.length} misol
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      {sheet.settings.digitCount} xona
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <ProblemSheetTable 
                  problems={sheet.problems} 
                  columnsPerRow={columnsPerRow}
                />
              </CardContent>
            </Card>
          )}
          
          {/* Empty State */}
          {!sheet && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground mb-1">Hali misol generatsiya qilinmagan</h3>
              <p className="text-sm text-muted-foreground/60">Yuqoridagi sozlamalarni tanlab "Generatsiya" tugmasini bosing</p>
            </div>
          )}
        </div>
      </main>
    </PageBackground>
  );
};

export default ProblemSheetGenerator;
