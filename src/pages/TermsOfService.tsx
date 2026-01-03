import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageBackground } from '@/components/layout/PageBackground';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Check, AlertTriangle, Ban, Scale, RefreshCw, Gavel, Mail } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

const TermsOfService = () => {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <PageBackground className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-4">
              <FileText className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Foydalanish Shartlari
            </h1>
            <p className="text-muted-foreground">
              Oxirgi yangilanish: 2024-yil, 1-yanvar
            </p>
          </div>

          <div className="space-y-6">
            {/* Introduction */}
            <Card>
              <CardContent className="p-6">
                <p className="text-foreground leading-relaxed">
                  IQROMAX ilovasidan foydalanish orqali siz ushbu Foydalanish Shartlariga rozilik 
                  bildirasiz. Iltimos, ushbu shartlarni diqqat bilan o'qing. Agar siz ushbu shartlarga 
                  rozi bo'lmasangiz, ilovadan foydalanmang.
                </p>
              </CardContent>
            </Card>

            {/* Section 1 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      1. Xizmatlarni qabul qilish
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      IQROMAX mental arifmetika va matematika o'rganish uchun ta'lim platformasidir. 
                      Bizning xizmatlarimizdan foydalanish orqali siz:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3 ml-4">
                      <li>Kamida 13 yoshda ekanligingizni tasdiqlaysiz</li>
                      <li>To'g'ri va aniq ma'lumot berishga rozilik bildirasiz</li>
                      <li>Akkount xavfsizligi uchun javobgar bo'lasiz</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Scale className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      2. Foydalanuvchi majburiyatlari
                    </h2>
                    <p className="text-muted-foreground mb-3">Siz quyidagilarga rozilik bildirasiz:</p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Ilovadan faqat qonuniy maqsadlarda foydalanish</li>
                      <li>Boshqa foydalanuvchilarni hurmat qilish</li>
                      <li>Noto'g'ri yoki aldamchi ma'lumot tarqatmaslik</li>
                      <li>Ilova xavfsizligini buzishga urinmaslik</li>
                      <li>Spam yoki zararli kontent tarqatmaslik</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Ban className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      3. Taqiqlangan harakatlar
                    </h2>
                    <p className="text-muted-foreground mb-3">Quyidagi harakatlar taqiqlanadi:</p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Musobaqalarda aldash yoki botlardan foydalanish</li>
                      <li>Boshqalar akkountiga kirish</li>
                      <li>Ilova kodini reverse engineering qilish</li>
                      <li>Xizmatni buzishga urinish</li>
                      <li>Zararli dasturlar tarqatish</li>
                      <li>Boshqa foydalanuvchilarni tahqirlash</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 4 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      4. Intellektual mulk
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      IQROMAX ilovasi, uning dizayni, logotipi, video darslari va barcha kontent 
                      IQROMAX kompaniyasining intellektual mulki hisoblanadi. Ruxsatsiz nusxalash, 
                      tarqatish yoki sotish taqiqlanadi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      5. Javobgarlikni cheklash
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Ilova "boricha" taqdim etiladi. Biz xizmatlarning uzluksiz ishlashini 
                      kafolatlamaymiz. Texnik nosozliklar, server muammolari yoki boshqa sabablarga 
                      ko'ra yuzaga kelgan to'g'ridan-to'g'ri yoki bilvosita zararlar uchun javobgar 
                      emasmiz.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      6. Akkountni to'xtatish
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Biz ushbu shartlarni buzgan foydalanuvchilarning akkountlarini ogohlantirmasdan 
                      to'xtatish yoki o'chirish huquqini saqlab qolamiz. Siz ham istalgan vaqtda 
                      akkountingizni o'chirishingiz mumkin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 7 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-5 h-5 text-teal-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      7. O'zgarishlar
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Biz ushbu shartlarni istalgan vaqtda o'zgartirish huquqini saqlab qolamiz. 
                      Muhim o'zgarishlar haqida sizni xabardor qilamiz. Davom etgan foydalanish 
                      yangi shartlarga rozilik hisoblanadi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 8 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <Gavel className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      8. Qonunchilik
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Ushbu shartlar O'zbekiston Respublikasi qonunchiligiga muvofiq tartibga solinadi 
                      va talqin qilinadi. Har qanday nizolar O'zbekiston sudlarida ko'rib chiqiladi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Bog'lanish
                    </h2>
                    <p className="text-muted-foreground">
                      Savollaringiz bo'lsa, biz bilan bog'laning:{' '}
                      <a href="mailto:legal@iqromax.uz" className="text-accent hover:underline">
                        legal@iqromax.uz
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default TermsOfService;
