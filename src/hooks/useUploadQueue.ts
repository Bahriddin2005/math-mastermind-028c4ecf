import { useState, useCallback, useRef } from 'react';
import { uploadResumableToPublicBucket } from '@/lib/resumableUpload';
import { supabase } from '@/integrations/supabase/client';

export type UploadStatus = 'queued' | 'uploading' | 'paused' | 'completed' | 'error';

export interface QueuedFile {
  id: string;
  file: File;
  objectName: string;
  bucket: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  publicUrl?: string;
}

interface UseUploadQueueOptions {
  onFileComplete?: (file: QueuedFile) => void;
  onAllComplete?: () => void;
}

export function useUploadQueue(options: UseUploadQueueOptions = {}) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentFileIdRef = useRef<string | null>(null);

  const addToQueue = useCallback((files: Array<{
    file: File;
    objectName: string;
    bucket: string;
  }>) => {
    const newItems: QueuedFile[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file: f.file,
      objectName: f.objectName,
      bucket: f.bucket,
      status: 'queued' as UploadStatus,
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    return newItems.map((i) => i.id);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((f) => f.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    if (currentFileIdRef.current) {
      abortControllerRef.current?.abort();
    }
    setQueue([]);
    setIsProcessing(false);
    setIsPaused(false);
  }, []);

  const updateFile = useCallback((id: string, updates: Partial<QueuedFile>) => {
    setQueue((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const processNext = useCallback(async () => {
    if (isPaused) return;

    const nextFile = queue.find((f) => f.status === 'queued');
    if (!nextFile) {
      setIsProcessing(false);
      options.onAllComplete?.();
      return;
    }

    setIsProcessing(true);
    currentFileIdRef.current = nextFile.id;
    abortControllerRef.current = new AbortController();

    updateFile(nextFile.id, { status: 'uploading', progress: 0 });

    try {
      const isLarge = nextFile.file.size > 50 * 1024 * 1024;

      let publicUrl: string;

      if (isLarge) {
        publicUrl = await uploadResumableToPublicBucket({
          bucket: nextFile.bucket,
          objectName: nextFile.objectName,
          file: nextFile.file,
          onProgress: (pct) => updateFile(nextFile.id, { progress: pct }),
        });
      } else {
        const { error } = await supabase.storage
          .from(nextFile.bucket)
          .upload(nextFile.objectName, nextFile.file);

        if (error) throw error;

        const { data } = supabase.storage
          .from(nextFile.bucket)
          .getPublicUrl(nextFile.objectName);

        publicUrl = data.publicUrl;
      }

      updateFile(nextFile.id, {
        status: 'completed',
        progress: 100,
        publicUrl,
      });

      options.onFileComplete?.({
        ...nextFile,
        status: 'completed',
        progress: 100,
        publicUrl,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        updateFile(nextFile.id, { status: 'paused' });
      } else {
        updateFile(nextFile.id, {
          status: 'error',
          error: err?.message || 'Upload xatolik',
        });
      }
    } finally {
      currentFileIdRef.current = null;
      abortControllerRef.current = null;
    }

    // Process next file
    setTimeout(() => processNext(), 100);
  }, [queue, isPaused, updateFile, options]);

  const startQueue = useCallback(() => {
    if (isProcessing) return;
    setIsPaused(false);
    processNext();
  }, [isProcessing, processNext]);

  const pauseQueue = useCallback(() => {
    setIsPaused(true);
    if (currentFileIdRef.current) {
      abortControllerRef.current?.abort();
      updateFile(currentFileIdRef.current, { status: 'paused' });
    }
  }, [updateFile]);

  const resumeQueue = useCallback(() => {
    setIsPaused(false);
    // Resume paused files
    setQueue((prev) =>
      prev.map((f) => (f.status === 'paused' ? { ...f, status: 'queued' } : f))
    );
    setTimeout(() => processNext(), 100);
  }, [processNext]);

  const retryFile = useCallback((id: string) => {
    updateFile(id, { status: 'queued', progress: 0, error: undefined });
    if (!isProcessing) {
      processNext();
    }
  }, [updateFile, isProcessing, processNext]);

  const stats = {
    total: queue.length,
    queued: queue.filter((f) => f.status === 'queued').length,
    uploading: queue.filter((f) => f.status === 'uploading').length,
    completed: queue.filter((f) => f.status === 'completed').length,
    error: queue.filter((f) => f.status === 'error').length,
    paused: queue.filter((f) => f.status === 'paused').length,
  };

  return {
    queue,
    stats,
    isProcessing,
    isPaused,
    addToQueue,
    removeFromQueue,
    clearCompleted,
    clearAll,
    startQueue,
    pauseQueue,
    resumeQueue,
    retryFile,
  };
}
