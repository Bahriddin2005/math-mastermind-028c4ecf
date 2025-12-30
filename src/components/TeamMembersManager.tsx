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
      <Card className="overflow-hidden">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Users className="h-5 w-5 text-indigo-500" />
                Jamoa a'zolari
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1">
                Bosh sahifada ko'rsatiladigan jamoa a'zolarini boshqaring
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Qo'shish</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Hali jamoa a'zolari yo'q</p>
              <Button onClick={() => openDialog()} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Birinchi a'zoni qo'shing
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    member.is_active 
                      ? 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-indigo-500/20' 
                      : 'bg-muted/50 border-border/50 opacity-60'
                  }`}
                >
                  <div className="cursor-move text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
                  <Avatar className="h-12 w-12 shrink-0">
                    {member.avatar_url ? (
                      <AvatarImage src={member.avatar_url} alt={member.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                      <User className="h-5 w-5 text-indigo-500" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{member.name}</h4>
                      {!member.is_active && (
                        <Badge variant="secondary" className="text-xs">Yashirin</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{member.role}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={member.is_active}
                      onCheckedChange={() => handleToggleActive(member)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDialog(member)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setMemberToDelete(member);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-muted-foreground hover:text-destructive"
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMember ? "A'zoni tahrirlash" : "Yangi a'zo qo'shish"}
            </DialogTitle>
            <DialogDescription>
              Jamoa a'zosi ma'lumotlarini kiriting
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-24 w-24">
                {form.avatar_url ? (
                  <AvatarImage src={form.avatar_url} alt="Avatar" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                  <User className="h-10 w-10 text-indigo-500" />
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
                className="gap-2"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Rasm yuklash
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Ism *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Masalan: Ahmadjon Karimov"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Lavozim *</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                placeholder="Masalan: Mental arifmetika ustozi"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Qisqacha ma'lumot..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Faol holat</Label>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={saving}>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>O'chirishni tasdiqlang</DialogTitle>
            <DialogDescription>
              {memberToDelete?.name} ni o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
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
