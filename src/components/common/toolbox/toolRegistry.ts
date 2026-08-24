import {
  BookOpen,
  Gauge,
  Mic,
  PenTool,
  Timer,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ToolboxPanel } from '../../../store/useToolboxStore';
import { canAccessTool, type ToolboxRole } from './toolPermissions';

export type ToolAccent = 'amber' | 'sky' | 'emerald' | 'rose' | 'violet';

export interface ToolboxToolDefinition {
  id: Exclude<ToolboxPanel, 'hub'>;
  label: string;
  shortDescription: string;
  icon: LucideIcon;
  accent: ToolAccent;
  isAvailable: (role: ToolboxRole, pathname: string, roles?: readonly ToolboxRole[]) => boolean;
}

const accessByRole = (tool: Exclude<ToolboxPanel, 'hub'>) => (role: ToolboxRole, _pathname: string, roles: readonly ToolboxRole[] = []) =>
  canAccessTool(tool, [role, ...roles]);

export const TOOLBOX_TOOLS: readonly ToolboxToolDefinition[] = [
  {
    id: 'metronome',
    label: 'Metrónomo',
    shortDescription: 'Tempo y compás precisos',
    icon: Gauge,
    accent: 'amber',
    isAvailable: accessByRole('metronome'),
  },
  {
    id: 'tuner',
    label: 'Afinador',
    shortDescription: 'Afinación cromática',
    icon: Mic,
    accent: 'sky',
    isAvailable: accessByRole('tuner'),
  },
  {
    id: 'clicker',
    label: 'Aforo',
    shortDescription: 'Conteo y capacidad',
    icon: Users,
    accent: 'emerald',
    isAvailable: accessByRole('clicker'),
  },
  {
    id: 'timer',
    label: 'Temporizador',
    shortDescription: 'Tiempo de púlpito y avisos',
    icon: Timer,
    accent: 'rose',
    isAvailable: accessByRole('timer'),
  },
  {
    id: 'bible',
    label: 'Biblia',
    shortDescription: 'Consulta pasajes al instante',
    icon: BookOpen,
    accent: 'sky',
    isAvailable: accessByRole('bible'),
  },
  {
    id: 'notes',
    label: 'Notas rápidas',
    shortDescription: 'Ideas guardadas localmente',
    icon: PenTool,
    accent: 'violet',
    isAvailable: accessByRole('notes'),
  },
] as const;

export function getToolDefinition(panel: ToolboxPanel): ToolboxToolDefinition | null {
  if (panel === 'hub') return null;
  return TOOLBOX_TOOLS.find((tool) => tool.id === panel) ?? null;
}
