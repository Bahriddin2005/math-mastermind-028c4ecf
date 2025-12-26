import iqromaxLogo from '@/assets/iqromax-logo.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ className = '', size = 'md' }: LogoProps) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  return (
    <img 
      src={iqromaxLogo} 
      alt="IQROMAX - Mental Matematika" 
      className={`${sizes[size]} w-auto object-contain ${className}`}
    />
  );
};
