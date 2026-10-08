import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import Governance from './Governance';
const document = { title: 'Reglamento', sourceFile: 'original.pdf', scanned: false, pages: [{ number: 1, text: 'TÍTULO I\n\nArtículo 1.- Misión y servicio.' }, { number: 2, text: 'Artículo 2.- Organización y comunidad.' }] };
function show() { return render(<HelmetProvider><MemoryRouter initialEntries={['/nosotros/documentos/reglamento-interno']}><Routes><Route path="/nosotros/documentos/:document" element={<Governance />} /></Routes></MemoryRouter></HelmetProvider>); }
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => document }));
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Herramientas documentales', () => {
  it('resalta búsquedas sin tilde conservando el texto original', async () => {
    const view = show(); await screen.findByRole('heading', { name: 'Artículo 1.-' });
    fireEvent.change(screen.getByLabelText('Buscar palabra o artículo'), { target: { value: 'mision' } });
    expect(view.container.querySelector('mark')?.textContent).toBe('Misión');
    expect(view.container.querySelectorAll('.governance-page')).toHaveLength(1);
  });
  it('recupera los marcadores al volver a abrir el documento', async () => {
    const view = show(); await screen.findByRole('heading', { name: 'Artículo 1.-' });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar página 1' }));
    expect(JSON.parse(localStorage.getItem('governance-bookmarks-reglamento-interno')!)).toEqual([1]);
    view.unmount(); show(); await screen.findByRole('heading', { name: 'Artículo 1.-' });
    expect(screen.getByRole('button', { name: 'Quitar marcador de página 1', pressed: true })).toHaveAttribute('aria-pressed', 'true');
  });
  it('informa cuando el navegador rechaza guardar un marcador', async () => {
    show(); await screen.findByRole('heading', { name: 'Artículo 1.-' });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Almacenamiento bloqueado'); });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar página 1' }));
    expect(screen.getByRole('status')).toHaveTextContent('No se pudo guardar el marcador');
    expect(screen.getByRole('button', { name: 'Guardar página 1' })).toHaveAttribute('aria-pressed', 'false');
  });
  it('restablece tamaño y concentración sin perder el documento', async () => {
    const view = show(); await screen.findByRole('heading', { name: 'Artículo 1.-' });
    fireEvent.click(screen.getByRole('button', { name: 'Aumentar tamaño de texto' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concentración' }));
    expect(view.container.querySelector('main')).toHaveClass('governance-focus');
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer ajustes de lectura' }));
    expect(view.container.querySelector('main')).not.toHaveClass('governance-focus');
    expect(view.container.querySelector('main')?.style.getPropertyValue('--reading-size')).toBe('16px');
    await waitFor(() => expect(view.container.querySelectorAll('.governance-page')).toHaveLength(2));
  });
});
