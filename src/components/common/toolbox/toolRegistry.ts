import {
  BookOpen,
  Gauge,
  Mic,
  PenTool,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../../../types';
import type { ToolboxPanel } from '../../../store/useToolboxStore';

export type ToolAccent = 'amber' | 'sky' | 'emerald' | 'rose' | 'violet';

export interface ToolboxToolDefinition {
  id: Exclude<ToolboxPanel, 'hub'>;
  label: string;
  shortDescription: string;
  icon: LucideIcon;
  accent: ToolAccent;
  isAvailable: (role: UserRole | null, pathname: string) => boolean;
}

const availableToEveryone = () => true;

const logisticsRoles = new Set<UserRole>(['admin', 'leader', 'apoyo']);

export const TOOLBOX_TOOLS: readonly ToolboxToolDefinition[] = [
  {
    id: 'metronome',
    label: 'Metrónomo',
    shortDescription: 'Tempo y compás precisos',
    icon: Gauge,
    accent: 'amber',
    isAvailable: availableToEveryone,
  },
  {
    id: 'tuner',
    label: 'Afinador',
    shortDescription: 'Afinación cromática',
    icon: Mic,
    accent: 'sky',
    isAvailable: availableToEveryone,
  },
  {
    id: 'clicker',
    label: 'Aforo',
    shortDescription: 'Conteo y capacidad',
    icon: Users,
    accent: 'emerald',
    isAvailable: (role, pathname) =>
      role !== null && (logisticsRoles.has(role) || pathname.includes('/admin/')),
  },
  {
    id: 'timer',
    label: 'Temporizador',
    shortDescription: 'Tiempo de púlpito y avisos',
    icon: Timer,
    accent: 'rose',
    isAvailable: availableToEveryone,
  },
  {
    id: 'bible',
    label: 'Biblia',
    shortDescription: 'Consulta pasajes al instante',
    icon: BookOpen,
    accent: 'sky',
    isAvailable: availableToEveryone,
  },
  {
    id: 'notes',
    label: 'Notas rápidas',
    shortDescription: 'Ideas guardadas localmente',
    icon: PenTool,
    accent: 'violet',
    isAvailable: availableToEveryone,
  },
] as const;

export function getToolDefinition(panel: ToolboxPanel): ToolboxToolDefinition | null {
  if (panel === 'hub') return null;
  return TOOLBOX_TOOLS.find((tool) => tool.id === panel) ?? null;
}
