import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    xs: 'h-12 w-12 sm:h-14 sm:w-14',
    sm: 'h-56 w-56 sm:h-60 sm:w-60',
    md: 'h-64 w-64 sm:h-72 sm:w-72',
    lg: 'h-72 w-72 sm:h-80 sm:w-80',
    xl: 'h-80 w-80 sm:h-96 sm:w-96',
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
