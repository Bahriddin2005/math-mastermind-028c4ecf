import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Problem {
  id: number;
  sequence: number[];
  answer: number;
}

interface ProblemSheetTableProps {
  problems: Problem[];
  columnsPerRow: number;
  showAnswers?: boolean;
}

export const ProblemSheetTable = ({ 
  problems, 
  columnsPerRow,
  showAnswers = true 
}: ProblemSheetTableProps) => {
  const totalRows = Math.ceil(problems.length / columnsPerRow);
  
  return (
    <div className="space-y-6">
      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const startIdx = rowIndex * columnsPerRow;
        const rowProblems = problems.slice(startIdx, startIdx + columnsPerRow);
        
        if (rowProblems.length === 0) return null;
        
        const maxOps = Math.max(...rowProblems.map(p => p.sequence.length));
        
        return (
          <div key={rowIndex} className="overflow-x-auto rounded-lg border border-border/50">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  {rowProblems.map((problem) => (
                    <TableHead 
                      key={problem.id} 
                      className="text-center text-primary-foreground font-bold border-r border-primary-foreground/20 last:border-r-0 min-w-[48px] py-2 text-xs"
                    >
                      {problem.id}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: maxOps }).map((_, opIndex) => (
                  <TableRow key={opIndex} className={opIndex % 2 === 0 ? 'bg-muted/20' : 'bg-background'}>
                    {rowProblems.map((problem) => (
                      <TableCell 
                        key={problem.id} 
                        className="text-center border-r border-border/30 last:border-r-0 py-1.5 font-mono text-sm tabular-nums"
                      >
                        {problem.sequence[opIndex] !== undefined 
                          ? problem.sequence[opIndex] 
                          : ''
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {/* Answer row */}
                <TableRow className="bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/40">
                  {rowProblems.map((problem) => (
                    <TableCell 
                      key={problem.id}
                      className="text-center border-r border-amber-200 dark:border-amber-800 last:border-r-0 py-2.5 font-bold border-t-2 border-t-amber-300 dark:border-t-amber-700"
                    >
                      {/* Empty for student to write */}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );
      })}
      
      {/* Answers Section */}
      {showAnswers && (
        <div className="mt-6 pt-6 border-t-2 border-dashed border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-500/30" />
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 px-3">
              ✅ Javoblar
            </h3>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-500/30" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: Math.ceil(problems.length / 10) }).map((_, rowIndex) => {
              const startIdx = rowIndex * 10;
              const rowProblems = problems.slice(startIdx, startIdx + 10);
              
              return (
                <div key={rowIndex} className="overflow-x-auto rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                  <Table className="border-collapse">
                    <TableBody>
                      <TableRow className="bg-emerald-500 hover:bg-emerald-500">
                        {rowProblems.map((problem) => (
                          <TableCell 
                            key={problem.id}
                            className="text-center text-white font-bold border-r border-emerald-400 last:border-r-0 min-w-[48px] py-1.5 text-xs"
                          >
                            {problem.id}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/40">
                        {rowProblems.map((problem) => (
                          <TableCell 
                            key={problem.id}
                            className="text-center font-bold border-r border-emerald-200 dark:border-emerald-800/50 last:border-r-0 py-1.5 font-mono tabular-nums text-sm"
                          >
                            {problem.answer}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
