import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  HelpCircle,
  Loader2,
  GripVertical
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: string;
  order_index: number;
  is_active: boolean;
}

const iconOptions = [
  { value: 'HelpCircle', label: 'Yordam' },
  { value: 'Calculator', label: 'Kalkulyator' },
  { value: 'GraduationCap', label: 'Kurs' },
  { value: 'Trophy', label: 'Kubok' },
  { value: 'Settings', label: 'Sozlamalar' },
  { value: 'BookOpen', label: 'Kitob' },
  { value: 'Target', label: 'Nishon' },
  { value: 'User', label: 'Foydalanuvchi' },
];

export const FAQManager = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    icon: 'HelpCircle',
    is_active: true,
  });

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('faq_items')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) {
      setFaqs(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      icon: 'HelpCircle',
      is_active: true,
    });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Savol va javobni kiriting");
      return;
    }

    const payload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      icon: formData.icon,
      is_active: formData.is_active,
      order_index: editingId ? undefined : faqs.length,
    };

    if (editingId) {
      const { error } = await supabase
        .from('faq_items')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast.error("Xatolik yuz berdi");
      } else {
        toast.success("FAQ yangilandi");
        resetForm();
        fetchFAQs();
      }
    } else {
      const { error } = await supabase
        .from('faq_items')
        .insert([payload]);

      if (error) {
        toast.error("Xatolik yuz berdi");
      } else {
        toast.success("FAQ qo'shildi");
        resetForm();
        fetchFAQs();
      }
    }
  };

  const handleEdit = (faq: FAQItem) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      icon: faq.icon,
      is_active: faq.is_active,
    });
    setEditingId(faq.id);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("FAQ ni o'chirmoqchimisiz?")) return;

    const { error } = await supabase
      .from('faq_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Xatolik yuz berdi");
    } else {
      toast.success("FAQ o'chirildi");
      fetchFAQs();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('faq_items')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchFAQs();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            {editingId ? "FAQ tahrirlash" : "Yangi FAQ qo'shish"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Savol *</Label>
                <Input
                  placeholder="Masalan: Mashq qanday ishlaydi?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Ikonka</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(v) => setFormData({ ...formData, icon: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Holat</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? "Faol" : "Nofaol"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Javob *</Label>
              <Textarea
                placeholder="Savolga to'liq javob yozing..."
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="submit" className="gap-2">
                {editingId ? (
                  <>
                    <Save className="h-4 w-4" />
                    Saqlash
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Qo'shish
                  </>
                )}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" />
                  Bekor qilish
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* FAQ List */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>FAQ ro'yxati</span>
            <Badge variant="secondary">{faqs.length} ta</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">FAQ lar topilmadi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                    faq.is_active 
                      ? 'bg-card border-border/40' 
                      : 'bg-secondary/30 border-border/20 opacity-60'
                  }`}
                >
                  <div className="pt-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{faq.icon}</Badge>
                      {!faq.is_active && (
                        <Badge variant="secondary" className="text-muted-foreground">Nofaol</Badge>
                      )}
                    </div>
                    <p className="font-semibold mb-1">{faq.question}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={faq.is_active}
                      onCheckedChange={() => toggleActive(faq.id, faq.is_active)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(faq)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(faq.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
