import logoSymbols from '../../assets/Jerusalén/nueva-identidad/emblema-iglesia-jerusalen.svg';

export type QuadrangularSymbolName = 'cross' | 'dove' | 'cup' | 'crown';

const SYMBOL_VIEW_BOXES: Record<QuadrangularSymbolName, string> = {
  cross: '0 100 60 60',
  cup: '67.5 100 60 60',
  dove: '162.5 100 60 60',
  crown: '230 100 60 60',
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
      <image href={logoSymbols} width="290.2" height="238.09" preserveAspectRatio="none" />
    </svg>
  );
}
