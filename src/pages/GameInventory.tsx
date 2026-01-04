import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageBackground } from "@/components/layout/PageBackground";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useSound } from "@/hooks/useSound";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, Package, Sparkles, Crown, Zap, 
  CheckCircle, ShoppingBag, Gift
} from "lucide-react";

interface InventoryItem {
  id: string;
  item_id: string;
  quantity: number;
  purchased_at: string;
  item: {
    name: string;
    description: string;
    icon: string;
    category: string;
    item_type: string;
  };
}

const GameInventory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInventory();
      loadActiveItem();
    }
  }, [user]);

  const loadInventory = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_inventory')
        .select(`
          id,
          item_id,
          quantity,
          purchased_at,
          shop_items (name, description, icon, category, item_type)
        `)
        .eq('user_id', user.id)
        .gt('quantity', 0);

      if (data) {
        const formattedItems: InventoryItem[] = data.map((item: any) => ({
          id: item.id,
          item_id: item.item_id,
          quantity: item.quantity,
          purchased_at: item.purchased_at,
          item: {
            name: item.shop_items.name,
            description: item.shop_items.description,
            icon: item.shop_items.icon,
            category: item.shop_items.category,
            item_type: item.shop_items.item_type
          }
        }));
        setItems(formattedItems);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveItem = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', user.id)
      .single();

    if (data?.avatar_url?.startsWith('cosmetic:')) {
      setActiveItem(data.avatar_url.replace('cosmetic:', ''));
    }
  };

  const activateCosmetic = async (item: InventoryItem) => {
    if (!user || item.item.item_type !== 'cosmetic') return;

    try {
      await supabase
        .from('profiles')
        .update({ avatar_url: `cosmetic:${item.item_id}` })
        .eq('user_id', user.id);

      setActiveItem(item.item_id);
      toast.success(`${item.item.name} faollashtirildi!`);
    } catch (error) {
      console.error('Error activating cosmetic:', error);
      toast.error('Xatolik yuz berdi');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'powerup': return <Zap className="h-4 w-4" />;
      case 'avatar': return <Crown className="h-4 w-4" />;
      case 'badge': return <Sparkles className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'powerup': return "Kuchlar";
      case 'avatar': return "Avatar";
      case 'badge': return "Belgilar";
      default: return "Boshqa";
    }
  };

  const categories = [...new Set(items.map(i => i.item.category))];
  const powerups = items.filter(i => i.item.item_type === 'consumable');
  const cosmetics = items.filter(i => i.item.item_type === 'cosmetic');

  return (
    <PageBackground>
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/game-hub')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Inventar
            </h1>
            <p className="text-sm text-muted-foreground">Sizning buyumlaringiz</p>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Jami buyumlar</p>
              <p className="text-3xl font-bold">{items.reduce((sum, i) => sum + i.quantity, 0)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Turlar</p>
              <p className="text-3xl font-bold">{items.length}</p>
            </div>
          </div>
        </Card>

        {items.length === 0 && !loading ? (
          <Card className="p-8 text-center">
            <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Inventar bo'sh</h3>
            <p className="text-muted-foreground mb-4">
              Do'kondan buyumlar sotib oling!
            </p>
            <Button onClick={() => navigate('/game-shop')}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Do'konga o'tish
            </Button>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">
                <Package className="h-4 w-4 mr-1.5" />
                Hammasi
              </TabsTrigger>
              <TabsTrigger value="powerups">
                <Zap className="h-4 w-4 mr-1.5" />
                Kuchlar
              </TabsTrigger>
              <TabsTrigger value="cosmetics">
                <Crown className="h-4 w-4 mr-1.5" />
                Bezaklar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {items.map(item => (
                <InventoryItemCard 
                  key={item.id} 
                  item={item} 
                  isActive={activeItem === item.item_id}
                  onActivate={() => activateCosmetic(item)}
                />
              ))}
            </TabsContent>

            <TabsContent value="powerups" className="space-y-3">
              {powerups.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Power-uplar yo'q</p>
                </Card>
              ) : (
                powerups.map(item => (
                  <InventoryItemCard 
                    key={item.id} 
                    item={item} 
                    isActive={false}
                    onActivate={() => {}}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="cosmetics" className="space-y-3">
              {cosmetics.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  <Crown className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Bezaklar yo'q</p>
                </Card>
              ) : (
                cosmetics.map(item => (
                  <InventoryItemCard 
                    key={item.id} 
                    item={item} 
                    isActive={activeItem === item.item_id}
                    onActivate={() => activateCosmetic(item)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Shop Link */}
        <Card className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ko'proq buyum olmoqchimisiz?</p>
              <p className="text-sm text-muted-foreground">Do'konga o'ting</p>
            </div>
            <Button onClick={() => navigate('/game-shop')}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Do'kon
            </Button>
          </div>
        </Card>
      </div>
    </PageBackground>
  );
};

interface InventoryItemCardProps {
  item: InventoryItem;
  isActive: boolean;
  onActivate: () => void;
}

const InventoryItemCard = ({ item, isActive, onActivate }: InventoryItemCardProps) => {
  const isCosmetic = item.item.item_type === 'cosmetic';

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${
      isActive ? 'ring-2 ring-primary' : ''
    }`}>
      <div className="p-4 flex items-center gap-4">
        {/* Item Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 ${
          isActive 
            ? 'bg-gradient-to-br from-primary/20 to-purple-500/20 ring-2 ring-primary' 
            : 'bg-gradient-to-br from-secondary to-secondary/50'
        }`}>
          {item.item.icon}
        </div>

        {/* Item Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{item.item.name}</h3>
            <Badge variant="secondary" className="shrink-0">
              x{item.quantity}
            </Badge>
            {isActive && (
              <Badge className="bg-primary text-primary-foreground shrink-0">
                <CheckCircle className="h-3 w-3 mr-1" />
                Faol
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {item.item.description}
          </p>
        </div>

        {/* Action Button */}
        {isCosmetic && !isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={onActivate}
          >
            Faollashtirish
          </Button>
        )}
      </div>
    </Card>
  );
};

export default GameInventory;
