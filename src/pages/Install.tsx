import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  Bell,
  BellRing,
  Check,
  ArrowRight,
  Wifi,
  WifiOff,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Apple,
  Chrome,
} from 'lucide-react';

const Install = () => {
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    isSafari,
    isChrome,
    isStandalone,
    promptInstall,
    canPromptInstall,
  } = usePWAInstall();
  
  const {
    isSupported: notificationsSupported,
    permission: notificationPermission,
    requestPermission,
  } = usePushNotifications();

  const [showIOSSteps, setShowIOSSteps] = useState(true);
  const [showAndroidSteps, setShowAndroidSteps] = useState(true);

  const handleInstall = async () => {
    if (canPromptInstall) {
      const result = await promptInstall();
      if (result.success) {
        toast.success('IQROMAX muvaffaqiyatli o\'rnatildi!');
      }
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Bildirishnomalar muvaffaqiyatli yoqildi!');
    }
  };

  const features = [
    {
      icon: WifiOff,
      title: 'Offline ishlaydi',
      description: 'Internet bo\'lmaganda ham mashq qilishingiz mumkin',
    },
    {
      icon: Zap,
      title: 'Tez yuklanadi',
      description: 'Brauzerga qaraganda 3x tezroq ochiladi',
    },
    {
      icon: Bell,
      title: 'Bildirishnomalar',
      description: 'Kundalik mashqlar haqida eslatmalar oling',
    },
    {
      icon: Shield,
      title: 'Xavfsiz',
      description: 'Barcha ma\'lumotlar shifrlangan holda saqlanadi',
    },
  ];

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="flex-1 container px-4 py-6 md:py-10">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-primary shadow-glow mb-4">
              <Download className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              IQROMAX ilovasini o'rnating
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Telefoningizga o'rnatib, istalgan vaqtda mashq qiling
            </p>
          </div>

          {/* Already Installed */}
          {isInstalled || isStandalone ? (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">Ilova o'rnatilgan!</h3>
                    <p className="text-sm text-muted-foreground">
                      IQROMAX ilovasi allaqachon qurilmangizda o'rnatilgan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : canPromptInstall ? (
            /* Direct Install Button */
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
                    <Smartphone className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg text-foreground">Hoziroq o'rnating</h3>
                    <p className="text-sm text-muted-foreground">
                      Bir bosish bilan ilovani telefoningizga qo'shing
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto"
                    onClick={handleInstall}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    O'rnatish
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* iOS Instructions */}
          {isIOS && !isInstalled && (
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setShowIOSSteps(!showIOSSteps)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Apple className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">iPhone/iPad uchun</CardTitle>
                  </div>
                  {showIOSSteps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              {showIOSSteps && (
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Safari brauzerida oching</p>
                      <p className="text-sm text-muted-foreground">
                        Bu sahifani Safari brauzerida ochganingizga ishonch hosil qiling
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        Ulashish tugmasini bosing
                        <Share className="w-4 h-4" />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ekranning pastidagi kvadrat va o'q belgisini bosing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground flex items-center gap-2">
                        "Bosh ekranga qo'shish" ni tanlang
                        <PlusSquare className="w-4 h-4" />
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Menyudan "Add to Home Screen" yoki "Bosh ekranga qo'shish" ni tanlang
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">"Qo'shish" tugmasini bosing</p>
                      <p className="text-sm text-muted-foreground">
                        IQROMAX ilovasi bosh ekraningizga qo'shiladi
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Android Instructions */}
          {isAndroid && !isInstalled && !canPromptInstall && (
            <Card>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setShowAndroidSteps(!showAndroidSteps)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Chrome className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-lg">Android uchun</CardTitle>
                  </div>
                  {showAndroidSteps ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              {showAndroidSteps && (
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Chrome brauzerida oching</p>
                      <p className="text-sm text-muted-foreground">
                        Bu sahifani Chrome brauzerida ochganingizga ishonch hosil qiling
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Menyu tugmasini bosing ⋮</p>
                      <p className="text-sm text-muted-foreground">
                        Yuqori o'ng burchakdagi uchta nuqtani bosing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">"Ilovani o'rnatish" ni tanlang</p>
                      <p className="text-sm text-muted-foreground">
                        Yoki "Install app" / "Add to Home screen"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">"O'rnatish" tugmasini bosing</p>
                      <p className="text-sm text-muted-foreground">
                        IQROMAX ilovasi telefoningizga o'rnatiladi
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Notifications */}
          {notificationsSupported && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                    {notificationPermission === 'granted' ? (
                      <BellRing className="w-7 h-7 text-amber-500" />
                    ) : (
                      <Bell className="w-7 h-7 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg text-foreground">Bildirishnomalar</h3>
                    <p className="text-sm text-muted-foreground">
                      {notificationPermission === 'granted' 
                        ? 'Bildirishnomalar yoqilgan'
                        : 'Kundalik mashqlar haqida eslatmalar oling'
                      }
                    </p>
                  </div>
                  {notificationPermission !== 'granted' && (
                    <Button 
                      variant="outline"
                      className="w-full sm:w-auto border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                      onClick={handleEnableNotifications}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Yoqish
                    </Button>
                  )}
                  {notificationPermission === 'granted' && (
                    <div className="flex items-center gap-2 text-green-500">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">Yoqilgan</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <div className="text-center space-y-4 pt-4">
            <Button 
              size="lg"
              onClick={() => navigate('/train')}
              className="w-full sm:w-auto"
            >
              Mashq qilishni boshlash
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm text-muted-foreground">
              Ilovani o'rnatmasdan ham foydalanishingiz mumkin
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default Install;
