import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    xs: 'h-20 w-80 sm:h-24 sm:w-96',
    sm: 'h-28 w-56 sm:h-32 sm:w-64',
    md: 'h-32 w-64 sm:h-36 sm:w-72',
    lg: 'h-36 w-72 sm:h-40 sm:w-80',
    xl: 'h-40 w-80 sm:h-48 sm:w-96',
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
          hover:scale-105
          ${className}
        `}
      />
    </div>
  );
};
