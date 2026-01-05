import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { 
  MessageCircle, 
  Instagram, 
  Youtube,
  Heart
} from 'lucide-react';

const socialLinks = [
  { icon: MessageCircle, href: 'https://t.me/mentalarifmetika_uz', label: 'Telegram' },
  { icon: Instagram, href: 'https://instagram.com/iqromaxcom', label: 'Instagram' },
  { icon: Youtube, href: 'https://www.youtube.com/@iqromaxcom', label: 'YouTube' },
];

const quickLinks = [
  { label: 'Mashq', href: '/train' },
  { label: 'Darslar', href: '/courses' },
  { label: "Bog'lanish", href: '/contact' },
  { label: 'FAQ', href: '/faq' },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/30 dark:border-border/20 bg-gradient-to-b from-background to-secondary/30 dark:to-secondary/10">
      {/* Gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container px-4 py-8 md:py-10 lg:py-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Logo size="sm" />
            <p className="text-muted-foreground text-xs md:text-sm text-center md:text-left max-w-xs">
              Mental arifmetika bo'yicha eng yaxshi onlayn platforma
            </p>
          </div>

          {/* Quick Links */}
          <nav className="flex items-center gap-4 md:gap-6">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-secondary/60 dark:bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all border border-border/30 dark:border-border/20"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-border/30 dark:border-border/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            © {currentYear} IQroMax
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
          </p>
          
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Maxfiylik
            </Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Shartlar
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
