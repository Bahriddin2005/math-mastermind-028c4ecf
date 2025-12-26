import { QueuedFile, UploadStatus } from '@/hooks/useUploadQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  Pause,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Upload,
  Trash2,
  FileVideo,
  FileImage,
  File as FileIcon,
} from 'lucide-react';

interface UploadQueuePanelProps {
  queue: QueuedFile[];
  stats: {
    total: number;
    queued: number;
    uploading: number;
    completed: number;
    error: number;
    paused: number;
  };
  isProcessing: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusIcon = (status: UploadStatus) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    case 'uploading':
      return <Upload className="h-4 w-4 text-primary animate-pulse" />;
    case 'paused':
      return <Pause className="h-4 w-4 text-yellow-500" />;
    default:
      return <FileIcon className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusLabel = (status: UploadStatus): string => {
  switch (status) {
    case 'completed':
      return 'Yuklandi';
    case 'error':
      return 'Xato';
    case 'uploading':
      return 'Yuklanmoqda';
    case 'paused':
      return "To'xtatildi";
    case 'queued':
      return 'Navbatda';
    default:
      return status;
  }
};

const getFileIcon = (file: File) => {
  if (file.type.startsWith('video/')) return <FileVideo className="h-5 w-5 text-primary" />;
  if (file.type.startsWith('image/')) return <FileImage className="h-5 w-5 text-accent" />;
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
};

export function UploadQueuePanel({
  queue,
  stats,
  isProcessing,
  isPaused,
  onStart,
  onPause,
  onResume,
  onRemove,
  onRetry,
  onClearCompleted,
  onClearAll,
}: UploadQueuePanelProps) {
  if (queue.length === 0) {
    return null;
  }

  const overallProgress =
    stats.total > 0
      ? Math.round(
          ((stats.completed + queue.reduce((acc, f) => acc + (f.status === 'uploading' ? f.progress / 100 : 0), 0)) /
            stats.total) *
            100
        )
      : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Yuklash navbati</CardTitle>
            <Badge variant="outline">
              {stats.completed}/{stats.total}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {stats.completed > 0 && (
              <Button variant="ghost" size="sm" onClick={onClearCompleted}>
                Tugaganlarni tozalash
              </Button>
            )}
            {!isProcessing && stats.queued > 0 && (
              <Button size="sm" onClick={onStart} className="gap-2">
                <Play className="h-4 w-4" />
                Boshlash
              </Button>
            )}
            {isProcessing && !isPaused && (
              <Button size="sm" variant="secondary" onClick={onPause} className="gap-2">
                <Pause className="h-4 w-4" />
                To'xtatish
              </Button>
            )}
            {isPaused && (
              <Button size="sm" onClick={onResume} className="gap-2">
                <Play className="h-4 w-4" />
                Davom ettirish
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClearAll} className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Progress value={overallProgress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="divide-y">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 ${
                  item.status === 'error' ? 'bg-destructive/5' : ''
                }`}
              >
                {getFileIcon(item.file)}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(item.status)}
                    <span className="text-xs text-muted-foreground">
                      {getStatusLabel(item.status)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(item.file.size)}
                    </span>
                    {item.status === 'uploading' && (
                      <span className="text-xs text-primary font-medium">{item.progress}%</span>
                    )}
                  </div>
                  {item.status === 'uploading' && (
                    <Progress value={item.progress} className="h-1 mt-1" />
                  )}
                  {item.error && (
                    <p className="text-xs text-destructive mt-1">{item.error}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {item.status === 'error' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onRetry(item.id)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {item.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(item.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
