import { ReactNode } from "react";

interface PageBackgroundProps {
  children: ReactNode;
  className?: string;
}

export const PageBackground = ({ children, className = "" }: PageBackgroundProps) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 ${className}`}>
      {children}
    </div>
  );
};
