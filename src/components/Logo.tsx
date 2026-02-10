import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    sm: 'h-16 w-16 sm:h-18 sm:w-18',
    md: 'h-18 w-18 sm:h-20 sm:w-20',
    lg: 'h-22 w-22 sm:h-24 sm:w-24',
    xl: 'h-28 w-28 sm:h-32 sm:w-32',
  };

  return (
    <div className="inline-flex items-center justify-center">
      <img 
        src={iqromaxLogo} 
        alt="IQROMAX - Mental Matematika" 
          className={`
          ${sizes[size]} 
          object-contain
          transition-all duration-300 
          drop-shadow-sm 
          hover:drop-shadow-md
          hover:scale-105
          dark:brightness-110 dark:contrast-110
          ${className}
        `}
      />
    </div>
  );
};
