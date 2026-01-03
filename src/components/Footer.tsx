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
    { label: 'Yordam markazi', href: '/help' },
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
    <footer className="relative overflow-hidden border-t border-border/30 dark:border-border/20">
      {/* Top gradient border - Enhanced dark mode */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 dark:via-primary/80 to-transparent" />
      
      {/* Background decoration - Enhanced for dark mode */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/40 dark:via-secondary/10 to-secondary/60 dark:to-secondary/20" />
      <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 dark:bg-primary/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-48 sm:w-80 h-48 sm:h-80 bg-accent/5 dark:bg-accent/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 dark:bg-primary/8 rounded-full blur-3xl opacity-50" />
      
      {/* Newsletter Section - Enhanced dark mode */}
      <div className="relative border-b border-border/40 dark:border-border/20">
        <div className="container px-4 py-8 sm:py-10 md:py-14">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-10">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary/15 to-accent/10 dark:from-primary/25 dark:to-accent/15 rounded-full text-xs sm:text-sm font-medium text-primary mb-2 sm:mb-3 border border-primary/20 dark:border-primary/40 shadow-sm dark:shadow-lg dark:shadow-primary/10">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-pulse" />
                IQROMAX
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground dark:text-foreground/95 mb-1.5 sm:mb-2">
                Biz bilan bog'laning
              </h3>
              <p className="text-muted-foreground dark:text-muted-foreground/80 text-xs sm:text-sm max-w-md">
                Eng so'nggi yangiliklar va maxsus takliflardan xabardor bo'ling
              </p>
            </div>
            
            {/* Social Links - Mobile optimized with enhanced dark mode */}
            <div className="flex items-center gap-2 sm:gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl bg-secondary/90 dark:bg-secondary/40 backdrop-blur-sm flex items-center justify-center text-muted-foreground transition-all duration-300 active:scale-95 hover:scale-105 ${social.bgHover} border border-border/40 dark:border-border/20 hover:border-primary/40 dark:hover:border-primary/50 touch-target shadow-sm dark:shadow-xl dark:shadow-primary/10`}
                  aria-label={social.label}
                >
                  <social.icon className={`h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 transition-colors ${social.color}`} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer - Enhanced dark mode */}
      <div className="relative container px-4 py-8 sm:py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <Logo size="md" />
            <p className="mt-3 sm:mt-4 text-muted-foreground dark:text-muted-foreground/80 text-xs sm:text-sm leading-relaxed">
              Mental arifmetika bo'yicha eng yaxshi onlayn platforma. 
              Miyangizni rivojlantiring.
            </p>
          </div>

          {/* Platform Links - Enhanced dark mode */}
          <div>
            <h4 className="font-display font-semibold text-foreground dark:text-foreground/90 mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Platforma</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="group inline-flex items-center gap-1 text-muted-foreground dark:text-muted-foreground/80 hover:text-primary dark:hover:text-primary transition-colors text-sm py-1 touch-target"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-display font-semibold text-foreground dark:text-foreground/90 mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Yordam</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="group inline-flex items-center gap-1 text-muted-foreground dark:text-muted-foreground/80 hover:text-primary dark:hover:text-primary transition-colors text-sm py-1 touch-target"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info - Enhanced dark mode */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-display font-semibold text-foreground dark:text-foreground/90 mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wider">Aloqa</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a 
                  href="mailto:info@iqromax.uz" 
                  className="group flex items-center gap-3 text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors text-sm py-1.5 touch-target"
                >
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-secondary/80 dark:bg-secondary/40 flex items-center justify-center group-hover:bg-primary/10 dark:group-hover:bg-primary/25 transition-colors flex-shrink-0 border border-border/30 dark:border-border/20">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="truncate">info@iqromax.uz</span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+998990053000" 
                  className="group flex items-center gap-3 text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors text-sm py-1.5 touch-target"
                >
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-secondary/80 dark:bg-secondary/40 flex items-center justify-center group-hover:bg-primary/10 dark:group-hover:bg-primary/25 transition-colors flex-shrink-0 border border-border/30 dark:border-border/20">
                    <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  +998 99 005 30 00
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground dark:text-muted-foreground/80 text-sm py-1.5">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-secondary/80 dark:bg-secondary/40 flex items-center justify-center flex-shrink-0 border border-border/30 dark:border-border/20">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                Toshkent, O'zbekiston
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar - Enhanced dark mode */}
      <div className="relative border-t border-border/40 dark:border-border/20">
        <div className="container px-4 py-4 sm:py-5 md:py-6 safe-bottom">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80 flex items-center gap-1.5 text-center sm:text-left flex-wrap justify-center">
              <span>© {currentYear} IQroMax.</span>
              <span className="hidden xs:inline">Barcha huquqlar himoyalangan.</span>
              <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500 fill-red-500 animate-pulse" />
            </p>
            
            <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.href}
                  to={link.href} 
                  className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80 hover:text-primary transition-colors py-1 touch-target"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
