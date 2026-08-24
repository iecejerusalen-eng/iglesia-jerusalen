import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Music } from 'lucide-react';
import EmptyState from '../EmptyState';

describe('EmptyState Component', () => {
  it('renders title, description and icon properly', () => {
    render(
      <BrowserRouter>
        <EmptyState
          icon={Music}
          title="Sin resultados"
          description="No encontramos alabanzas con ese término."
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Sin resultados')).toBeDefined();
    expect(screen.getByText('No encontramos alabanzas con ese término.')).toBeDefined();
  });

  it('handles action button callback', () => {
    const handleAction = vi.fn();

    render(
      <BrowserRouter>
        <EmptyState
          icon={Music}
          title="Biblioteca vacía"
          description="Aún no se han agregado canciones."
          actionLabel="Agregar Canción"
          onAction={handleAction}
        />
      </BrowserRouter>
    );

    const button = screen.getByRole('button', { name: /Agregar Canción/i });
    expect(button).toBeDefined();
    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders action link when actionUrl is provided', () => {
    render(
      <BrowserRouter>
        <EmptyState
          icon={Music}
          title="Sin eventos"
          description="No hay eventos programados."
          actionLabel="Ver Calendario"
          actionUrl="/eventos"
        />
      </BrowserRouter>
    );

    const link = screen.getByRole('link', { name: /Ver Calendario/i });
    expect(link.getAttribute('href')).toBe('/eventos');
  });
});
