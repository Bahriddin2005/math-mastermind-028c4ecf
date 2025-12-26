import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  HardDrive,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckSquare,
  Square,
  Image as ImageIcon
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

interface FolderGroup {
  name: string;
  displayName: string;
  files: StorageFile[];
  totalSize: number;
  isOpen: boolean;
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

const FOLDER_NAMES: Record<string, string> = {
  'videos': 'Videolar',
  'thumbnails': 'Kurs rasmlari',
  'lesson-thumbnails': 'Dars rasmlari',
  'root': 'Boshqa fayllar',
};

export const FileManager = ({ isAdmin }: FileManagerProps) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteFiles, setDeleteFiles] = useState<StorageFile[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['videos', 'thumbnails', 'lesson-thumbnails', 'root']));
  
  // Orphan detection
  const [usedUrls, setUsedUrls] = useState<Set<string>>(new Set());
  const [showOrphansOnly, setShowOrphansOnly] = useState(false);
  const [loadingOrphans, setLoadingOrphans] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchFiles();
      fetchUsedUrls();
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

  const fetchUsedUrls = async () => {
    setLoadingOrphans(true);
    try {
      const [coursesRes, lessonsRes] = await Promise.all([
        supabase.from('courses').select('thumbnail_url'),
        supabase.from('lessons').select('video_url, thumbnail_url'),
      ]);

      const urls = new Set<string>();

      coursesRes.data?.forEach(c => {
        if (c.thumbnail_url) urls.add(c.thumbnail_url);
      });

      lessonsRes.data?.forEach(l => {
        if (l.video_url) urls.add(l.video_url);
        if (l.thumbnail_url) urls.add(l.thumbnail_url);
      });

      setUsedUrls(urls);
    } catch (error) {
      console.error('Error fetching used URLs:', error);
    } finally {
      setLoadingOrphans(false);
    }
  };

  const getFilePublicUrl = (fileName: string): string => {
    const { data } = supabase.storage.from('course-videos').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const isOrphan = (file: StorageFile): boolean => {
    const publicUrl = getFilePublicUrl(file.name);
    return !usedUrls.has(publicUrl);
  };

  const handleDelete = async () => {
    if (deleteFiles.length === 0) return;

    setDeleting(true);
    try {
      const fileNames = deleteFiles.map(f => f.name);
      const { error } = await supabase.storage
        .from('course-videos')
        .remove(fileNames);

      if (error) throw error;

      const deletedIds = new Set(deleteFiles.map(f => f.id));
      setFiles(prev => prev.filter(f => !deletedIds.has(f.id)));
      setSelectedFiles(new Set());
      toast.success(`${deleteFiles.length} ta fayl o'chirildi`);
    } catch (error) {
      console.error(error);
      toast.error("Fayllarni o'chirishda xatolik");
    } finally {
      setDeleting(false);
      setDeleteFiles([]);
    }
  };

  const handleSelectAll = (folder: string, filesInFolder: StorageFile[]) => {
    const allSelected = filesInFolder.every(f => selectedFiles.has(f.id));
    const newSelected = new Set(selectedFiles);

    if (allSelected) {
      filesInFolder.forEach(f => newSelected.delete(f.id));
    } else {
      filesInFolder.forEach(f => newSelected.add(f.id));
    }

    setSelectedFiles(newSelected);
  };

  const handleSelectFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleFolder = (folder: string) => {
    const newOpen = new Set(openFolders);
    if (newOpen.has(folder)) {
      newOpen.delete(folder);
    } else {
      newOpen.add(folder);
    }
    setOpenFolders(newOpen);
  };

  const deleteSelectedFiles = () => {
    const filesToDelete = files.filter(f => selectedFiles.has(f.id));
    setDeleteFiles(filesToDelete);
  };

  const deleteOrphanFiles = () => {
    const orphanFiles = files.filter(f => isOrphan(f));
    if (orphanFiles.length === 0) {
      toast.info("Ishlatilmayotgan fayllar topilmadi");
      return;
    }
    setDeleteFiles(orphanFiles);
  };

  // Group files by folder
  const folderGroups = useMemo((): FolderGroup[] => {
    const groups: Record<string, StorageFile[]> = {
      'videos': [],
      'thumbnails': [],
      'lesson-thumbnails': [],
      'root': [],
    };

    const filteredFiles = files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOrphan = !showOrphansOnly || isOrphan(file);
      return matchesSearch && matchesOrphan;
    });

    filteredFiles.forEach(file => {
      if (file.name.startsWith('videos/')) {
        groups['videos'].push(file);
      } else if (file.name.startsWith('thumbnails/')) {
        groups['thumbnails'].push(file);
      } else if (file.name.startsWith('lesson-thumbnails/')) {
        groups['lesson-thumbnails'].push(file);
      } else {
        groups['root'].push(file);
      }
    });

    return Object.entries(groups)
      .filter(([_, files]) => files.length > 0)
      .map(([name, files]) => ({
        name,
        displayName: FOLDER_NAMES[name] || name,
        files,
        totalSize: files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0),
        isOpen: openFolders.has(name),
      }));
  }, [files, searchQuery, showOrphansOnly, openFolders, usedUrls]);

  const videoCount = files.filter(f => f.metadata?.mimetype?.startsWith('video/')).length;
  const imageCount = files.filter(f => f.metadata?.mimetype?.startsWith('image/')).length;
  const orphanCount = files.filter(f => isOrphan(f)).length;

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
        <div className="flex gap-2">
          {selectedFiles.size > 0 && (
            <Button 
              variant="destructive" 
              onClick={deleteSelectedFiles}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {selectedFiles.size} ta o'chirish
            </Button>
          )}
          <Button variant="outline" onClick={fetchFiles} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Yangilash
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
        <Card 
          className={`cursor-pointer transition-colors ${showOrphansOnly ? 'ring-2 ring-destructive' : ''}`}
          onClick={() => setShowOrphansOnly(!showOrphansOnly)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loadingOrphans ? '...' : orphanCount}</p>
              <p className="text-xs text-muted-foreground">Ishlatilmayotgan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orphan cleanup button */}
      {orphanCount > 0 && (
        <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="font-medium text-destructive">{orphanCount} ta ishlatilmayotgan fayl topildi</p>
            <p className="text-sm text-muted-foreground">Bu fayllar hech qaysi kurs yoki darsda ishlatilmayapti</p>
          </div>
          <Button 
            variant="destructive" 
            onClick={deleteOrphanFiles}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Hammasini tozalash
          </Button>
        </div>
      )}

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

      {/* File List by Folders */}
      <div className="space-y-4">
        {folderGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Fayllar topilmadi</p>
            </CardContent>
          </Card>
        ) : (
          folderGroups.map((group) => (
            <Card key={group.name}>
              <Collapsible open={group.isOpen} onOpenChange={() => toggleFolder(group.name)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {group.isOpen ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <FolderOpen className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">{group.displayName}</CardTitle>
                          <CardDescription>
                            {group.files.length} ta fayl • {formatFileSize(group.totalSize)}
                          </CardDescription>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAll(group.name, group.files);
                        }}
                      >
                        {group.files.every(f => selectedFiles.has(f.id)) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                        Barchasini tanlash
                      </Button>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-0 border-t">
                    <ScrollArea className="max-h-[400px]">
                      <div className="divide-y">
                        {group.files.map((file) => {
                          const isImage = file.metadata?.mimetype?.startsWith('image/');
                          const isVideo = file.metadata?.mimetype?.startsWith('video/');
                          const fileUrl = getFilePublicUrl(file.name);
                          const orphan = isOrphan(file);

                          return (
                            <div 
                              key={file.id}
                              className={`flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors ${
                                orphan ? 'bg-destructive/5' : ''
                              }`}
                            >
                              <Checkbox
                                checked={selectedFiles.has(file.id)}
                                onCheckedChange={() => handleSelectFile(file.id)}
                              />
                              
                              {/* Preview / Icon */}
                              <div className="h-12 w-12 rounded-lg overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0">
                                {isImage ? (
                                  <img 
                                    src={fileUrl} 
                                    alt={file.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-muted-foreground"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></span>';
                                    }}
                                  />
                                ) : isVideo ? (
                                  <FileVideo className="h-6 w-6 text-primary" />
                                ) : (
                                  <FileIcon className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>

                              {/* File info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{file.name.split('/').pop()}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {formatFileSize(file.metadata?.size || 0)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(file.created_at).toLocaleDateString('uz-UZ')}
                                  </span>
                                  {file.metadata?.mimetype && (
                                    <span className="text-xs text-muted-foreground">
                                      {file.metadata.mimetype}
                                    </span>
                                  )}
                                  {orphan && (
                                    <Badge variant="destructive" className="text-xs">
                                      Ishlatilmayapti
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteFiles([file])}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteFiles.length > 0} onOpenChange={() => setDeleteFiles([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteFiles.length === 1 ? "Faylni o'chirish" : `${deleteFiles.length} ta faylni o'chirish`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFiles.length === 1 
                ? `"${deleteFiles[0]?.name}" faylini o'chirishni xohlaysizmi?`
                : `${deleteFiles.length} ta faylni o'chirishni xohlaysizmi?`
              }
              <br />
              Bu amalni qaytarib bo'lmaydi.
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
