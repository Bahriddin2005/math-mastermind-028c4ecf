import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PageBackground } from '@/components/layout/PageBackground';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock, Eye, UserCheck, Database, Bell, Mail, FileText } from 'lucide-react';
import { useSound } from '@/hooks/useSound';

const PrivacyPolicy = () => {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <PageBackground className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Maxfiylik Siyosati
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
                  IQROMAX ilovasiga xush kelibsiz. Biz sizning maxfiyligingizni jiddiy qabul qilamiz. 
                  Ushbu Maxfiylik Siyosati bizning ilovamizdan foydalanganingizda qanday ma'lumotlarni 
                  yig'ishimiz, ulardan qanday foydalanishimiz va himoya qilishimizni tushuntiradi.
                </p>
              </CardContent>
            </Card>

            {/* Section 1 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      1. Yig'iladigan ma'lumotlar
                    </h2>
                    <div className="space-y-2 text-muted-foreground">
                      <p><strong>Shaxsiy ma'lumotlar:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Email manzil (ro'yxatdan o'tish uchun)</li>
                        <li>Foydalanuvchi nomi</li>
                        <li>Profil rasmi (ixtiyoriy)</li>
                      </ul>
                      <p className="mt-3"><strong>Foydalanish ma'lumotlari:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>O'yin natijalari va statistika</li>
                        <li>Darslarni ko'rish tarixi</li>
                        <li>Ilova ichidagi harakatlar</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      2. Ma'lumotlardan foydalanish
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Shaxsiylashtirilgan ta'lim tajribasini taqdim etish</li>
                      <li>Progress va statistikani kuzatish</li>
                      <li>Reyting va musobaqalarni tashkil etish</li>
                      <li>Ilova xizmatlarini yaxshilash</li>
                      <li>Texnik yordam ko'rsatish</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 3 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      3. Ma'lumotlar xavfsizligi
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Biz sizning ma'lumotlaringizni himoya qilish uchun sanoat standartlariga mos 
                      xavfsizlik choralarini qo'llaymiz, jumladan:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground mt-3 ml-4">
                      <li>SSL/TLS shifrlash</li>
                      <li>Xavfsiz ma'lumotlar bazasi</li>
                      <li>Muntazam xavfsizlik tekshiruvlari</li>
                      <li>Cheklangan kirish huquqlari</li>
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
                    <UserCheck className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      4. Sizning huquqlaringiz
                    </h2>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                      <li>Ma'lumotlaringizga kirish huquqi</li>
                      <li>Ma'lumotlarni tuzatish huquqi</li>
                      <li>Ma'lumotlarni o'chirish huquqi</li>
                      <li>Ma'lumotlarni eksport qilish huquqi</li>
                      <li>Marketing xabarlaridan voz kechish huquqi</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      5. Bildirishnomalar
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Push bildirishnomalarni ilovadan yoki qurilma sozlamalaridan istalgan vaqtda 
                      o'chirishingiz mumkin. Muhim xizmat xabarlari (parolni tiklash kabi) doimo 
                      yuboriladi.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 6 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-3">
                      6. Bolalar maxfiyligi
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      Ilovamiz 13 yoshdan kichik bolalar uchun mo'ljallangan bo'lsa-da, biz bolalarning 
                      maxfiyligini himoya qilamiz. Ota-onalar o'z farzandlarining akkountlarini 
                      boshqarishi va ma'lumotlarini o'chirish huquqiga ega.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      Bog'lanish
                    </h2>
                    <p className="text-muted-foreground">
                      Savollaringiz bo'lsa, biz bilan bog'laning:{' '}
                      <a href="mailto:privacy@iqromax.uz" className="text-primary hover:underline">
                        privacy@iqromax.uz
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

export default PrivacyPolicy;
