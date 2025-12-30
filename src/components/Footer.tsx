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
  ExternalLink
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
  { icon: MessageCircle, href: 'https://t.me/iqromax', label: 'Telegram', color: 'hover:text-blue-500' },
  { icon: Instagram, href: 'https://instagram.com/iqromax', label: 'Instagram', color: 'hover:text-pink-500' },
  { icon: Youtube, href: 'https://youtube.com/@iqromax', label: 'YouTube', color: 'hover:text-red-500' },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/30 border-t border-border/50">
      {/* Main Footer */}
      <div className="container px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <Logo size="md" />
            <p className="mt-3 sm:mt-4 text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Mental arifmetika bo'yicha eng yaxshi onlayn platforma. 
              Miyangizni rivojlantiring va tez hisoblashni o'rganing.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground transition-colors ${social.color}`}
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Platforma</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Yordam</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Aloqa</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a 
                  href="mailto:info@iqromax.uz" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm"
                >
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  info@iqromax.uz
                </a>
              </li>
              <li>
                <a 
                  href="tel:+998901234567" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-xs sm:text-sm"
                >
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  +998 90 123 45 67
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Toshkent, O'zbekiston
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50">
        <div className="container px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 text-center sm:text-left">
              © {currentYear} IQroMax. 
              <span className="hidden xs:inline">Barcha huquqlar himoyalangan.</span>
              <Heart className="h-3 w-3 text-red-500 fill-red-500 mx-1" />
              <span className="hidden sm:inline">O'zbekistonda ishlab chiqilgan.</span>
            </p>
            
            <div className="flex items-center gap-3 sm:gap-4">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.href}
                  to={link.href} 
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
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
