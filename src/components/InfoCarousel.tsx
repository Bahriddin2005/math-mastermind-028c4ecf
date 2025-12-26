import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './ui/carousel';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Newspaper, CreditCard, Phone, ExternalLink, ArrowRight } from 'lucide-react';

interface InfoCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
  gradient: string;
  iconColor: string;
}

const InfoCard = ({ icon: Icon, title, description, buttonText, gradient, iconColor }: InfoCardProps) => (
  <Card className={`border-0 shadow-lg overflow-hidden ${gradient}`}>
    <CardContent className="p-6 space-y-4">
      <div className={`w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center`}>
        <Icon className={`h-7 w-7 ${iconColor}`} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/80 text-sm leading-relaxed">{description}</p>
      </div>
      <Button 
        variant="secondary" 
        className="w-full bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
      >
        {buttonText}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </CardContent>
  </Card>
);

const carouselItems: InfoCardProps[] = [
  {
    icon: Newspaper,
    title: "Blog va Yangiliklar",
    description: "Mental arifmetika bo'yicha eng so'nggi maqolalar, maslahatlar va yangiliklar bilan tanishing.",
    buttonText: "Blogni o'qish",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
    iconColor: "text-blue-100",
  },
  {
    icon: CreditCard,
    title: "Tariflar",
    description: "Premium a'zolik bilan cheksiz mashqlar, maxsus darslar va shaxsiy statistikaga ega bo'ling.",
    buttonText: "Tariflarni ko'rish",
    gradient: "bg-gradient-to-br from-purple-500 to-purple-700",
    iconColor: "text-purple-100",
  },
  {
    icon: Phone,
    title: "Biz bilan bog'lanish",
    description: "Savollaringiz bormi? Bizning jamoamiz sizga yordam berishga tayyor. Aloqaga chiqing!",
    buttonText: "Bog'lanish",
    gradient: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    iconColor: "text-emerald-100",
  },
];

export const InfoCarousel = () => {
  return (
    <div className="w-full opacity-0 animate-slide-up" style={{ animationDelay: '650ms', animationFillMode: 'forwards' }}>
      <h2 className="text-lg font-display font-bold text-foreground mb-4">
        Ma'lumotlar
      </h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {carouselItems.map((item, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
              <InfoCard {...item} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 bg-card border-border shadow-md" />
        <CarouselNext className="hidden md:flex -right-4 bg-card border-border shadow-md" />
      </Carousel>
    </div>
  );
};
