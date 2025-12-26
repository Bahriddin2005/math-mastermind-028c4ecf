import { Upload } from "tus-js-client";
import { supabase } from "@/integrations/supabase/client";

type ResumableUploadOptions = {
  bucket: string;
  objectName: string;
  file: File;
  onProgress?: (percent: number) => void;
  upsert?: boolean;
};

function sanitizeStorageObjectName(objectName: string): string {
  // Preserve folders but sanitize each segment so Storage accepts the key.
  return objectName
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      const extMatch = segment.match(/(\.[a-zA-Z0-9]{1,10})$/);
      const ext = extMatch?.[1] ?? "";
      const base = ext ? segment.slice(0, -ext.length) : segment;

      const safeBase =
        base
          .normalize("NFKD")
          .replace(/[^a-zA-Z0-9._-]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^[-_.]+|[-_.]+$/g, "") || "file";

      const safeExt = ext
        .normalize("NFKD")
        .replace(/[^a-zA-Z0-9.]+/g, "")
        .toLowerCase();

      return `${safeBase}${safeExt}`;
    })
    .join("/");
}

export async function uploadResumableToPublicBucket({
  bucket,
  objectName,
  file,
  onProgress,
  upsert = true,
}: ResumableUploadOptions): Promise<string> {
  const safeObjectName = sanitizeStorageObjectName(objectName);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error("Avval tizimga kiring");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!supabaseUrl || !apikey) throw new Error("Backend sozlamalari topilmadi");

  const directStorageHost = supabaseUrl.replace(".supabase.co", ".storage.supabase.co");
  const endpoint = `${directStorageHost}/storage/v1/upload/resumable`;

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey,
        "x-upsert": upsert ? "true" : "false",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: safeObjectName,
        contentType: file.type,
        cacheControl: "3600",
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (error) => reject(error),
      onProgress: (bytesUploaded, bytesTotal) => {
        const pct = Math.round((bytesUploaded / bytesTotal) * 100);
        onProgress?.(pct);
      },
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((previous) => {
      if (previous.length > 0) {
        upload.resumeFromPreviousUpload(previous[0]!);
      }
      upload.start();
    });
  });

  const { data } = supabase.storage.from(bucket).getPublicUrl(safeObjectName);
  return data.publicUrl;
}
