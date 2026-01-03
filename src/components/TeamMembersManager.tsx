import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { AvatarCropDialog } from './AvatarCropDialog';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from './ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  User, 
  Users, 
  Upload,
  GripVertical,
  Check
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string | null;
  avatar_url: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const TeamMembersManager = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  
  // Avatar upload states
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    role: '',
    description: '',
    avatar_url: '',
    order_index: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching team members:', error);
      toast.error("Jamoa a'zolarini yuklashda xatolik");
    } else {
      setMembers(data || []);
    }
    setLoading(false);
  };

  const openDialog = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setForm({
        name: member.name,
        role: member.role,
        description: member.description || '',
        avatar_url: member.avatar_url || '',
        order_index: member.order_index,
        is_active: member.is_active,
      });
    } else {
      setEditingMember(null);
      setForm({
        name: '',
        role: '',
        description: '',
        avatar_url: '',
        order_index: members.length,
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.role) {
      toast.error("Ism va lavozim to'ldirilishi shart");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: form.name,
        role: form.role,
        description: form.description || null,
        avatar_url: form.avatar_url || null,
        order_index: form.order_index,
        is_active: form.is_active,
      };

      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update(data)
          .eq('id', editingMember.id);
        
        if (error) throw error;
        toast.success("A'zo ma'lumotlari yangilandi");
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert(data);
        
        if (error) throw error;
        toast.success("Yangi a'zo qo'shildi");
      }
      
      setDialogOpen(false);
      fetchMembers();
    } catch (error: any) {
      console.error('Error saving team member:', error);
      toast.error(error.message || "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberToDelete.id);
      
      if (error) throw error;
      toast.success("A'zo o'chirildi");
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (error: any) {
      console.error('Error deleting team member:', error);
      toast.error(error.message || "Xatolik yuz berdi");
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id);
      
      if (error) throw error;
      toast.success(member.is_active ? "A'zo yashirildi" : "A'zo ko'rsatildi");
      fetchMembers();
    } catch (error: any) {
      console.error('Error toggling team member:', error);
      toast.error(error.message || "Xatolik yuz berdi");
    }
  };

  // Avatar upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Faqat rasm fayllarini yuklash mumkin");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Rasm hajmi 5MB dan oshmasligi kerak");
        return;
      }
      setSelectedImageFile(file);
      setCropDialogOpen(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob | null) => {
    setCropDialogOpen(false);
    setSelectedImageFile(null);

    if (!croppedBlob) return;

    setUploadingAvatar(true);
    try {
      const fileName = `team-member-${Date.now()}.jpg`;
      const filePath = `team-members/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast.success("Rasm yuklandi");
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error("Rasmni yuklashda xatolik");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <Card className="overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/30 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-900/80 border-border/50 dark:border-slate-600/50">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl animate-pulse" />
            <div className="relative p-4 rounded-full bg-gradient-to-br from-card/80 to-muted/50 border border-border/50 shadow-lg dark:from-slate-800/80 dark:to-slate-900/50 dark:border-slate-600/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden bg-gradient-to-br from-card via-card/95 to-muted/30 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-slate-900/80 border-border/50 dark:border-slate-600/50">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-6 border-b border-border/30 dark:border-slate-700/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                Jamoa a'zolari
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Bosh sahifada ko'rsatiladigan jamoa a'zolarini boshqaring
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()} size="sm" className="w-full sm:w-auto gap-1.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Qo'shish</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {members.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-muted to-muted/50 dark:from-slate-700 dark:to-slate-800 w-fit mx-auto mb-4">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium text-sm sm:text-base">Hali jamoa a'zolari yo'q</p>
              <Button onClick={() => openDialog()} variant="outline" className="mt-4 gap-2 text-sm dark:bg-slate-800/50 dark:border-slate-600/50 dark:hover:bg-slate-700/50">
                <Plus className="h-4 w-4" />
                Birinchi a'zoni qo'shing
              </Button>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex flex-col xs:flex-row xs:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border transition-all ${
                    member.is_active 
                      ? 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 border-indigo-500/20 dark:border-indigo-500/30 hover:border-indigo-500/40 dark:hover:border-indigo-500/50' 
                      : 'bg-muted/30 dark:bg-slate-800/30 border-border/30 dark:border-slate-700/30 opacity-60'
                  }`}
                >
                  <div className="hidden sm:block cursor-move text-muted-foreground/50">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                      {member.avatar_url ? (
                        <AvatarImage src={member.avatar_url} alt={member.name} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 dark:text-indigo-400" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="font-medium text-sm sm:text-base truncate text-foreground">{member.name}</h4>
                        {!member.is_active && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs dark:bg-slate-700 dark:text-slate-300">Yashirin</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground/80 dark:text-slate-400 truncate">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-end xs:justify-start self-end xs:self-auto">
                    <Switch
                      checked={member.is_active}
                      onCheckedChange={() => handleToggleActive(member)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(member)}
                      className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMemberToDelete(member);
                        setDeleteDialogOpen(true);
                      }}
                      className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30">
                <User className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              </div>
              {editingMember ? "A'zoni tahrirlash" : "Yangi a'zo qo'shish"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Jamoa a'zosi ma'lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                {form.avatar_url ? (
                  <AvatarImage src={form.avatar_url} alt="Avatar" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/30 dark:to-purple-500/30">
                  <User className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-500 dark:text-indigo-400" />
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="gap-2 text-xs sm:text-sm dark:bg-slate-800/50 dark:border-slate-600/50 dark:hover:bg-slate-700/50"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Rasm yuklash
              </Button>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">Ism *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masalan: Ahmadjon Karimov"
                className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="role" className="text-xs sm:text-sm">Lavozim *</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Masalan: Mental arifmetika ustozi"
                className="text-sm dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">Tavsif</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Qisqacha ma'lumot..."
                rows={3}
                className="text-sm min-h-[60px] dark:bg-slate-800/50 dark:border-slate-600/50 focus:border-primary/50"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 dark:bg-slate-800/50">
              <Label htmlFor="is_active" className="text-xs sm:text-sm">Faol holat</Label>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto text-sm dark:bg-slate-800/50 dark:border-slate-600/50 dark:hover:bg-slate-700/50">
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saqlash
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-gradient-to-br from-background via-background to-muted/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">O'chirishni tasdiqlang</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {memberToDelete?.name} ni o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="w-full sm:w-auto text-sm dark:bg-slate-800/50 dark:border-slate-600/50 dark:hover:bg-slate-700/50">
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto text-sm">
              O'chirish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageFile={selectedImageFile}
        onCropComplete={handleCropComplete}
      />
    </>
  );
};
