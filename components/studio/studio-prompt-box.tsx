"use client";

import type { ChangeEvent, ReactNode } from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDown, Clapperboard, ImageIcon, Plus, SlidersHorizontal, X } from "lucide-react";

import { SelectContent, SelectItem } from "@/components/ui/select";
import type { MediaItem, MediaRole, ModelEntry, Surface } from "@/generation/catalog";
import type { AssetLibraryItem, AssetSelection } from "@/lib/studio/uploads";

import { AssetLibraryModal } from "./asset-library";
import { PromptBox, type PromptBoxSurface } from "./prompt-box";
import { SettingsDialog, settingLabel } from "./settings-dialog";

/**
 * StudioPromptBox — THE canonical Studio prompt dock, driven by the model
 * catalog so a new model file needs no dock changes:
 *
 *   1. MODE RAIL — Image / Video surface. Shown only when both have models.
 *   2. INLINE PILLS — "+" add media, the model picker, the model's headline
 *      enum setting (aspect ratio when it has one), and the sliders pill that
 *      opens every remaining setting. Hard-capped at MAX_INLINE_SETTINGS.
 *   3. UPLOAD TILES — one per media role the model accepts (start frame,
 *      reference…), capped at MAX_UPLOADS. Extra roles are reachable via "+".
 *
 * The lime Generate CTA flips to Cancel while a run is in flight.
 */

export const MAX_INLINE_SETTINGS = 1;
export const MAX_UPLOADS = 2;

const ROLE_LABEL: Record<MediaRole, string> = {
  start: "Start frame",
  end: "End frame",
  reference: "Reference",
  video: "Video",
  audio: "Audio",
};
const ROLE_ORDER: MediaRole[] = ["start", "end", "reference", "video", "audio"];
const ROLE_ACCEPT: Record<MediaRole, ("image" | "video")[]> = {
  start: ["image"],
  end: ["image"],
  reference: ["image", "video"],
  video: ["video"],
  audio: ["video"],
};

export interface StudioPromptBoxProps {
  surfaces: Surface[];
  surface: Surface;
  onSurfaceChange: (surface: Surface) => void;
  models: ModelEntry[];
  model: ModelEntry;
  onModelChange: (id: string) => void;
  settings: Record<string, unknown>;
  onSettingChange: (key: string, value: unknown) => void;
  media: MediaItem[];
  onMediaAdd: (role: MediaRole, selection: AssetSelection) => void;
  onMediaRemove: (id: string) => void;
  library: { items: AssetLibraryItem[]; onUpload: (file: File) => Promise<AssetSelection> };
  placeholder?: string;
  prompt: string;
  onPromptChange: (value: string) => void;
  cost?: ReactNode;
  onGenerate: () => void;
  onCancel: () => void;
  generating?: boolean;
  canceling?: boolean;
  generateDisabled?: boolean;
  error?: ReactNode;
  skin?: PromptBoxSurface;
  className?: string;
}

function modelIcon(model: ModelEntry): ReactNode {
  // eslint-disable-next-line @next/next/no-img-element
  return model.icon ? <img src={`/model-icons/${model.icon}.svg`} alt="" className="rounded-sm" /> : <Clapperboard />;
}

/** The enum setting that gets the inline pill: aspect ratio first, else the first enum. */
export function headlineSetting(model: ModelEntry): string | undefined {
  const enums = Object.entries(model.settings).filter(([, f]) => f.type === "enum");
  return (enums.find(([k]) => /aspect|ratio/.test(k)) ?? enums[0])?.[0];
}

export function roleTiles(model: ModelEntry): MediaRole[] {
  return ROLE_ORDER.filter((role) => (model.roles[role] ?? 0) > 0);
}

