import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    sm: 'h-9 w-9 sm:h-10 sm:w-10',
    md: 'h-11 w-11 sm:h-12 sm:w-12',
    lg: 'h-14 w-14 sm:h-16 sm:w-16',
    xl: 'h-20 w-20 sm:h-24 sm:w-24',
  };

  return (
    <div className="inline-flex items-center justify-center">
      <img 
        src={iqromaxLogo} 
        alt="IQROMAX - Mental Matematika" 
        className={`
          ${sizes[size]} 
          object-cover
          rounded-full
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
