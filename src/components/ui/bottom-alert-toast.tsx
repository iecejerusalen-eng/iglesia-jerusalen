"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertType = "info" | "success" | "warning" | "error";

export interface BottomAlertToastProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  type?: AlertType;
  actionText?: string;
  onAction?: () => void;
  autoHideDuration?: number;
}

const typeStyles: Record<AlertType, { bg: string; border: string; icon: React.ReactNode }> = {
  info: {
    bg: "bg-slate-900/95 text-white border-slate-800 dark:bg-slate-900/95 dark:border-slate-700",
    border: "border-slate-800",
    icon: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  },
  success: {
    bg: "bg-emerald-950/95 text-emerald-100 border-emerald-800/80 dark:border-emerald-800",
    border: "border-emerald-800/60",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
  },
  warning: {
    bg: "bg-amber-950/95 text-amber-100 border-amber-800/80 dark:border-amber-800",
    border: "border-amber-800/60",
    icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
  },
  error: {
    bg: "bg-rose-950/95 text-rose-100 border-rose-800/80 dark:border-rose-800",
    border: "border-rose-800/60",
    icon: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
  },
};

export const BottomAlertToast: React.FC<BottomAlertToastProps> = ({
  isOpen,
  onClose,
  title,
  description,
  type = "info",
  actionText,
  onAction,
  autoHideDuration,
}) => {
  useEffect(() => {
    if (isOpen && autoHideDuration) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoHideDuration, onClose]);

  const style = typeStyles[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bottom-alert-toast"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-sm"
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.25, ease: "easeOut" } }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <div
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md",
              style.bg,
              style.border
            )}
          >
            <div className="pt-0.5">{style.icon}</div>

            <div className="flex-1 text-left min-w-0">
              <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
              {description && (
                <p className="text-xs opacity-80 mt-0.5 leading-relaxed">{description}</p>
              )}

              {actionText && onAction && (
                <button
                  onClick={() => {
                    onAction();
                    onClose();
                  }}
                  className="mt-2 text-xs font-bold underline cursor-pointer hover:opacity-100 opacity-90 transition-opacity"
                >
                  {actionText}
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
