"use client";

import { useMemo, useRef, useState } from "react";
import type { DragEvent, ReactElement } from "react";
import { ImageIcon, Loader2, Play, Plus, Upload } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssetKind, AssetLibraryItem, AssetSelection } from "@/lib/studio/uploads";
import { cn } from "@/lib/utils";

/**
 * AssetLibraryModal — the single picker for reference media. Tabs over the
 * user's uploads and their own generations; a drop zone uploads new files.
 * Selecting an item returns a durable `AssetSelection` (a public URL) that
 * generation code submits as a media role. Preview URLs never reach the API.
 */

type Tab = "uploads" | "image" | "video";

const TABS: { value: Tab; label: string }[] = [
  { value: "uploads", label: "Uploads" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
];

export interface AssetLibraryModalProps {
  trigger: ReactElement;
  items: AssetLibraryItem[];
  onUpload: (file: File) => Promise<AssetSelection>;
  onSelect: (selection: AssetSelection) => void;
  /** Restrict what can be picked (e.g. a start frame is image-only). */
  accept?: AssetKind[];
  defaultOpen?: boolean;
}

export function AssetLibraryModal({ trigger, items, onUpload, onSelect, accept, defaultOpen }: AssetLibraryModalProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [tab, setTab] = useState<Tab>("uploads");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (accept && !accept.includes(item.kind)) return false;
        if (tab === "uploads") return item.source === "upload";
        return item.source === "generation" && item.kind === tab;
      }),
    [accept, items, tab],
  );

  const pick = (selection: AssetSelection) => {
    onSelect(selection);
    setOpen(false);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const kind: AssetKind = file.type.startsWith("video/") ? "video" : "image";
    if (accept && !accept.includes(kind)) {
      setError(`Only ${accept.join(" or ")} files can be used here.`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      pick(await onUpload(file));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    void upload(event.dataTransfer.files[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="flex h-[min(640px,85vh)] flex-col gap-3 p-3 sm:max-w-3xl">
        <DialogTitle className="sr-only">Asset library</DialogTitle>
        <DialogDescription className="sr-only">Pick a reference from your uploads or generations.</DialogDescription>
        <div className="flex items-center justify-between gap-3 pr-10">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              {TABS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {error ? <p className="truncate text-xs text-destructive">{error}</p> : null}
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 text-xs text-muted-foreground transition-colors hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                dragging && "border-primary bg-primary/10 text-foreground",
              )}
            >
              {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
              {uploading ? "Uploading…" : "Upload or drop"}
            </button>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={accept?.map((k) => `${k}/*`).join(",") ?? "image/*,video/*"}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => pick(item)}
                aria-label={`Use ${item.name ?? item.kind}`}
                className="group relative aspect-square overflow-hidden rounded-xl bg-card focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.kind === "video" ? (
                  <video src={item.src} muted playsInline preload="metadata" className="size-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.src} alt={item.name ?? ""} className="size-full object-cover" loading="lazy" />
                )}
                {item.kind === "video" ? (
                  <span className="absolute left-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-black/60 text-white">
                    <Play className="size-3" fill="currentColor" />
                  </span>
                ) : null}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Plus className="size-6 text-white" />
                </span>
              </button>
            ))}
          </div>
          {visible.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <ImageIcon className="size-5" />
              {tab === "uploads" ? "Nothing uploaded yet." : `No generated ${tab}s yet.`}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
