import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Trash2, 
  FileVideo, 
  FileImage, 
  File as FileIcon,
  Loader2,
  RefreshCw,
  Search,
  FolderOpen,
  HardDrive
} from 'lucide-react';

interface StorageFile {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface FileManagerProps {
  isAdmin: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (mimetype: string) => {
  if (mimetype?.startsWith('video/')) return <FileVideo className="h-5 w-5 text-primary" />;
  if (mimetype?.startsWith('image/')) return <FileImage className="h-5 w-5 text-accent" />;
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
};

export const FileManager = ({ isAdmin }: FileManagerProps) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteFile, setDeleteFile] = useState<StorageFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [totalSize, setTotalSize] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      fetchFiles();
    }
  }, [isAdmin]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('course-videos')
        .list('', {
          limit: 500,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      // Fetch files from subfolders too
      const folders = ['videos', 'thumbnails', 'lesson-thumbnails'];
      const allFiles: StorageFile[] = [];

      for (const folder of folders) {
        const { data: folderData } = await supabase.storage
          .from('course-videos')
          .list(folder, {
            limit: 500,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (folderData) {
          folderData.forEach(file => {
            if (file.name !== '.emptyFolderPlaceholder') {
              allFiles.push({
                ...file,
                name: `${folder}/${file.name}`,
              } as StorageFile);
            }
          });
        }
      }

      // Add root files
      if (data) {
        data.forEach(file => {
          if (!folders.includes(file.name) && file.name !== '.emptyFolderPlaceholder') {
            allFiles.push(file as StorageFile);
          }
        });
      }

      setFiles(allFiles);
      setTotalSize(allFiles.reduce((acc, f) => acc + (f.metadata?.size || 0), 0));
    } catch (error) {
      console.error(error);
      toast.error("Fayllarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFile) return;

    setDeleting(true);
    try {
      const { error } = await supabase.storage
        .from('course-videos')
        .remove([deleteFile.name]);

      if (error) throw error;

      setFiles(prev => prev.filter(f => f.id !== deleteFile.id));
      toast.success("Fayl o'chirildi");
    } catch (error) {
      console.error(error);
      toast.error("Faylni o'chirishda xatolik");
    } finally {
      setDeleting(false);
      setDeleteFile(null);
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const videoCount = files.filter(f => f.metadata?.mimetype?.startsWith('video/')).length;
  const imageCount = files.filter(f => f.metadata?.mimetype?.startsWith('image/')).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Fayl boshqaruvi</h3>
          <p className="text-sm text-muted-foreground">Yuklangan video va rasmlarni boshqaring</p>
        </div>
        <Button variant="outline" onClick={fetchFiles} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Yangilash
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
              <p className="text-xs text-muted-foreground">Jami hajm</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{files.length}</p>
              <p className="text-xs text-muted-foreground">Jami fayllar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileVideo className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{videoCount}</p>
              <p className="text-xs text-muted-foreground">Videolar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <FileImage className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{imageCount}</p>
              <p className="text-xs text-muted-foreground">Rasmlar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Fayl nomini qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* File List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fayllar ro'yxati</CardTitle>
          <CardDescription>{filteredFiles.length} ta fayl topildi</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Fayllar topilmadi</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(file.metadata?.mimetype)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(file.metadata?.size || 0)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(file.created_at).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteFile(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Faylni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteFile?.name}" faylini o'chirishni xohlaysizmi? Bu amalni qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
