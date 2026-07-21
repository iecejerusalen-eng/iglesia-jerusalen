/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-blue-700 text-white shadow-md hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700",
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700",
        "destructive-outline":
          "border border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/15 border-dashed",
        outline:
          "border border-slate-300 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 backdrop-blur-xs hover:bg-slate-100/80 dark:hover:bg-slate-800/80 shadow-xs",
        secondary:
          "bg-slate-200/90 text-slate-900 hover:bg-slate-300/90 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-700/90 backdrop-blur-xs shadow-xs",
        ghost:
          "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60",
        link:
          "text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline p-0 h-auto font-normal",
        // Pure Glassmorphism variants with Specular Highlights
        glass:
          "bg-white/15 dark:bg-slate-900/40 text-slate-900 dark:text-white border border-white/40 dark:border-white/15 shadow-xl backdrop-blur-md hover:bg-white/25 dark:hover:bg-slate-900/60 hover:border-white/60 dark:hover:border-white/30 transition-all",
        "glass-primary":
          "bg-blue-950/60 text-blue-100 border border-blue-400/30 shadow-xl backdrop-blur-md hover:bg-blue-900/80 hover:border-blue-400/60 hover:shadow-blue-900/30",
        "glass-gold":
          "bg-amber-950/40 text-amber-200 border border-amber-400/40 shadow-xl backdrop-blur-md hover:bg-amber-900/60 hover:border-amber-400/70 hover:shadow-amber-900/30",
        "glass-emerald":
          "bg-emerald-950/40 text-emerald-200 border border-emerald-400/40 shadow-xl backdrop-blur-md hover:bg-emerald-900/60 hover:border-emerald-400/70 hover:shadow-emerald-900/30",
        "glass-rose":
          "bg-rose-950/40 text-rose-200 border border-rose-400/40 shadow-xl backdrop-blur-md hover:bg-rose-900/60 hover:border-rose-400/70 hover:shadow-rose-900/30",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
        sm: "h-8 px-3 text-xs rounded-xl gap-1.5",
        default: "h-10 px-4 py-2 text-sm rounded-xl gap-2",
        lg: "h-11 px-6 text-base rounded-2xl gap-2.5",
        xl: "h-12 px-8 text-lg rounded-2xl gap-3",
        "icon-xs": "h-7 w-7 p-0 rounded-lg justify-center",
        "icon-sm": "h-8 w-8 p-0 rounded-xl justify-center",
        icon: "h-10 w-10 p-0 rounded-xl justify-center",
        "icon-lg": "h-11 w-11 p-0 rounded-2xl justify-center",
        "icon-xl": "h-12 w-12 p-0 rounded-2xl justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  render?: React.ReactElement;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      render,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isCompSlot = asChild || Boolean(render);
    const Comp = isCompSlot ? Slot : "button";

    const slotProps =
      render && React.isValidElement(render)
        ? { children: (render.props as { children?: React.ReactNode }).children }
        : {};

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-disabled={disabled || loading || undefined}
        data-loading={loading ? "true" : undefined}
        {...slotProps}
        {...props}
      >
        {loading && (
          <span
            data-slot="button-loading-indicator"
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <Loader2 className="w-4 h-4 animate-spin text-current" />
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center justify-center gap-[inherit] w-full",
            loading && "opacity-0 invisible"
          )}
        >
          {children}
        </span>
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
