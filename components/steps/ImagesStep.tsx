"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useCMAStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, Trash2 } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function ImagesStep() {
  const images = useCMAStore((s) => s.formData.images);
  const reportId = useCMAStore((s) => s.reportId);
  const addImage = useCMAStore((s) => s.addImage);
  const removeImage = useCMAStore((s) => s.removeImage);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      for (const file of accepted) {
        if (file.size > 2 * 1024 * 1024) continue;
        const id = `img-${crypto.randomUUID()}`;
        const supabase = createClient();
        if (supabase && reportId && isSupabaseConfigured()) {
          const path = `${reportId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
          const { error } = await supabase.storage.from("report-images").upload(path, file, {
            upsert: false,
          });
          if (!error) {
            addImage({ id, storagePath: path, filename: file.name });
            continue;
          }
        }
        const previewUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        addImage({ id, filename: file.name, previewUrl });
      }
    },
    [addImage, reportId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    maxSize: 2 * 1024 * 1024,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Add images</CardTitle>
            <CardDescription>JPG or PNG only. Max 2 MB per file.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-accent bg-accent/10" : "border-card-border bg-slate-50"}
          `}
        >
          <input {...getInputProps()} />
          <p className="text-foreground">Drag &amp; drop files here, or click to browse</p>
          <p className="text-xs text-muted-foreground mt-2">
            {!isSupabaseConfigured() || !reportId
              ? "Images are stored locally until you open a cloud report with Storage configured."
              : "Uploads go to Supabase Storage bucket report-images."}
          </p>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.id} className="relative rounded-lg border border-card-border overflow-hidden bg-white">
                {img.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.previewUrl}
                    alt={img.filename}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="h-28 flex items-center justify-center bg-slate-50 text-muted-foreground text-xs px-2 text-center">
                    {img.storagePath ? "Cloud file" : "No preview"}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground px-2 py-1 truncate">{img.filename}</p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 h-8 w-8 text-red-400"
                  onClick={() => removeImage(img.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
