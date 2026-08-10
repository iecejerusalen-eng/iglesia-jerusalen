import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useToolboxStore } from '../../../../store/useToolboxStore';
import { SermonTimerTool } from '../SermonTimerTool';
import { TallyClickerTool } from '../TallyClickerTool';

const resetState = () => useToolboxStore.setState({
  tallyCount: 0,
  tallyPreviousCount: null,
  tallyCapacity: 100,
  tallyLastChangedAt: null,
  timerDuration: 45,
  timerTimeLeft: 45 * 60,
  timerIsRunning: false,
  timerStatus: 'idle',
  timerEndsAt: null,
  timerAllowOvertime: false,
  timerSoundEnabled: false,
  timerVibrationEnabled: false,
  timerAlertError: null,
  persistenceError: null,
});

describe('SermonTimerTool', () => {
  beforeEach(resetState);
  afterEach(() => useToolboxStore.getState().resetTimer());

  it('accepts a custom duration and exposes accessible controls', () => {
    render(<SermonTimerTool />);

    fireEvent.change(screen.getByLabelText('Duración (minutos)'), { target: { value: '72' } });
    expect(useToolboxStore.getState().timerDuration).toBe(72);
    expect(screen.getByRole('button', { name: 'Añadir 5 minutos' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Iniciar' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts, pauses and adjusts the reliable store timer', () => {
    render(<SermonTimerTool />);

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar' }));
    expect(useToolboxStore.getState().timerStatus).toBe('running');
    fireEvent.click(screen.getByRole('button', { name: 'Añadir 1 minutos' }));
    expect(useToolboxStore.getState().timerTimeLeft).toBe(45 * 60 + 60);
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(useToolboxStore.getState().timerStatus).toBe('paused');
  });
});

describe('TallyClickerTool', () => {
  beforeEach(resetState);

  it('supports pointer and arrow-key counting plus undo', () => {
    render(<TallyClickerTool />);
    const counter = screen.getByRole('button', { name: /Aumentar aforo/ });

    fireEvent.click(counter);
    fireEvent.keyDown(counter, { key: 'ArrowUp' });
    fireEvent.keyDown(counter, { key: 'ArrowDown' });
    expect(useToolboxStore.getState().tallyCount).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer último cambio del aforo' }));
    expect(useToolboxStore.getState().tallyCount).toBe(2);
  });

  it('uses an accessible confirmation dialog before reset', async () => {
    useToolboxStore.setState({ tallyCount: 8, tallyPreviousCount: 7 });
    render(<TallyClickerTool />);

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar contador de aforo' }));
    expect(await screen.findByRole('alertdialog')).toBeVisible();
    expect(screen.getByText('¿Reiniciar el aforo?')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar conteo' }));

    expect(useToolboxStore.getState().tallyCount).toBe(0);
    expect(useToolboxStore.getState().tallyPreviousCount).toBe(8);
  });
});
