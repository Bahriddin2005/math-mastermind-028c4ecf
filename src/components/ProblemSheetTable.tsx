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
    <div className="space-y-8">
      {/* Problem Tables */}
      {Array.from({ length: totalRows }).map((_, rowIndex) => {
        const startIdx = rowIndex * columnsPerRow;
        const rowProblems = problems.slice(startIdx, startIdx + columnsPerRow);
        
        if (rowProblems.length === 0) return null;
        
        // Find max operations in this row
        const maxOps = Math.max(...rowProblems.map(p => p.sequence.length));
        
        return (
          <div key={rowIndex} className="overflow-x-auto">
            <Table className="border-collapse">
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/80">
                  {rowProblems.map((problem) => (
                    <TableHead 
                      key={problem.id} 
                      className="text-center text-white font-bold border border-primary/50 min-w-[50px]"
                    >
                      {problem.id}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Operation rows */}
                {Array.from({ length: maxOps }).map((_, opIndex) => (
                  <TableRow key={opIndex} className="hover:bg-muted/30">
                    {rowProblems.map((problem) => (
                      <TableCell 
                        key={problem.id} 
                        className="text-center border border-border/50 py-2 font-mono text-sm"
                      >
                        {problem.sequence[opIndex] !== undefined 
                          ? problem.sequence[opIndex] 
                          : ''
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {/* Answer row (empty for writing) */}
                <TableRow className="bg-amber-50 dark:bg-amber-900/20">
                  {rowProblems.map((problem) => (
                    <TableCell 
                      key={problem.id}
                      className="text-center border border-amber-300 dark:border-amber-600 py-3 font-bold"
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
        <div className="mt-8 pt-6 border-t-2 border-primary/30">
          <h3 className="text-lg font-bold text-primary mb-4 text-center">
            Javoblar
          </h3>
          <div className="space-y-3">
            {Array.from({ length: Math.ceil(problems.length / 10) }).map((_, rowIndex) => {
              const startIdx = rowIndex * 10;
              const rowProblems = problems.slice(startIdx, startIdx + 10);
              
              return (
                <div key={rowIndex} className="overflow-x-auto">
                  <Table className="border-collapse">
                    <TableBody>
                      {/* Problem IDs */}
                      <TableRow className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-500 hover:to-green-600">
                        {rowProblems.map((problem) => (
                          <TableCell 
                            key={problem.id}
                            className="text-center text-white font-bold border border-green-400 min-w-[50px] py-2"
                          >
                            {problem.id}
                          </TableCell>
                        ))}
                      </TableRow>
                      {/* Answers */}
                      <TableRow className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30">
                        {rowProblems.map((problem) => (
                          <TableCell 
                            key={problem.id}
                            className="text-center font-bold border border-green-300 dark:border-green-600 py-2 font-mono"
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
