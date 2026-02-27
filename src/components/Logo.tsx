import iqromaxLogo from '@/assets/iqromax-logo-full.png';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    xs: 'h-28 w-72 sm:h-32 sm:w-80',
    sm: 'h-36 w-36 sm:h-40 sm:w-40',
    md: 'h-44 w-44 sm:h-48 sm:w-48',
    lg: 'h-52 w-52 sm:h-56 sm:w-56',
    xl: 'h-60 w-60 sm:h-72 sm:w-72',
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
