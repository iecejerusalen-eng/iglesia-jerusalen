import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import GlobalToolbox from '../../GlobalToolbox';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useToolboxStore } from '../../../../store/useToolboxStore';

describe('GlobalToolbox', () => {
  beforeEach(() => {
    useAuthStore.setState({ role: 'member' });
    useToolboxStore.setState({
      isOpen: false,
      isMinimized: false,
      activePanel: 'hub',
      isPlaying: false,
      timerIsRunning: false,
    });
  });

  afterEach(() => {
    useToolboxStore.getState().close();
  });

  it('abre el hub desde el lanzador y expone las herramientas generales', async () => {
    render(
      <MemoryRouter initialEntries={['/predicas/mensaje']}>
        <GlobalToolbox />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir centro de herramientas' }));

    expect(await screen.findByRole('complementary', { name: 'Centro de herramientas global' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Metrónomo\. Tempo y compás precisos/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Temporizador\. Tiempo de púlpito y avisos/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Biblia\. Consulta pasajes al instante/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Aforo\. Conteo y capacidad/ })).not.toBeInTheDocument();
  });

  it('navega a una herramienta, minimiza y restaura sin desmontar el panel', async () => {
    useToolboxStore.setState({ isOpen: true });
    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalToolbox />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Temporizador\. Tiempo de púlpito y avisos/ }));
    expect(await screen.findByText('Reloj de púlpito')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Minimizar herramientas' }));
    expect(screen.getByRole('button', { name: 'Restaurar herramientas' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Restaurar herramientas' }));
    await waitFor(() => expect(screen.getByText('Reloj de púlpito')).toBeVisible());
  });

  it('cierra el panel de herramientas de forma inmediata al presionar el botón X', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <GlobalToolbox />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir centro de herramientas' }));
    expect(await screen.findByRole('complementary', { name: 'Centro de herramientas global' })).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar herramientas' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Abrir centro de herramientas' })).toBeVisible();
      expect(useToolboxStore.getState().isOpen).toBe(false);
    });
  });
});
