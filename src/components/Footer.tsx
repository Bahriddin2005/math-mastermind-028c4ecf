import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Instagram, 
  Youtube,
  Heart,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

const footerLinks = {
  platform: [
    { label: 'Bosh sahifa', href: '/' },
    { label: 'Mashq qilish', href: '/train' },
    { label: 'Video darslar', href: '/courses' },
    { label: 'Tariflar', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
  ],
  support: [
    { label: "Bog'lanish", href: '/contact' },
    { label: "Ko'p beriladigan savollar", href: '/faq' },
    { label: 'Biz haqimizda', href: '/about' },
  ],
  legal: [
    { label: 'Maxfiylik siyosati', href: '/privacy' },
    { label: 'Foydalanish shartlari', href: '/terms' },
  ],
};

const socialLinks = [
  { icon: MessageCircle, href: 'https://t.me/mentalarifmetika_uz', label: 'Telegram', color: 'group-hover:text-blue-400', bgHover: 'group-hover:bg-blue-500/20' },
  { icon: Instagram, href: 'https://instagram.com/iqromaxcom', label: 'Instagram', color: 'group-hover:text-pink-400', bgHover: 'group-hover:bg-pink-500/20' },
  { icon: Youtube, href: 'https://www.youtube.com/@iqromaxcom', label: 'YouTube', color: 'group-hover:text-red-400', bgHover: 'group-hover:bg-red-500/20' },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/30">
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/30" />
      
      <div className="relative container px-4 py-6 sm:py-8">
        {/* Main content - compact grid */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-4 mb-6">
          {/* Brand + Social */}
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center text-muted-foreground transition-all hover:scale-110 ${social.bgHover} border border-border/30`}
                  aria-label={social.label}
                >
                  <social.icon className={`h-4 w-4 transition-colors ${social.color}`} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links - horizontal on desktop */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {footerLinks.platform.slice(0, 4).map((link) => (
              <Link 
                key={link.href}
                to={link.href} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <span className="text-border">|</span>
            {footerLinks.support.slice(0, 2).map((link) => (
              <Link 
                key={link.href}
                to={link.href} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/30">
          <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
            <span>© {currentYear} IQroMax</span>
            <a href="mailto:info@iqromax.uz" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              info@iqromax.uz
            </a>
            <a href="tel:+998990053000" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              +998 99 005 30 00
            </a>
          </div>
          
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            {footerLinks.legal.map((link) => (
              <Link 
                key={link.href}
                to={link.href} 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
