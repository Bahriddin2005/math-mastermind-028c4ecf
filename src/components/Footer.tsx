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
      <div className="container px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Logo size="md" />
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              Mental arifmetika bo'yicha eng yaxshi onlayn platforma. 
              Miyangizni rivojlantiring va tez hisoblashni o'rganing.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground transition-colors ${social.color}`}
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Platforma</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Yordam</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href} 
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Aloqa</h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:info@iqromax.uz" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  <Mail className="h-4 w-4" />
                  info@iqromax.uz
                </a>
              </li>
              <li>
                <a 
                  href="tel:+998901234567" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  <Phone className="h-4 w-4" />
                  +998 90 123 45 67
                </a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4" />
                Toshkent, O'zbekiston
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50">
        <div className="container px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              © {currentYear} IQroMax. Barcha huquqlar himoyalangan.
              <Heart className="h-3 w-3 text-red-500 fill-red-500 mx-1" />
              O'zbekistonda ishlab chiqilgan.
            </p>
            
            <div className="flex items-center gap-4">
              {footerLinks.legal.map((link) => (
                <Link 
                  key={link.href}
                  to={link.href} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
