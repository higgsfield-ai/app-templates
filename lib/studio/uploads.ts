import { create } from "zustand";
import { persist } from "zustand/middleware";

import { browserStorage } from "@/generation/stores/browser-storage";
import { uploadMedia } from "@/generation/upload";

export type AssetKind = "image" | "video";

/** A durable, submit-ready media reference: `src` is a public URL the platform can fetch. */
export interface AssetSelection {
  id: string;
  src: string;
  kind: AssetKind;
  name?: string;
}

export interface AssetLibraryItem extends AssetSelection {
  source: "upload" | "generation";
  createdAt: number;
}

type UploadsState = {
  items: AssetLibraryItem[];
  add: (item: AssetLibraryItem) => void;
  remove: (id: string) => void;
};

/** Uploads live in Vercel Blob; this remembers what this browser uploaded. */
export const useUploads = create<UploadsState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) => set((s) => ({ items: [item, ...s.items.filter((i) => i.id !== item.id)].slice(0, 200) })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
    }),
    { name: "hf.uploads.v1", storage: browserStorage() },
  ),
);

export function kindOf(file: File): AssetKind {
  return file.type.startsWith("video/") ? "video" : "image";
}

/** Uploads through /api/blob and records the result in the library. */
export async function uploadAsset(file: File): Promise<AssetLibraryItem> {
  const { url } = await uploadMedia(file);
  const item: AssetLibraryItem = {
    id: url,
    src: url,
    kind: kindOf(file),
    name: file.name,
    source: "upload",
    createdAt: Date.now(),
  };
  useUploads.getState().add(item);
  return item;
}
