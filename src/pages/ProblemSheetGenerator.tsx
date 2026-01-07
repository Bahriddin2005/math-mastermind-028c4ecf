import { useState, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { PageBackground } from '@/components/layout/PageBackground';
import { useSound } from '@/hooks/useSound';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, RefreshCw, Printer, FileText } from 'lucide-react';
import { generateProblem, getLegacyFormulas, FORMULA_LABELS } from '@/lib/sorobanEngine';
import { ProblemSheetTable } from '@/components/ProblemSheetTable';
import iqromaxLogo from '@/assets/iqromax-logo-full.png';

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
  
  // Settings
  const [digitCount, setDigitCount] = useState(1);
  const [operationCount, setOperationCount] = useState(8);
  const [formulaType, setFormulaType] = useState('formulasiz');
  const [problemCount, setProblemCount] = useState(50);
  const [columnsPerRow, setColumnsPerRow] = useState(10);
  
  // Generated sheet
  const [sheet, setSheet] = useState<GeneratedSheet | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const playClick = () => playSound('tick');
  
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
    
    // Generate answers HTML
    const generateAnswersHTML = () => {
      let html = '<h2 class="answers-title">Javoblar</h2>';
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
        
        <div class="page-break"></div>
        
        ${generateAnswersHTML()}
        
        <div class="footer">
          IqroMax - Mental Arifmetika O'quv Platformasi • www.iqromax.uz
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
