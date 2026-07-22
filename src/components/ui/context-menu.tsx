/**
 * ContextMenu — Built on @base-ui-components/react
 *
 * Usage:
 *   import {
 *     ContextMenu, ContextMenuTrigger, ContextMenuPopup,
 *     ContextMenuGroup, ContextMenuGroupLabel, ContextMenuItem,
 *     ContextMenuLinkItem, ContextMenuCheckboxItem, ContextMenuRadioGroup,
 *     ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut,
 *     ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubPopup,
 *   } from "@/components/ui/context-menu";
 *
 * Quick example:
 *   <ContextMenu>
 *     <ContextMenuTrigger className="border border-dashed p-8 rounded-lg">
 *       Right-click here
 *     </ContextMenuTrigger>
 *     <ContextMenuPopup>
 *       <ContextMenuItem>Copy</ContextMenuItem>
 *       <ContextMenuItem>Paste</ContextMenuItem>
 *       <ContextMenuSeparator />
 *       <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
 *     </ContextMenuPopup>
 *   </ContextMenu>
 */

import * as React from "react";
import { ContextMenu as CM } from "@base-ui-components/react/context-menu";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, Circle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
const ContextMenu = CM.Root;

// ─────────────────────────────────────────────────────────────────────────────
// Trigger
// ─────────────────────────────────────────────────────────────────────────────
function ContextMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CM.Trigger>) {
  return (
    <CM.Trigger
      className={cn("select-none outline-none", className)}
      {...props}
    >
      {children}
    </CM.Trigger>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Popup (Portal + Positioner + Popup box)
// ─────────────────────────────────────────────────────────────────────────────
interface ContextMenuPopupProps
  extends React.ComponentPropsWithoutRef<typeof CM.Popup> {
  portalProps?: React.ComponentPropsWithoutRef<typeof CM.Portal>;
}

function ContextMenuPopup({
  className,
  children,
  portalProps,
  ...props
}: ContextMenuPopupProps) {
  return (
    <CM.Portal {...portalProps}>
      <CM.Positioner sideOffset={4} className="z-[99999]">
        <CM.Popup
          className={cn(
            // Shape & background — Solid background with z-[99999] to stay above all elements
            "z-[99999] min-w-[210px] overflow-hidden rounded-2xl border",
            "border-slate-200/90 dark:border-slate-800/90",
            "bg-white dark:bg-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] backdrop-blur-2xl",
            // Enter / exit animations (Base UI data attrs)
            "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "p-2",
            className
          )}
          {...props}
        >
          {children}
        </CM.Popup>
      </CM.Positioner>
    </CM.Portal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Group
// ─────────────────────────────────────────────────────────────────────────────
const ContextMenuGroup = CM.Group;

// ─────────────────────────────────────────────────────────────────────────────
// Group Label
// ─────────────────────────────────────────────────────────────────────────────
interface ContextMenuGroupLabelProps
  extends React.ComponentPropsWithoutRef<typeof CM.GroupLabel> {
  inset?: boolean;
}

function ContextMenuGroupLabel({
  className,
  inset,
  children,
  ...props
}: ContextMenuGroupLabelProps) {
  return (
    <CM.GroupLabel
      className={cn(
        "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 select-none",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
    </CM.GroupLabel>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Item
// ─────────────────────────────────────────────────────────────────────────────
interface ContextMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof CM.Item> {
  inset?: boolean;
  variant?: "default" | "destructive";
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  children,
  ...props
}: ContextMenuItemProps) {
  return (
    <CM.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors duration-100",
        "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        variant === "default"
          ? "text-slate-800 dark:text-slate-200"
          : "text-red-600 dark:text-red-400 data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-900/20",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
    </CM.Item>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Link Item
// ─────────────────────────────────────────────────────────────────────────────
interface ContextMenuLinkItemProps
  extends React.ComponentPropsWithoutRef<typeof CM.Item> {
  inset?: boolean;
  variant?: "default" | "destructive";
  href?: string;
  closeOnClick?: boolean;
}

function ContextMenuLinkItem({
  className,
  inset,
  variant = "default",
  href,
  render,
  closeOnClick = true,
  children,
  ...props
}: ContextMenuLinkItemProps & { render?: React.ReactElement }) {
  const resolvedRender = render ?? (href ? <a href={href} /> : undefined);

  return (
    <CM.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors duration-100",
        "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        variant === "default"
          ? "text-slate-800 dark:text-slate-200"
          : "text-red-600 dark:text-red-400 data-[highlighted]:bg-red-50 dark:data-[highlighted]:bg-red-900/20",
        inset && "pl-8",
        className
      )}
      render={resolvedRender}
      closeOnClick={closeOnClick}
      {...props}
    >
      {children}
    </CM.Item>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox Item
// ─────────────────────────────────────────────────────────────────────────────
interface ContextMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof CM.CheckboxItem> {
  variant?: "default" | "switch";
}

function ContextMenuCheckboxItem({
  className,
  children,
  variant = "default",
  ...props
}: ContextMenuCheckboxItemProps) {
  return (
    <CM.CheckboxItem
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 pl-8 text-sm font-medium outline-none transition-colors duration-100",
        "text-slate-800 dark:text-slate-200",
        "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <CM.CheckboxItemIndicator>
          {variant === "switch" ? (
            <span className="flex h-3 w-5 items-center rounded-full bg-blue-600 px-0.5">
              <span className="ml-auto h-2 w-2 rounded-full bg-white" />
            </span>
          ) : (
            <Check
              className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
              strokeWidth={2.5}
            />
          )}
        </CM.CheckboxItemIndicator>
      </span>
      {children}
    </CM.CheckboxItem>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Radio Group
// ─────────────────────────────────────────────────────────────────────────────
const ContextMenuRadioGroup = CM.RadioGroup;

// ─────────────────────────────────────────────────────────────────────────────
// Radio Item
// ─────────────────────────────────────────────────────────────────────────────
function ContextMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CM.RadioItem>) {
  return (
    <CM.RadioItem
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 pl-8 text-sm font-medium outline-none transition-colors duration-100",
        "text-slate-800 dark:text-slate-200",
        "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex h-3.5 w-3.5 items-center justify-center">
        <CM.RadioItemIndicator>
          <Circle className="h-2 w-2 fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
        </CM.RadioItemIndicator>
      </span>
      {children}
    </CM.RadioItem>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Separator
// ─────────────────────────────────────────────────────────────────────────────
function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CM.Separator>) {
  return (
    <CM.Separator
      className={cn("my-1 h-px bg-slate-200 dark:bg-slate-800", className)}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shortcut (purely decorative — not a Base UI wrapper)
// ─────────────────────────────────────────────────────────────────────────────
function ContextMenuShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto pl-4 text-xs tracking-widest text-slate-400 dark:text-slate-500",
        className
      )}
      {...props}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub (Nested Menu)
// ─────────────────────────────────────────────────────────────────────────────
const ContextMenuSub = CM.SubmenuRoot;

// ─────────────────────────────────────────────────────────────────────────────
// SubTrigger
// ─────────────────────────────────────────────────────────────────────────────
interface ContextMenuSubTriggerProps
  extends React.ComponentPropsWithoutRef<typeof CM.SubmenuTrigger> {
  inset?: boolean;
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuSubTriggerProps) {
  return (
    <CM.SubmenuTrigger
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors duration-100",
        "text-slate-800 dark:text-slate-200",
        "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        inset && "pl-8",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4 text-slate-400 dark:text-slate-500" />
    </CM.SubmenuTrigger>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SubPopup
// ─────────────────────────────────────────────────────────────────────────────
interface ContextMenuSubPopupProps
  extends React.ComponentPropsWithoutRef<typeof CM.Popup> {
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

function ContextMenuSubPopup({
  className,
  children,
  align = "start",
  sideOffset = 0,
  alignOffset,
  ...props
}: ContextMenuSubPopupProps) {
  return (
    <CM.Portal>
      <CM.Positioner
        side="right"
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset ?? (align !== "center" ? -5 : 0)}
      >
        <CM.Popup
          className={cn(
            "z-50 min-w-[160px] overflow-hidden rounded-xl",
            "border border-slate-200/80 dark:border-slate-800",
            "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
            "shadow-[0_12px_40px_-8px_rgba(0,0,0,0.22),0_4px_16px_-4px_rgba(0,0,0,0.14)]",
            "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            "p-1.5",
            className
          )}
          {...props}
        >
          {children}
        </CM.Popup>
      </CM.Positioner>
    </CM.Portal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPopup,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuLinkItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubPopup,
};
