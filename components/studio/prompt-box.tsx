"use client";

import { Children, isValidElement } from "react";
import type { ComponentProps, ComponentPropsWithRef, ReactElement, ReactNode, Ref } from "react";
import { useRender } from "@base-ui/react/use-render";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * PromptBox — the Studio prompt dock primitives. A horizontal bar: a vertical
 * MODE rail, then one shared shell holding the prompt FIELD over a row of
 * setting PILLS, a strip of reference UPLOAD tiles, and the lime GENERATE CTA.
 *
 * Composition-first: this file owns the design (surfaces, pill/tile/mode
 * shells, the CTA); `StudioPromptBox` composes the parts with the studio's
 * content. Optional parts accept `hidden` and unmount so flex gaps collapse.
 *
 *   <PromptBox.Root>
 *     <PromptBox.ModeRail>
 *       <PromptBox.Mode active start={<Icon/>}>Video</PromptBox.Mode>
 *     </PromptBox.ModeRail>
 *     <PromptBox.Body>
 *       <PromptBox.Field placeholder="Describe the scene…" />
 *       <PromptBox.Actions>
 *         <PromptBox.Pill iconOnly start={<Plus/>} />
 *         <PromptBox.Pill end={<ChevronDown/>}>Seedance 2.5</PromptBox.Pill>
 *       </PromptBox.Actions>
 *     </PromptBox.Body>
 *     <PromptBox.Uploads><PromptBox.Upload label="Start frame" /></PromptBox.Uploads>
 *     <PromptBox.Generate cost="—" />
 *   </PromptBox.Root>
 *
 * A `Pill` is a bare `<button>` (or any element via `render`), so it drops
 * straight into a Base UI `Select.Trigger`/`Menu.Trigger`.
 */

export type PromptBoxSurface = "plain" | "glass";

const HOVER = "hover:bg-white/8 data-popup-open:bg-white/8";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-ring";
const DISABLED = "disabled:pointer-events-none disabled:opacity-40";

/* ── Root ─────────────────────────────────────────────────────────────────── */
export type PromptBoxRootProps = ComponentProps<"div"> & { surface?: PromptBoxSurface };

function Root({ surface = "plain", className, children: childrenProp, ...props }: PromptBoxRootProps) {
  const children = Children.toArray(childrenProp);
  const rail: ReactNode[] = [];
  const dock: ReactNode[] = [];
  for (const child of children) {
    if (isValidElement(child) && child.type === ModeRail) rail.push(child);
    else dock.push(child);
  }
  return (
    <div className={cn("relative flex items-end gap-2 p-3", className)} {...props}>
      {rail}
      {dock.length > 0 ? (
        <div
          className={cn(
            "flex min-w-0 flex-1 rounded-[20px] p-1",
            surface === "glass"
              ? "border border-white/10 bg-background/70 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
              : "bg-card shadow-[0_4px_2px_rgba(0,0,0,0.16),0_4px_6px_rgba(0,0,0,0.08)]",
          )}
        >
          <div className="flex min-w-0 flex-1 items-start gap-2 overflow-clip rounded-2xl bg-white/5 p-3">
            {dock}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ── Mode rail + Mode ─────────────────────────────────────────────────────── */
export type PromptBoxModeRailProps = ComponentProps<"div"> & { hidden?: boolean };

function ModeRail({ hidden = false, className, ...props }: PromptBoxModeRailProps) {
  if (hidden) return null;
  return (
    <div
      className={cn(
        "flex w-[70px] shrink-0 flex-col gap-1 rounded-[20px] bg-card p-1 shadow-[0_4px_4px_rgba(0,0,0,0.16),0_4px_12px_rgba(0,0,0,0.08)]",
        className,
      )}
      {...props}
    />
  );
}

export type PromptBoxModeProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  active?: boolean;
  hidden?: boolean;
  start?: ReactNode;
  children?: ReactNode;
  render?: ReactElement;
};

function Mode({ active = false, hidden = false, start, children, render, className, ref, ...props }: PromptBoxModeProps) {
  const element = useRender({
    render,
    defaultTagName: "button",
    ref: ref as Ref<Element> | undefined,
    props: {
      className: cn(
        "flex h-[50px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 text-muted-foreground transition-colors",
        HOVER,
        FOCUS,
        DISABLED,
        active && "rounded-2xl bg-white/5 text-foreground",
        className,
      ),
      ...(render == null ? { type: "button" as const } : {}),
      ...(active ? { "aria-pressed": true } : {}),
      children: (
        <>
          {start != null ? <span className="inline-flex items-center justify-center [&_svg]:size-5">{start}</span> : null}
          {children != null ? <span className="text-[11px] font-semibold leading-none">{children}</span> : null}
        </>
      ),
      ...props,
    },
  });
  return hidden ? null : element;
}

/* ── Body / Field / Actions ───────────────────────────────────────────────── */
function Body({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("flex min-w-0 flex-1", className)} {...props}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
    </div>
  );
}

export type PromptBoxFieldProps = Omit<ComponentProps<"textarea">, "children">;

function Field({ className, rows = 1, ...props }: PromptBoxFieldProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "min-h-[52px] w-full flex-1 resize-none overflow-hidden bg-transparent p-1 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function Actions({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex w-full flex-none items-center gap-1", className)} {...props} />;
}

