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
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <HelpCircle className="h-3 w-3 mr-1" />
              FAQ
            </Badge>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Tez-tez beriladigan savollar
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              IQroMax platformasi haqida eng ko'p beriladigan savollarga javoblar
            </p>
          </div>

          <div className="space-y-8">
            {faqData.map((section, index) => {
              const Icon = section.icon;
              return (
                <div key={index} className="bg-card rounded-xl border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">{section.category}</h2>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {section.questions.map((item, qIndex) => (
                      <AccordionItem key={qIndex} value={`item-${index}-${qIndex}`} className="border-b last:border-b-0">
                        <AccordionTrigger className="text-left hover:no-underline min-h-[56px] py-4">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center p-8 bg-primary/5 rounded-xl border">
            <Users className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Javob topolmadingizmi?</h3>
            <p className="text-muted-foreground mb-4">
              Biz bilan bog'laning va savolingizga javob beramiz
            </p>
            <a href="/contact" className="text-primary hover:underline font-medium">
              Bog'lanish sahifasiga o'tish →
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;