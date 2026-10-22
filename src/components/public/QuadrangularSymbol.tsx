import logoSymbols from '../../assets/Jerusalén/nueva-identidad/emblema-iglesia-jerusalen.svg';

export type QuadrangularSymbolName = 'cross' | 'dove' | 'cup' | 'crown';

const SYMBOL_VIEW_BOXES: Record<QuadrangularSymbolName, string> = {
  cross: '0 400 234 234',
  dove: '252 400 234 234',
  cup: '630 400 234 234',
  crown: '882 400 234 234',
};

interface QuadrangularSymbolProps {
  symbol: QuadrangularSymbolName;
  className?: string;
}

export default function QuadrangularSymbol({ symbol, className = '' }: QuadrangularSymbolProps) {
  return (
    <svg
      viewBox={SYMBOL_VIEW_BOXES[symbol]}
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <image href={logoSymbols} width="1116" height="738" preserveAspectRatio="none" />
    </svg>
  );
}
