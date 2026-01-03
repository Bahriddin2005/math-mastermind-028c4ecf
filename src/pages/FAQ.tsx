import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Brain, Calculator, Target, Trophy, Clock, Users } from 'lucide-react';

const faqData = [
  {
    category: "Umumiy savollar",
    icon: HelpCircle,
    questions: [
      {
        question: "IQroMax nima?",
        answer: "IQroMax - bu mental arifmetika bo'yicha mashq qilish uchun mo'ljallangan onlayn platforma. U yordamida siz tezkor hisoblash ko'nikmalaringizni rivojlantirishingiz va miyangizni mashq qildirishingiz mumkin."
      },
      {
        question: "Mental arifmetika nima?",
        answer: "Mental arifmetika - bu arifmetik hisob-kitoblarni yozmasdan, faqat aqlda bajarish usuli. Bu usul miyani rivojlantirish, xotirani mustahkamlash va tezkor fikrlash qobiliyatini oshirishga yordam beradi."
      },
      {
        question: "Platformadan foydalanish pullikmi?",
        answer: "IQroMax asosiy funksiyalari bepul. Biroq, premium obuna orqali qo'shimcha xususiyatlar, cheksiz mashqlar va maxsus statistikaga ega bo'lishingiz mumkin."
      }
    ]
  },
  {
    category: "Mashqlar haqida",
    icon: Brain,
    questions: [
      {
        question: "Qanday qiyinchilik darajalari mavjud?",
        answer: "Uch xil qiyinchilik darajasi mavjud: Oson (bir xonali sonlar), O'rta (ikki xonali sonlar) va Qiyin (uch xonali sonlar). Siz o'z darajangizga mos variantni tanlashingiz mumkin."
      },
      {
        question: "Mashq turlari qanday?",
        answer: "Mashqlar qo'shish, ayirish, ko'paytirish va bo'lish amallarini o'z ichiga oladi. Har bir amal uchun alohida mashq qilish yoki aralash rejimda ishlash mumkin."
      },
      {
        question: "Mashq rejimida vaqt chegarasi bormi?",
        answer: "Ha, ikkita rejim mavjud: Vaqt rejimida belgilangan vaqt ichida ko'proq masala yechish kerak. Maqsad rejimida esa belgilangan miqdordagi masalalarni tezroq yechish maqsad qilinadi."
      }
    ]
  },
  {
    category: "Hisob va statistika",
    icon: Trophy,
    questions: [
      {
        question: "Natijalarim saqlanib qoladimi?",
        answer: "Ha, ro'yxatdan o'tgan foydalanuvchilar uchun barcha natijalar avtomatik saqlanadi. Siz o'z taraqqiyotingizni kuzatib borishingiz va statistikalarni ko'rishingiz mumkin."
      },
      {
        question: "Leaderboard qanday ishlaydi?",
        answer: "Leaderboard foydalanuvchilarni umumiy ball bo'yicha tartiblaydi. Ball mashqlar davomida to'g'ri javoblar, streak'lar va qiyinchilik darajasiga qarab hisoblanadi."
      },
      {
        question: "Streak nima?",
        answer: "Streak - ketma-ket to'g'ri javoblar soni. Streak qanchalik uzun bo'lsa, shuncha ko'proq bonus ball olasiz. Noto'g'ri javob streak'ni nolga tushiradi."
      }
    ]
  },
  {
    category: "Texnik savollar",
    icon: Calculator,
    questions: [
      {
        question: "Mobil qurilmalarda ishlaydi mi?",
        answer: "Ha, IQroMax to'liq responsive dizaynga ega va barcha qurilmalarda - kompyuter, planshet va smartfonlarda mukammal ishlaydi."
      },
      {
        question: "Internet kerakmi?",
        answer: "Ha, platforma to'liq onlayn ishlaydi va barcha ma'lumotlar bulutda saqlanadi. Barqaror internet aloqasi talab qilinadi."
      },
      {
        question: "Qaysi brauzerlarni qo'llab-quvvatlaysiz?",
        answer: "Chrome, Firefox, Safari, Edge va boshqa zamonaviy brauzerlarning so'nggi versiyalari to'liq qo'llab-quvvatlanadi."
      }
    ]
  },
  {
    category: "Obuna va to'lov",
    icon: Target,
    questions: [
      {
        question: "Premium obuna nimalar beradi?",
        answer: "Premium obuna cheksiz mashqlar, batafsil statistika, maxsus mavzular, reklamasiz muhit va ustuvor texnik yordam imkoniyatlarini taqdim etadi."
      },
      {
        question: "Obunani bekor qilsam nima bo'ladi?",
        answer: "Obunani istalgan vaqtda bekor qilishingiz mumkin. Bekor qilgandan so'ng, joriy davr tugaguncha premium xususiyatlardan foydalanishingiz mumkin."
      },
      {
        question: "Qanday to'lov usullari mavjud?",
        answer: "Visa, MasterCard va boshqa asosiy kredit/debit kartalar orqali to'lov qilish mumkin. Stripe xavfsiz to'lov tizimi orqali amalga oshiriladi."
      }
    ]
  }
];

const FAQ = () => {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Section with gradient - Dark mode optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-primary/15 dark:via-background dark:to-accent/15">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-br from-primary/20 dark:from-primary/30 to-primary/5 dark:to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute -bottom-40 -left-40 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-tr from-accent/20 dark:from-accent/30 to-accent/5 dark:to-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          </div>
          
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="container px-4 py-8 sm:py-10 md:py-14 relative">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 sm:mb-6 bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 border border-primary/20 dark:border-primary/30">
                <HelpCircle className="h-3 w-3 mr-1" />
                FAQ
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
                Tez-tez beriladigan savollar
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                IQroMax platformasi haqida eng ko'p beriladigan savollarga javoblar
              </p>
            </div>
          </div>
        </div>

        <div className="container px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {faqData.map((section, index) => {
                const Icon = section.icon;
                return (
                  <div 
                    key={index} 
                    className="bg-card dark:bg-card/50 rounded-xl sm:rounded-2xl border border-border/50 dark:border-border/30 p-4 sm:p-5 md:p-6 shadow-sm dark:shadow-xl backdrop-blur-sm opacity-0 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                      <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 dark:from-primary/25 dark:to-primary/10 border border-primary/20 dark:border-primary/30">
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-foreground">{section.category}</h2>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                      {section.questions.map((item, qIndex) => (
                        <AccordionItem 
                          key={qIndex} 
                          value={`item-${index}-${qIndex}`} 
                          className="border-b border-border/40 dark:border-border/20 last:border-b-0"
                        >
                          <AccordionTrigger className="text-left hover:no-underline min-h-[48px] sm:min-h-[56px] py-3 sm:py-4 text-sm sm:text-base font-medium text-foreground hover:text-primary dark:hover:text-primary transition-colors">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm sm:text-base text-muted-foreground pb-3 sm:pb-4 leading-relaxed">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 sm:mt-10 md:mt-12 text-center p-6 sm:p-8 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-xl sm:rounded-2xl border border-border/50 dark:border-border/30 backdrop-blur-sm opacity-0 animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/15 flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-primary/20 dark:border-primary/30">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Javob topolmadingizmi?</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                Biz bilan bog'laning va savolingizga javob beramiz
              </p>
              <a 
                href="/contact" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm sm:text-base transition-colors group"
              >
                Bog'lanish sahifasiga o'tish 
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default FAQ;