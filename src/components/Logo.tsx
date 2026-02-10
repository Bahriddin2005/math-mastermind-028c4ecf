import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    sm: 'h-44 w-44 sm:h-48 sm:w-48',
    md: 'h-52 w-52 sm:h-56 sm:w-56',
    lg: 'h-60 w-60 sm:h-64 sm:w-64',
    xl: 'h-72 w-72 sm:h-80 sm:w-80',
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