/* ── Pill ─────────────────────────────────────────────────────────────────── */
export type PromptBoxPillProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  start?: ReactNode;
  end?: ReactNode;
  children?: ReactNode;
  iconOnly?: boolean;
  hidden?: boolean;
  render?: ReactElement;
};

function Pill({ start, end, children, iconOnly = false, hidden = false, render, className, ref, ...props }: PromptBoxPillProps) {
  const element = useRender({
    render,
    defaultTagName: "button",
    ref: ref as Ref<Element> | undefined,
    props: {
      className: cn(
        "inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg bg-white/5 px-2 text-xs font-medium text-foreground transition-colors",
        HOVER,
        FOCUS,
        DISABLED,
        iconOnly && "w-7 px-0",
        className,
      ),
      ...(render == null ? { type: "button" as const } : {}),
      children: (
        <>
          {start != null ? <span className="inline-flex shrink-0 items-center [&_img]:size-4 [&_svg]:size-4">{start}</span> : null}
          {children != null ? <span className="whitespace-nowrap">{children}</span> : null}
          {end != null ? <span className="inline-flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">{end}</span> : null}
        </>
      ),
      ...props,
    },
  });
  return hidden ? null : element;
}

/* ── Uploads / Upload ─────────────────────────────────────────────────────── */
export type PromptBoxUploadsProps = ComponentProps<"div"> & { hidden?: boolean };

function Uploads({ hidden = false, className, ...props }: PromptBoxUploadsProps) {
  if (hidden) return null;
  return <div className={cn("flex shrink-0 items-start gap-1.5", className)} {...props} />;
}

export type PromptBoxUploadProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  label?: ReactNode;
  src?: string;
  mediaType?: "image" | "video";
  alt?: string;
  hidden?: boolean;
  add?: ReactNode;
  children?: ReactNode;
  render?: ReactElement;
};

function Upload({ label, src, mediaType = "image", alt = "", hidden = false, add, children, render, className, ref, ...props }: PromptBoxUploadProps) {
  const element = useRender({
    render,
    defaultTagName: "button",
    ref: ref as Ref<Element> | undefined,
    props: {
      className: cn(
        "relative flex size-20 shrink-0 cursor-pointer flex-col justify-between overflow-clip rounded-xl border border-white/10 bg-white/5 p-1.5 transition-colors",
        HOVER,
        FOCUS,
        src != null && "after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/60 after:to-transparent after:to-60%",
        className,
      ),
      ...(render == null ? { type: "button" as const } : {}),
      children: (
        <>
          {src != null ? (
            mediaType === "video" ? (
              <video className="absolute inset-0 size-full object-cover" src={src} aria-label={alt} muted playsInline preload="metadata" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="absolute inset-0 size-full object-cover" src={src} alt={alt} />
            )
          ) : null}
          <span className="relative z-[1] inline-flex size-5 items-center justify-center rounded-full bg-white/5 text-foreground shadow-[0_2px_1.5px_-0.5px_rgba(0,0,0,0.16)] backdrop-blur-[2.5px] [&_svg]:size-4">
            {add ?? (
              <svg viewBox="0 0 16 16" fill="none" aria-hidden width="16" height="16">
                <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </span>
          {label != null ? (
            <span className="relative z-[1] self-start text-left text-[10px] font-bold uppercase leading-4 tracking-wide text-foreground">
              {label}
            </span>
          ) : null}
          {children}
        </>
      ),
      ...props,
    },
  });
  return hidden ? null : element;
}

/* ── Generate ─────────────────────────────────────────────────────────────── */
export type PromptBoxGenerateProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  cost?: ReactNode;
  oldCost?: ReactNode;
  start?: ReactNode;
  children?: ReactNode;
  render?: ReactElement;
};

function Generate({ cost, oldCost, start, children = "Generate", render, className, ref, ...props }: PromptBoxGenerateProps) {
  const hasMeta = cost != null || oldCost != null || start != null;
  return useRender({
    render,
    defaultTagName: "button",
    ref: ref as Ref<Element> | undefined,
    props: {
      className: cn(
        "studio-generate relative flex w-28 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 self-stretch overflow-clip rounded-xl px-5 pb-6 pt-5 text-black transition-[filter,transform] duration-150 hover:brightness-[1.04] active:scale-[0.98] motion-reduce:active:scale-100",
        FOCUS,
        DISABLED,
        className,
      ),
      ...(render == null ? { type: "button" as const } : {}),
      children: (
        <>
          <span className="text-center text-sm font-bold uppercase leading-none">{children}</span>
          {hasMeta ? (
            <span className="inline-flex items-center gap-1 text-black [&_svg]:size-4">
              {start ?? <Sparkles fill="currentColor" />}
              {oldCost != null ? <span className="text-xs font-medium text-black/30 line-through">{oldCost}</span> : null}
              {cost != null ? <span className="text-xs font-semibold">{cost}</span> : null}
            </span>
          ) : null}
        </>
      ),
      ...props,
    },
  });
}

export const PromptBox = { Root, ModeRail, Mode, Body, Field, Actions, Pill, Uploads, Upload, Generate };
