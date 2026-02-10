import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    sm: 'h-12 w-12 sm:h-14 sm:w-14',
    md: 'h-14 w-14 sm:h-16 sm:w-16',
    lg: 'h-18 w-18 sm:h-20 sm:w-20',
    xl: 'h-24 w-24 sm:h-28 sm:w-28',
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
