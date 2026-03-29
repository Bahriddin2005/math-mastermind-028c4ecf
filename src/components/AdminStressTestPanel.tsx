/**
 * Admin Stress Test Panel
 * =======================
 * Generator stress test, preview va QA bundle.
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FlaskConical, Play, CheckCircle2, XCircle, Clock, Loader2, 
  BarChart3, Zap, Eye 
} from 'lucide-react';
import { generateExample, type ExampleConfig, type StageType, type OperationType, type GeneratedExample } from '@/lib/sorobanEngine';
import { runSingleStressTest, runFullStressSuite, type StressTestResult } from '@/lib/stressTest';
import type { DifficultyLevel } from '@/hooks/useAdaptiveDifficulty';

export const AdminStressTestPanel = () => {
  // Config state
  const [stage, setStage] = useState<StageType>('formulasiz');
  const [operation, setOperation] = useState<OperationType>('add');
  const [digitsCount, setDigitsCount] = useState(1);
  const [termsCount, setTermsCount] = useState(5);
  const [mainFormula, setMainFormula] = useState<number>(4);
  const [repeatCount, setRepeatCount] = useState(50);

  // Results
  const [isRunning, setIsRunning] = useState(false);
  const [singleResult, setSingleResult] = useState<StressTestResult | null>(null);
  const [suiteResult, setSuiteResult] = useState<ReturnType<typeof runFullStressSuite> | null>(null);
  const [previewExample, setPreviewExample] = useState<GeneratedExample | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const getConfig = useCallback((): ExampleConfig => ({
    operation,
    stage,
    digitsCount,
    termsCount,
    mainFormula: stage === 'formulasiz' ? null : mainFormula,
    minPrimarySteps: stage === 'formulasiz' ? 0 : 1,
  }), [operation, stage, digitsCount, termsCount, mainFormula]);

  // Single preview
  const handlePreview = useCallback(() => {
    setPreviewError(null);
    try {
      const example = generateExample(getConfig());
      setPreviewExample(example);
    } catch (e: any) {
      setPreviewError(e.message);
      setPreviewExample(null);
    }
  }, [getConfig]);

  // Single stress test
  const handleSingleTest = useCallback(() => {
    setIsRunning(true);
    setSuiteResult(null);
    setTimeout(() => {
      const result = runSingleStressTest({
        name: `${stage}_${operation}_${digitsCount}xona`,
        config: getConfig(),
        repeatCount,
      });
      setSingleResult(result);
      setIsRunning(false);
    }, 50);
  }, [stage, operation, digitsCount, repeatCount, getConfig]);

  // Full suite
  const handleFullSuite = useCallback(() => {
    setIsRunning(true);
    setSingleResult(null);
    setTimeout(() => {
      const result = runFullStressSuite(Math.min(repeatCount, 20));
      setSuiteResult(result);
      setIsRunning(false);
    }, 50);
  }, [repeatCount]);

  const getMainFormulaOptions = () => {
    if (stage === '5') return [1, 2, 3, 4];
    if (stage === '10') return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (stage === 'mix') return [6, 7, 8, 9];
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-5 w-5 text-primary" />
            Generator Stress Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Mavzu</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as StageType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="formulasiz">Formulasiz</SelectItem>
                  <SelectItem value="5">5-lik formula</SelectItem>
                  <SelectItem value="10">10-lik formula</SelectItem>
                  <SelectItem value="mix">Mix formula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Amal</Label>
              <Select value={operation} onValueChange={(v) => setOperation(v as OperationType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Qo'shish</SelectItem>
                  <SelectItem value="sub">Ayirish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Xonalar</Label>
              <Select value={String(digitsCount)} onValueChange={(v) => setDigitsCount(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map(d => (
                    <SelectItem key={d} value={String(d)}>{d} xona</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hadlar soni</Label>
              <Input 
                type="number" 
                min={3} max={25} 
                value={termsCount} 
                onChange={(e) => setTermsCount(Number(e.target.value))} 
              />
            </div>

            {stage !== 'formulasiz' && (
              <div className="space-y-2">
                <Label>Asosiy formula</Label>
                <Select value={String(mainFormula)} onValueChange={(v) => setMainFormula(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getMainFormulaOptions().map(f => (
                      <SelectItem key={f} value={String(f)}>+{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Takrorlar soni</Label>
              <Input 
                type="number" 
                min={1} max={500} 
                value={repeatCount} 
                onChange={(e) => setRepeatCount(Number(e.target.value))} 
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={handlePreview} variant="outline" disabled={isRunning}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={handleSingleTest} disabled={isRunning}>
              {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Single Test
            </Button>
            <Button onClick={handleFullSuite} variant="secondary" disabled={isRunning}>
              {isRunning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Full Suite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {previewExample && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm font-mono whitespace-pre overflow-x-auto">
              {previewExample.formatted}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">
                Javob: {previewExample.answer}
              </Badge>
              <Badge variant="outline">
                Primary: {previewExample.verification.primarySteps}/{previewExample.verification.totalSteps}
              </Badge>
              <Badge variant={previewExample.verification.isValid ? 'default' : 'destructive'}>
                {previewExample.verification.isValid ? '✓ Valid' : '✗ Invalid'}
              </Badge>
            </div>
            {previewExample.stepLogs.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="p-1 text-left">Step</th>
                      <th className="p-1">Pos</th>
                      <th className="p-1">Before</th>
                      <th className="p-1">Operand</th>
                      <th className="p-1">After</th>
                      <th className="p-1">Formula</th>
                      <th className="p-1">Primary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewExample.stepLogs.map((step, i) => (
                      <tr key={i} className={`border-b ${step.isPrimary ? 'bg-primary/5' : ''}`}>
                        <td className="p-1">{i + 1}</td>
                        <td className="p-1 text-center">{step.displayPos}</td>
                        <td className="p-1 text-center">{step.beforeDigit}</td>
                        <td className="p-1 text-center">{step.operation === 'add' ? '+' : '-'}{step.operandDigit}</td>
                        <td className="p-1 text-center">{step.afterDigit}</td>
                        <td className="p-1 text-center">
                          <Badge variant="outline" className="text-[10px]">{step.classified}</Badge>
                        </td>
                        <td className="p-1 text-center">{step.isPrimary ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {previewError && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 text-destructive text-sm">{previewError}</CardContent>
        </Card>
      )}

      {/* Single Test Result */}
      {singleResult && (
        <Card className={singleResult.failed === 0 ? 'border-green-500/30' : 'border-destructive/30'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {singleResult.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {singleResult.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{singleResult.passed}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{singleResult.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{singleResult.successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{singleResult.durationMs}ms</p>
                <p className="text-xs text-muted-foreground">Duration</p>
              </div>
            </div>

            {singleResult.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Xatolar:</p>
                {singleResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-destructive/80">
                    #{err.iteration}: {err.error}
                  </p>
                ))}
              </div>
            )}

            {singleResult.sampleResults.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Namuna misollar:</p>
                <div className="space-y-2">
                  {singleResult.sampleResults.map((sample, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 p-2 rounded">
                      <span className="font-mono">{sample.terms.join(', ')}</span>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline">{sample.answer}</Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        P:{sample.primarySteps}/{sample.totalSteps}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Full Suite Result */}
      {suiteResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Full Suite — {suiteResult.overallSuccessRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xl font-bold">{suiteResult.totalCases}</p>
                <p className="text-[10px] text-muted-foreground">Cases</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xl font-bold">{suiteResult.totalRuns}</p>
                <p className="text-[10px] text-muted-foreground">Runs</p>
              </div>
              <div className="text-center p-2 bg-green-500/10 rounded">
                <p className="text-xl font-bold text-green-500">{suiteResult.totalPassed}</p>
                <p className="text-[10px] text-muted-foreground">Passed</p>
              </div>
              <div className="text-center p-2 bg-destructive/10 rounded">
                <p className="text-xl font-bold text-destructive">{suiteResult.totalFailed}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <p className="text-xl font-bold">{(suiteResult.totalDurationMs / 1000).toFixed(1)}s</p>
                <p className="text-[10px] text-muted-foreground">Duration</p>
              </div>
            </div>

            <div className="space-y-1">
              {suiteResult.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-2 border-b last:border-0">
                  <span className="font-mono">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">{r.passed}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className={r.failed > 0 ? 'text-destructive font-bold' : 'text-muted-foreground'}>{r.failed}</span>
                    <Badge 
                      variant={r.failed === 0 ? 'default' : 'destructive'}
                      className="text-[10px]"
                    >
                      {r.successRate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
