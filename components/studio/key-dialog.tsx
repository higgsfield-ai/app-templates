"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { clearPlatformCredentials, savePlatformCredentials } from "@/generation/actions";

/**
 * Platform key dialog. The key is stored in an httpOnly cookie by a server
 * action and never reaches client code; the studio only learns whether one is set.
 */
export function KeyDialog({ open, onOpenChange, configured, onChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configured: boolean;
  onChange: (configured: boolean) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await savePlatformCredentials({ api_key: apiKey });
      setApiKey("");
      onChange(true);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the key");
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      await clearPlatformCredentials();
      onChange(false);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-4" /> Higgsfield platform key
            </DialogTitle>
            <DialogDescription>
              Paste your key as <code>id:secret</code>. Get one at{" "}
              <a href="https://cloud.higgsfield.ai" target="_blank" rel="noreferrer" className="underline">
                cloud.higgsfield.ai
              </a>
              . It is kept in a server-side cookie on this device.
            </DialogDescription>
          </DialogHeader>
          <Input autoFocus value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="id:secret" aria-label="Platform key" autoComplete="off" spellCheck={false} />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <DialogFooter className="sm:justify-between">
            {configured ? (
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void clear()}>
                Remove key
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={busy || !apiKey.includes(":")}>
              {configured ? "Replace key" : "Save key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
