import iqromaxLogo from '@/assets/iqromax-logo.jpg';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
  };

  const paddings = {
    sm: 'py-1 px-2',
    md: 'py-1.5 px-3',
    lg: 'py-2 px-4',
  };

  return (
    <div className={`inline-flex items-center justify-center ${paddings[size]}`}>
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
          ${className}
        `}
        style={{
          filter: 'brightness(1) contrast(1.05)',
        }}
      />
    </div>
  );
};