function PillSelect({ value, options, onValueChange, start, label }: {
  value: string;
  options: { value: string; label: string; icon?: ReactNode }[];
  onValueChange: (v: string) => void;
  start?: ReactNode;
  label: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <SelectPrimitive.Root value={value} onValueChange={(v) => v != null && onValueChange(String(v))}>
      <SelectPrimitive.Trigger aria-label={label} render={<PromptBox.Pill start={start ?? current?.icon} end={<ChevronDown />} />}>
        <SelectPrimitive.Value>{() => current?.label ?? value}</SelectPrimitive.Value>
      </SelectPrimitive.Trigger>
      <SelectContent align="start" sideOffset={8} alignItemWithTrigger={false} className="w-auto min-w-48">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <span className="inline-flex items-center gap-2 [&_img]:size-4 [&_svg]:size-4">
              {o.icon}
              {o.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive.Root>
  );
}

export function StudioPromptBox({
  surfaces,
  surface,
  onSurfaceChange,
  models,
  model,
  onModelChange,
  settings,
  onSettingChange,
  media,
  onMediaAdd,
  onMediaRemove,
  library,
  placeholder = "Describe the scene you imagine...",
  prompt,
  onPromptChange,
  cost,
  onGenerate,
  onCancel,
  generating = false,
  canceling = false,
  generateDisabled = false,
  error,
  skin,
  className = "w-[830px] max-w-full",
}: StudioPromptBoxProps) {
  const headline = headlineSetting(model);
  const headlineField = headline ? model.settings[headline] : undefined;
  const roles = roleTiles(model);
  const tiles = roles.slice(0, MAX_UPLOADS);
  const freeRole = roles.find((role) => media.filter((m) => m.role === role).length < (model.roles[role] ?? 0));
  const byRole = (role: MediaRole) => media.find((m) => m.role === role);

  return (
    <PromptBox.Root surface={skin} className={className}>
      <PromptBox.ModeRail hidden={surfaces.length < 2}>
        {surfaces.map((s) => (
          <PromptBox.Mode key={s} active={surface === s} onClick={() => onSurfaceChange(s)} start={s === "video" ? <Clapperboard /> : <ImageIcon />}>
            {s === "video" ? "Video" : "Image"}
          </PromptBox.Mode>
        ))}
      </PromptBox.ModeRail>

      <PromptBox.Body>
        <PromptBox.Field
          placeholder={placeholder}
          aria-label={placeholder}
          value={prompt}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !generating && !generateDisabled) {
              event.preventDefault();
              onGenerate();
            }
          }}
        />
        {error != null ? (
          <p className="px-1 pb-1 text-q-caption-sm-medium text-q-state-error-fg" role="alert">
            {error}
          </p>
        ) : null}
        <PromptBox.Actions>
          {freeRole ? (
            <AssetLibraryModal
              items={library.items}
              onUpload={library.onUpload}
              accept={ROLE_ACCEPT[freeRole]}
              onSelect={(selection) => onMediaAdd(freeRole, selection)}
              trigger={<PromptBox.Pill iconOnly aria-label={`Add ${ROLE_LABEL[freeRole].toLowerCase()}`} start={<Plus />} />}
            />
          ) : null}
          <PillSelect
            label="Model"
            value={model.id}
            onValueChange={onModelChange}
            options={models.map((m) => ({ value: m.id, label: m.label, icon: modelIcon(m) }))}
          />
          {headline && headlineField?.type === "enum" ? (
            <PillSelect
              label={settingLabel(headline)}
              value={typeof settings[headline] === "string" ? (settings[headline] as string) : headlineField.default}
              onValueChange={(v) => onSettingChange(headline, v)}
              options={headlineField.values.map((v) => ({ value: v, label: v }))}
            />
          ) : null}
          <SettingsDialog
            model={model}
            values={settings}
            onChange={onSettingChange}
            trigger={<PromptBox.Pill iconOnly aria-label="All settings" start={<SlidersHorizontal />} />}
          />
        </PromptBox.Actions>
      </PromptBox.Body>

      <PromptBox.Uploads hidden={tiles.length === 0}>
        {tiles.map((role) => {
          const item = byRole(role);
          return (
            <div key={role} className="relative size-20 shrink-0">
              <AssetLibraryModal
                items={library.items}
                onUpload={library.onUpload}
                accept={ROLE_ACCEPT[role]}
                onSelect={(selection) => {
                  if (item) onMediaRemove(item.id);
                  onMediaAdd(role, selection);
                }}
                trigger={
                  <PromptBox.Upload
                    label={ROLE_LABEL[role]}
                    src={item?.url}
                    mediaType={role === "video" || role === "audio" ? "video" : "image"}
                    alt={ROLE_LABEL[role]}
                  />
                }
              />
              {item ? (
                <button
                  type="button"
                  aria-label={`Remove ${ROLE_LABEL[role].toLowerCase()}`}
                  className="absolute right-1 top-1 z-10 flex size-5 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                  onClick={() => onMediaRemove(item.id)}
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>
          );
        })}
      </PromptBox.Uploads>

      <PromptBox.Generate
        cost={generating ? undefined : cost}
        onClick={generating ? onCancel : onGenerate}
        disabled={canceling || (!generating && generateDisabled)}
      >
        {canceling ? "Cancelling…" : generating ? "Cancel" : "Generate"}
      </PromptBox.Generate>
    </PromptBox.Root>
  );
}
