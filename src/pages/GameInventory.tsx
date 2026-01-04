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
import { useVipStatus } from "@/hooks/useVipStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvatarWithFrame } from "@/components/AvatarWithFrame";
import { 
  ArrowLeft, Package, Sparkles, Crown, Zap, 
  CheckCircle, ShoppingBag, Gift
} from "lucide-react";

interface InventoryItem {
  id: string;
  item_id: string;
  quantity: number;
  purchased_at: string;
  is_active: boolean;
  item: {
    name: string;
    description: string;
    icon: string;
    category: string;
    item_type: string;
  };
}

interface ProfileData {
  avatar_url: string | null;
  username: string;
  selected_frame: string | null;
}

const GameInventory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const { isVip, activateVip } = useVipStatus();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFrame, setActiveFrame] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (user) {
      loadInventory();
      loadProfile();
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
          is_active,
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
          is_active: item.is_active || false,
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

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('avatar_url, username, selected_frame')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setProfile(data);
      setActiveFrame(data.selected_frame);
    }
  };

  const activateFrame = async (item: InventoryItem) => {
    if (!user || item.item.category !== 'cosmetic') return;

    try {
      // Deactivate all frames first
      await supabase
        .from('user_inventory')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate this frame
      await supabase
        .from('user_inventory')
        .update({ is_active: true })
        .eq('id', item.id);

      // Update profile with selected frame
      await supabase
        .from('profiles')
        .update({ selected_frame: item.item.icon })
        .eq('user_id', user.id);

      setActiveFrame(item.item.icon);
      setItems(prev => prev.map(i => ({ ...i, is_active: i.id === item.id })));
      toast.success(`${item.item.name} faollashtirildi!`);
    } catch (error) {
      console.error('Error activating frame:', error);
      toast.error('Xatolik yuz berdi');
    }
  };

  const activateVipSubscription = async (item: InventoryItem) => {
    if (!user) return;

    // Determine VIP duration based on item name
    let days = 7;
    if (item.item.name.includes('1 oy')) days = 30;
    else if (item.item.name.includes('3 oy')) days = 90;

    const success = await activateVip(days);
    if (success) {
      // Remove one from inventory
      if (item.quantity > 1) {
        await supabase
          .from('user_inventory')
          .update({ quantity: item.quantity - 1 })
          .eq('id', item.id);
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
        ));
      } else {
        await supabase
          .from('user_inventory')
          .delete()
          .eq('id', item.id);
        setItems(prev => prev.filter(i => i.id !== item.id));
      }
      toast.success(`VIP ${days} kunga faollashtirildi! 👑`);
    } else {
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
  const cosmetics = items.filter(i => i.item.category === 'cosmetic');
  const vipItems = items.filter(i => i.item.category === 'vip');
  const subscriptions = items.filter(i => i.item.item_type === 'subscription');

  const handleItemAction = (item: InventoryItem) => {
    if (item.item.category === 'cosmetic') {
      activateFrame(item);
    } else if (item.item.item_type === 'subscription') {
      activateVipSubscription(item);
    }
  };

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

        {/* Avatar Preview with Frame */}
        {profile && (
          <Card className="mb-6 p-6 text-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800">
            <div className="flex flex-col items-center gap-3">
              <AvatarWithFrame 
                avatarUrl={profile.avatar_url}
                username={profile.username}
                selectedFrame={activeFrame}
                isVip={isVip}
                size="xl"
              />
              <div>
                <p className="font-semibold">{profile.username}</p>
                {isVip && (
                  <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Stats Card */}
        <Card className="mb-6 p-4">
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
                  isActive={item.item.category === 'cosmetic' && activeFrame === item.item.icon}
                  onActivate={() => handleItemAction(item)}
                  isVip={isVip}
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
                    isActive={activeFrame === item.item.icon}
                    onActivate={() => activateFrame(item)}
                    isVip={isVip}
                  />
                ))
              )}
            </TabsContent>

            {/* VIP subscriptions */}
            {subscriptions.length > 0 && (
              <TabsContent value="vip" className="space-y-3">
                {subscriptions.map(item => (
                  <InventoryItemCard 
                    key={item.id} 
                    item={item} 
                    isActive={false}
                    onActivate={() => activateVipSubscription(item)}
                    isVip={isVip}
                  />
                ))}
              </TabsContent>
            )}
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
  isVip?: boolean;
}

const InventoryItemCard = ({ item, isActive, onActivate, isVip }: InventoryItemCardProps) => {
  const isCosmetic = item.item.category === 'cosmetic';
  const isSubscription = item.item.item_type === 'subscription';

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
        {isSubscription && (
          <Button
            size="sm"
            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
            onClick={onActivate}
          >
            <Crown className="h-4 w-4 mr-1" />
            Yoqish
          </Button>
        )}
      </div>
    </Card>
  );
};

export default GameInventory;
