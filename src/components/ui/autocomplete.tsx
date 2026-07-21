/* eslint-disable react-refresh/only-export-components */
"use client";

import * as React from "react";
import { Search, ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface AutocompleteItemType {
  value: string;
  label: string;
  category?: string;
  description?: string;
  icon?: React.ReactNode;
  [key: string]: unknown;
}

interface AutocompleteContextType {
  inputValue: string;
  setInputValue: (val: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  filteredItems: AutocompleteItemType[];
  selectItem: (item: AutocompleteItemType) => void;
}

const AutocompleteContext = React.createContext<AutocompleteContextType | null>(null);

export function useAutocompleteContext() {
  const ctx = React.useContext(AutocompleteContext);
  if (!ctx) {
    throw new Error("Autocomplete subcomponents must be used within an <Autocomplete /> parent.");
  }
  return ctx;
}

export interface AutocompleteProps {
  items: AutocompleteItemType[];
  value?: string;
  onValueChange?: (value: string, item?: AutocompleteItemType) => void;
  onSelect?: (item: AutocompleteItemType) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  filterFn?: (item: AutocompleteItemType, query: string) => boolean;
  className?: string;
  children: React.ReactNode;
}

export function Autocomplete({
  items,
  value,
  onValueChange,
  onSelect,
  open: controlledOpen,
  onOpenChange,
  filterFn,
  className,
  children,
}: AutocompleteProps) {
  const isControlledValue = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState(value || "");
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  const inputValue = isControlledValue ? (value ?? "") : uncontrolledValue;
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const setIsOpen = React.useCallback(
    (open: boolean) => {
      if (onOpenChange) onOpenChange(open);
      setUncontrolledOpen(open);
      if (!open) setHighlightedIndex(-1);
    },
    [onOpenChange]
  );

  const setInputValue = React.useCallback(
    (val: string) => {
      if (!isControlledValue) {
        setUncontrolledValue(val);
      }
      if (onValueChange) onValueChange(val);
      if (!isOpen && val.trim().length > 0) {
        setIsOpen(true);
      }
    },
    [isControlledValue, onValueChange, isOpen, setIsOpen]
  );

  const defaultFilter = (item: AutocompleteItemType, query: string) => {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    return (
      item.label.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  };

  const activeFilter = filterFn || defaultFilter;
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => activeFilter(item, inputValue));
  }, [items, inputValue, activeFilter]);

  const selectItem = React.useCallback(
    (item: AutocompleteItemType) => {
      if (!isControlledValue) {
        setUncontrolledValue(item.label);
      }
      if (onValueChange) onValueChange(item.label, item);
      if (onSelect) onSelect(item);
      setIsOpen(false);
    },
    [isControlledValue, onValueChange, onSelect, setIsOpen]
  );

  return (
    <AutocompleteContext.Provider
      value={{
        inputValue,
        setInputValue,
        isOpen,
        setIsOpen,
        highlightedIndex,
        setHighlightedIndex,
        filteredItems,
        selectItem,
      }}
    >
      <div className={cn("relative w-full", className)}>{children}</div>
    </AutocompleteContext.Provider>
  );
}

export interface AutocompleteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "default" | "lg";
  startAddon?: React.ReactNode;
  hideIcon?: boolean;
  showTrigger?: boolean;
  showClear?: boolean;
  isLoading?: boolean;
}

