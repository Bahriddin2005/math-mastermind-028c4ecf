import { useState, useCallback, useEffect } from 'react';
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
import { Download, RefreshCw, Printer, FileText, Save, FolderOpen, Trash2, Loader2 } from 'lucide-react';
import { generateProblem, getLegacyFormulas, FORMULA_LABELS } from '@/lib/sorobanEngine';
import { ProblemSheetTable } from '@/components/ProblemSheetTable';
import { toast } from 'sonner';
import iqromaxLogo from '@/assets/iqromax-logo-full.png';

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
}

interface GeneratedSheet {
  problems: {
    id: number;
    sequence: number[];
    answer: number;
  }[];
  settings: {
    digitCount: number;
    operationCount: number;
    formulaType: string;
    problemCount: number;
  };
}

const ProblemSheetGenerator = () => {
  const { soundEnabled, toggleSound, playSound } = useSound();
  const { user } = useAuth();
  
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
  
  const playClick = () => playSound('tick');
  
  // Fetch saved sheets
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
      setSavedSheets((data || []).map(d => ({
        ...d,
        problems: d.problems as unknown as Problem[],
      })));
    }
    setLoadingSaved(false);
  }, [user]);
  
  useEffect(() => {
    if (showLoadDialog) {
      fetchSavedSheets();
    }
  }, [showLoadDialog, fetchSavedSheets]);
  
  // Save sheet to database
  const saveSheet = async () => {
    if (!user || !sheet) return;
    if (!sheetTitle.trim()) {
      toast.error("Iltimos, varaq nomini kiriting");
      return;
    }
    
    setSavingSheet(true);
    
    const { error } = await supabase
      .from('problem_sheets')
      .insert([{
        user_id: user.id,
        title: sheetTitle.trim(),
        digit_count: digitCount,
        operation_count: operationCount,
        formula_type: formulaType,
        problem_count: problemCount,
        columns_per_row: columnsPerRow,
        problems: JSON.parse(JSON.stringify(sheet.problems)),
      }]);
    
    if (error) {
      console.error('Error saving sheet:', error);
      toast.error("Saqlashda xatolik yuz berdi");
    } else {
      toast.success("Varaq muvaffaqiyatli saqlandi!");
      setShowSaveDialog(false);
      setSheetTitle('');
    }
    
    setSavingSheet(false);
  };
  
  // Load sheet from database
  const loadSheet = (savedSheet: SavedSheet) => {
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
    
    setShowLoadDialog(false);
    toast.success(`"${savedSheet.title}" yuklandi`);
  };
  
  // Delete saved sheet
  const deleteSheet = async (id: string) => {
    const { error } = await supabase
      .from('problem_sheets')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast.error("O'chirishda xatolik");
    } else {
      setSavedSheets(prev => prev.filter(s => s.id !== id));
      toast.success("Varaq o'chirildi");
    }
  };
  
  // Generate problems
  const generateSheet = useCallback(() => {
    playClick();
    setIsGenerating(true);
    
    setTimeout(() => {
      const problems: GeneratedSheet['problems'] = [];
      const allowedFormulas = getLegacyFormulas(formulaType);
      
      for (let i = 0; i < problemCount; i++) {
        const problem = generateProblem({
          digitCount,
          operationCount,
          allowedFormulas,
          ensurePositiveResult: true,
        });
        
        problems.push({
          id: i + 1,
          sequence: [problem.startValue, ...problem.sequence],
          answer: problem.finalAnswer,
        });
      }
      
      setSheet({
        problems,
        settings: {
          digitCount,
          operationCount,
          formulaType,
          problemCount,
        },
      });
      
      setIsGenerating(false);
    }, 100);
  }, [digitCount, operationCount, formulaType, problemCount, playClick]);
  
  // Download as PDF
  const downloadPDF = useCallback(() => {
    if (!sheet) return;
    playClick();
    
    const formulaLabel = FORMULA_LABELS[formulaType]?.label || formulaType;
    const title = `${sheet.settings.operationCount} ustun ${formulaLabel} ${sheet.settings.digitCount}`;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Popup bloklangan. Iltimos, popup'ga ruxsat bering.");
      return;
    }
    
    // Generate table HTML
    const generateTableHTML = () => {
      let html = '';
      const problemsPerPage = columnsPerRow * 10; // 10 rows per page section
      const totalPages = Math.ceil(sheet.problems.length / columnsPerRow);
      
      for (let row = 0; row < totalPages; row++) {
        const startIdx = row * columnsPerRow;
        const rowProblems = sheet.problems.slice(startIdx, startIdx + columnsPerRow);
        
        if (rowProblems.length === 0) continue;
        
        // Find max operations in this row
        const maxOps = Math.max(...rowProblems.map(p => p.sequence.length));
        
        html += `
          <table class="problem-table">
            <thead>
              <tr>
                ${rowProblems.map(p => `<th>${p.id}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: maxOps }).map((_, opIdx) => `
                <tr>
                  ${rowProblems.map(p => `
                    <td>${p.sequence[opIdx] !== undefined ? p.sequence[opIdx] : ''}</td>
                  `).join('')}
                </tr>
              `).join('')}
              <tr class="answer-row">
                ${rowProblems.map(() => '<td></td>').join('')}
              </tr>
            </tbody>
          </table>
          <div style="height: 24px;"></div>
        `;
      }
      
      return html;
    };
    
    // Generate answers HTML - on separate page with header
    const generateAnswersHTML = () => {
      let html = `
        <div class="answers-header">
          <img src="${iqromaxLogo}" alt="IqroMax" class="logo" />
          <div>
            <div class="title">Javoblar</div>
            <div class="subtitle">${title} • ${sheet.settings.problemCount} ta misol</div>
          </div>
        </div>
      `;
      
      const totalRows = Math.ceil(sheet.problems.length / 10);
      
      for (let row = 0; row < totalRows; row++) {
        const startIdx = row * 10;
        const rowProblems = sheet.problems.slice(startIdx, startIdx + 10);
        
        html += `
          <table class="answers-table">
            <tbody>
              <tr class="answer-ids">
                ${rowProblems.map(p => `<td>${p.id}</td>`).join('')}
              </tr>
              <tr class="answer-values">
                ${rowProblems.map(p => `<td>${p.answer}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        `;
      }
      
      return html;
    };
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
          }
          
          .header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid #2196F3;
          }
          
          .logo {
            height: 50px;
            width: auto;
          }
          
          .title {
            font-size: 20px;
            font-weight: bold;
            color: #1976D2;
          }
          
          .subtitle {
            font-size: 14px;
            color: #666;
            margin-top: 4px;
          }
          
          .problem-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          
          .problem-table th {
            background: linear-gradient(135deg, #2196F3, #1976D2);
            color: white;
            font-weight: bold;
            padding: 8px 4px;
            border: 1px solid #1565C0;
            text-align: center;
            min-width: 40px;
          }
          
          .problem-table td {
            border: 1px solid #ddd;
            padding: 6px 4px;
            text-align: center;
            min-width: 40px;
            font-size: 13px;
          }
          
          .problem-table tbody tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .problem-table .answer-row td {
            height: 28px;
            background-color: #fff9c4;
            border: 1px solid #fbc02d;
          }
          
          .answers-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #4CAF50;
          }
          
          .answers-title {
            font-size: 18px;
            font-weight: bold;
            color: #1976D2;
            text-align: center;
            margin: 32px 0 16px 0;
            padding-top: 16px;
            border-top: 2px solid #2196F3;
          }
          
          .answers-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
          }
          
          .answers-table td {
            border: 1px solid #ddd;
            padding: 6px 4px;
            text-align: center;
            min-width: 40px;
          }
          
          .answers-table .answer-ids td {
            background: linear-gradient(135deg, #4CAF50, #388E3C);
            color: white;
            font-weight: bold;
          }
          
          .answers-table .answer-values td {
            font-weight: bold;
            font-size: 13px;
            background-color: #e8f5e9;
          }
          
          .page-break {
            page-break-after: always;
            break-after: page;
          }
          
          .answers-page {
            page-break-before: always;
            break-before: page;
          }
          
          .footer {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 10px;
            color: #999;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${iqromaxLogo}" alt="IqroMax" class="logo" />
          <div>
            <div class="title">${title}</div>
            <div class="subtitle">${sheet.settings.problemCount} ta misol • ${new Date().toLocaleDateString('uz-UZ')}</div>
          </div>
        </div>
        
        ${generateTableHTML()}
        
        <div class="footer">
          IqroMax - Mental Arifmetika O'quv Platformasi • www.iqromax.uz
        </div>
        
        <div class="page-break"></div>
        
        <div class="answers-page">
          ${generateAnswersHTML()}
          
          <div class="footer">
            IqroMax - Mental Arifmetika O'quv Platformasi • www.iqromax.uz
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for images to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }, [sheet, formulaType, columnsPerRow, playClick]);
  
  return (
    <PageBackground>
      <Navbar 
        soundEnabled={soundEnabled} 
        onToggleSound={toggleSound}
      />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl mb-4 shadow-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Misol Varag'i Generatori
            </h1>
            <p className="text-muted-foreground">
              Soroban misollarini jadval shaklida generatsiya qiling va PDF sifatida yuklab oling
            </p>
          </div>
          
          {/* Settings Card */}
          <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" />
                Sozlamalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Digit Count */}
                <div className="space-y-2">
                  <Label htmlFor="digitCount">Xona soni</Label>
                  <Select value={String(digitCount)} onValueChange={(v) => setDigitCount(Number(v))}>
                    <SelectTrigger id="digitCount">
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
                  <Label htmlFor="operationCount">Ustun soni</Label>
                  <Select value={String(operationCount)} onValueChange={(v) => setOperationCount(Number(v))}>
                    <SelectTrigger id="operationCount">
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
                  <Label htmlFor="formulaType">Formula turi</Label>
                  <Select value={formulaType} onValueChange={setFormulaType}>
                    <SelectTrigger id="formulaType">
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
                  <Label htmlFor="problemCount">Misollar soni</Label>
                  <Select value={String(problemCount)} onValueChange={(v) => setProblemCount(Number(v))}>
                    <SelectTrigger id="problemCount">
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
                  <Label htmlFor="columnsPerRow">Qatorga ustun</Label>
                  <Select value={String(columnsPerRow)} onValueChange={(v) => setColumnsPerRow(Number(v))}>
                    <SelectTrigger id="columnsPerRow">
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
              
              <div className="flex flex-wrap gap-3 mt-6">
                <Button 
                  onClick={generateSheet}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Generatsiya...' : 'Generatsiya qilish'}
                </Button>
                
                {/* Load Saved Sheets */}
                <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-blue-500/50 hover:bg-blue-500/10">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Saqlangan varaqlar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5" />
                        Saqlangan varaqlar
                      </DialogTitle>
                    </DialogHeader>
                    {loadingSaved ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : savedSheets.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Saqlangan varaqlar yo'q
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedSheets.map((s) => (
                          <div 
                            key={s.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => loadSheet(s)}
                            >
                              <h4 className="font-semibold">{s.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {s.digit_count} xona • {s.operation_count} ustun • {s.problem_count} misol • {FORMULA_LABELS[s.formula_type]?.label || s.formula_type}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(s.created_at).toLocaleDateString('uz-UZ')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSheet(s.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                
                {sheet && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={downloadPDF}
                      className="border-primary/50 hover:bg-primary/10"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      PDF yuklab olish
                    </Button>
                    
                    {/* Save Dialog */}
                    <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-green-500/50 hover:bg-green-500/10">
                          <Save className="w-4 h-4 mr-2" />
                          Saqlash
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Save className="w-5 h-5" />
                            Varaqni saqlash
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="sheetTitle">Varaq nomi</Label>
                            <Input
                              id="sheetTitle"
                              placeholder="Masalan: 8 ustun oddiy 1-xona"
                              value={sheetTitle}
                              onChange={(e) => setSheetTitle(e.target.value)}
                            />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>{digitCount} xonali • {operationCount} ustun • {problemCount} misol</p>
                            <p>{FORMULA_LABELS[formulaType]?.label || formulaType}</p>
                          </div>
                          <Button 
                            onClick={saveSheet} 
                            disabled={savingSheet || !sheetTitle.trim()}
                            className="w-full"
                          >
                            {savingSheet ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-2" />
                            )}
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
          
          {/* Generated Sheet Preview */}
          {sheet && (
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Generatsiya qilingan misollar
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {sheet.problems.length} ta misol
                  </span>
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
        </div>
      </main>
    </PageBackground>
  );
};

export default ProblemSheetGenerator;
