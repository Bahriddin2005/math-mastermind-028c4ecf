import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageBackground } from "@/components/layout/PageBackground";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useGameCurrency } from "@/hooks/useGameCurrency";
import { useSound } from "@/hooks/useSound";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Coins, Heart, ArrowLeft, ShoppingCart, 
  Sparkles, Crown, Zap, CheckCircle, Package
} from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  category: string;
  item_type: string;
  stock: number | null;
}

interface UserItem {
  item_id: string;
  quantity: number;
}

const GameShop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coins, lives, maxLives, spendCoins, refresh: refreshCurrency } = useGameCurrency();
  const { soundEnabled, toggleSound } = useSound();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [userItems, setUserItems] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load shop items
      const { data: itemsData } = await supabase
        .from('shop_items')
        .select('*')
        .eq('is_available', true)
        .order('price');

      if (itemsData) {
        setItems(itemsData);
      }

      if (user) {
        // Load user inventory
        const { data: inventoryData } = await supabase
          .from('user_inventory')
          .select('item_id, quantity')
          .eq('user_id', user.id);

        if (inventoryData) {
          const inventoryMap = new Map<string, number>();
          inventoryData.forEach(item => {
            inventoryMap.set(item.item_id, item.quantity);
          });
          setUserItems(inventoryMap);
        }
      }
    } catch (error) {
      console.error('Error loading shop:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!user) {
      toast.error("Sotib olish uchun tizimga kiring");
      navigate('/auth');
      return;
    }

    if (coins < item.price) {
      toast.error("Yetarli coin yo'q!");
      return;
    }

    setPurchasing(item.id);

    try {
      // Spend coins
      const success = await spendCoins(item.price);
      if (!success) {
        toast.error("Xatolik yuz berdi");
        return;
      }

      // Add to inventory
      const existingQty = userItems.get(item.id) || 0;

      if (existingQty > 0) {
        // Update quantity
        await supabase
          .from('user_inventory')
          .update({ quantity: existingQty + 1 })
          .eq('user_id', user.id)
          .eq('item_id', item.id);
      } else {
        // Insert new
        await supabase
          .from('user_inventory')
          .insert({
            user_id: user.id,
            item_id: item.id,
            quantity: 1
          });
      }

      // Update local state
      setUserItems(new Map(userItems.set(item.id, existingQty + 1)));
      
      toast.success(`${item.name} sotib olindi!`, {
        icon: item.icon
      });

    } catch (error) {
      console.error('Purchase error:', error);
      toast.error("Xatolik yuz berdi");
    } finally {
      setPurchasing(null);
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

  const categories = [...new Set(items.map(i => i.category))];

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
            <h1 className="text-2xl font-bold">Sovg'alar Do'koni</h1>
            <p className="text-sm text-muted-foreground">Coinlaringizni sarflang</p>
          </div>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 border-0 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-white/80">Sizning balansingiz</p>
                  <p className="text-3xl font-bold">{coins.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Heart className="h-5 w-5 text-red-300 fill-red-300" />
                <span className="font-bold">{lives}/{maxLives}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Shop Items */}
        <Tabs defaultValue={categories[0] || 'powerup'} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1.5">
                {getCategoryIcon(cat)}
                <span className="hidden sm:inline">{getCategoryLabel(cat)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-3">
              {items
                .filter(item => item.category === category)
                .map(item => {
                  const owned = userItems.get(item.id) || 0;
                  const canAfford = coins >= item.price;
                  const isPurchasing = purchasing === item.id;

                  return (
                    <Card 
                      key={item.id} 
                      className={`overflow-hidden transition-all ${
                        !canAfford ? 'opacity-60' : 'hover:shadow-md'
                      }`}
                    >
                      <div className="p-4 flex items-center gap-4">
                        {/* Item Icon */}
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-3xl shrink-0">
                          {item.icon}
                        </div>

                        {/* Item Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{item.name}</h3>
                            {owned > 0 && (
                              <Badge variant="secondary" className="shrink-0">
                                {owned}x
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          {item.item_type === 'cosmetic' && owned > 0 && (
                            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Sizda bor</span>
                            </div>
                          )}
                        </div>

                        {/* Price & Buy Button */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1 font-bold text-amber-600">
                            <Coins className="h-4 w-4" />
                            <span>{item.price}</span>
                          </div>
                          <Button
                            size="sm"
                            disabled={!canAfford || isPurchasing || (item.item_type === 'cosmetic' && owned > 0)}
                            onClick={() => handlePurchase(item)}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          >
                            {isPurchasing ? (
                              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : item.item_type === 'cosmetic' && owned > 0 ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <>
                                <ShoppingCart className="h-4 w-4 mr-1" />
                                Olish
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}

              {items.filter(i => i.category === category).length === 0 && (
                <Card className="p-8 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Bu kategoriyada mahsulot yo'q</p>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* My Inventory Link */}
        <Card className="mt-6 p-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/game-inventory')}
          >
            <Package className="h-4 w-4 mr-2" />
            Mening inventarim
          </Button>
        </Card>
      </div>
    </PageBackground>
  );
};

export default GameShop;