export const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  (
    {
      size = "default",
      startAddon,
      hideIcon = false,
      showTrigger = false,
      showClear = false,
      isLoading = false,
      placeholder = "Buscar...",
      className,
      onFocus,
      onBlur,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const {
      inputValue,
      setInputValue,
      isOpen,
      setIsOpen,
      highlightedIndex,
      setHighlightedIndex,
      filteredItems,
      selectItem,
    } = useAutocompleteContext();

    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const sizeClasses = {
      sm: "h-9 text-xs py-1.5 rounded-xl",
      default: "h-11 text-sm py-2 rounded-2xl",
      lg: "h-13 text-base py-3 rounded-2xl",
    };

    const hasStartIcon = !hideIcon;

    const leftPaddingClasses = {
      sm: hasStartIcon ? "pl-9" : "pl-3",
      default: hasStartIcon ? "pl-11" : "pl-4",
      lg: hasStartIcon ? "pl-12" : "pl-5",
    };

    // Calculate active right actions count
    const hasClear = Boolean(showClear && inputValue);
    const rightActionsCount = (isLoading ? 1 : 0) + (hasClear ? 1 : 0) + (showTrigger ? 1 : 0);

    const rightPaddingClass =
      rightActionsCount >= 3
        ? "pr-24"
        : rightActionsCount === 2
        ? "pr-16"
        : rightActionsCount === 1
        ? "pr-10"
        : "pr-4";

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        setIsOpen(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if (e.key === "Enter") {
        if (isOpen && highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
          e.preventDefault();
          selectItem(filteredItems[highlightedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }

      if (onKeyDown) onKeyDown(e);
    };

    return (
      <div className="relative flex items-center w-full group">
        {hasStartIcon && (
          <div className="absolute left-3.5 z-10 flex items-center justify-center text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
            {startAddon ? startAddon : <Search className="w-4 h-4" />}
          </div>
        )}

        <input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={(e) => {
            setIsOpen(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setTimeout(() => setIsOpen(false), 200);
            if (onBlur) onBlur(e);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-medium",
            sizeClasses[size],
            leftPaddingClasses[size],
            rightPaddingClass,
            className
          )}
          {...props}
        />

        <div className="absolute right-3.5 z-10 flex items-center gap-1.5 text-slate-400">
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}

          {hasClear && (
            <button
              type="button"
              onClick={() => {
                setInputValue("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {showTrigger && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
          )}
        </div>
      </div>
    );
  }
);
AutocompleteInput.displayName = "AutocompleteInput";

export interface AutocompletePopupProps {
  children: React.ReactNode;
  className?: string;
}

export function AutocompletePopup({ children, className }: AutocompletePopupProps) {
  const { isOpen } = useAutocompleteContext();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 4, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl backdrop-blur-xl p-1.5",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface AutocompleteListProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  children?: React.ReactNode | ((item: AutocompleteItemType, index: number) => React.ReactNode);
}

export function AutocompleteList({ children, className, ...props }: AutocompleteListProps) {
  const { filteredItems } = useAutocompleteContext();

  if (typeof children === "function") {
    return (
      <div className={cn("max-h-64 overflow-y-auto space-y-1 custom-scrollbar-dark", className)} {...props}>
        {filteredItems.map((item, index) => children(item, index))}
      </div>
    );
  }

  return (
    <div className={cn("max-h-64 overflow-y-auto space-y-1 custom-scrollbar-dark", className)} {...props}>
      {children}
    </div>
  );
}

export interface AutocompleteItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: AutocompleteItemType | string;
  index?: number;
}

export function AutocompleteItem({
  value,
  index,
  children,
  className,
  onClick,
  ...props
}: AutocompleteItemProps) {
  const { selectItem, highlightedIndex, setHighlightedIndex, filteredItems } = useAutocompleteContext();

  const itemObj: AutocompleteItemType =
    typeof value === "string"
      ? { value, label: String(children || value) }
      : value;

  const itemIndex =
    index !== undefined
      ? index
      : filteredItems.findIndex((i) => i.value === itemObj.value);

  const isHighlighted = highlightedIndex === itemIndex;

  return (
    <div
      onMouseEnter={() => setHighlightedIndex(itemIndex)}
      onClick={(e) => {
        selectItem(itemObj);
        if (onClick) onClick(e);
      }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer select-none",
        isHighlighted
          ? "bg-blue-600/20 text-blue-300 dark:bg-blue-600/30 dark:text-blue-200"
          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60",
        className
      )}
      {...props}
    >
      {itemObj.icon && <span className="shrink-0 text-slate-400">{itemObj.icon}</span>}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="truncate">{children || itemObj.label}</span>
        {itemObj.description && (
          <span className="text-xs text-slate-400 font-normal truncate">
            {itemObj.description}
          </span>
        )}
      </div>
    </div>
  );
}

export function AutocompleteEmpty({
  children = "No se encontraron resultados.",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { filteredItems } = useAutocompleteContext();

  if (filteredItems.length > 0) return null;

  return (
    <div className={cn("p-4 text-center text-xs text-slate-400 font-medium italic", className)}>
      {children}
    </div>
  );
}

export function AutocompleteGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1 py-1", className)}>
      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      {children}
    </div>
  );
}
