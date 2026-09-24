"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { ModelEntry, SettingField } from "@/generation/catalog/types";
import { cn } from "@/lib/utils";

/** Every setting the active model declares, rendered from the catalog. */
export interface SettingsDialogProps {
  trigger: ReactElement;
  model: ModelEntry;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function SettingsDialog({ trigger, model, values, onChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(model.settings);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{model.label} settings</DialogTitle>
          <DialogDescription>Applied to the next generation.</DialogDescription>
        </DialogHeader>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">This model has no settings.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map(([key, field]) => (
              <SettingRow key={key} name={key} field={field} value={values[key]} onChange={(v) => onChange(key, v)} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function settingLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function SettingRow({ name, field, value, onChange }: { name: string; field: SettingField; value: unknown; onChange: (v: unknown) => void }) {
  const label = settingLabel(name);
  if (field.type === "enum") {
    const current = typeof value === "string" ? value : field.default;
    return (
      <label className="flex items-center justify-between gap-4 text-sm">
        <span>{label}</span>
        <Select value={current} onValueChange={(v) => onChange(v)}>
          <SelectTrigger size="sm" className="min-w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {field.values.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    );
  }
  if (field.type === "range") {
    const current = typeof value === "number" ? value : field.default;
    return (
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span>{label}</span>
          <span className="tabular-nums text-muted-foreground">{current}</span>
        </div>
        <Slider min={field.min} max={field.max} step={field.step ?? 1} value={[current]} onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)} />
      </div>
    );
  }
  const current = typeof value === "boolean" ? value : field.default;
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={current}
        onClick={() => onChange(!current)}
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          current ? "bg-primary" : "bg-white/15",
        )}
      >
        <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-background transition-transform", current ? "translate-x-4" : "translate-x-0")} />
      </button>
    </div>
  );
}
