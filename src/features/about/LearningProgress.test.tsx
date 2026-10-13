import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LearningProgress from './LearningProgress';
import { LEARNING_PROGRESS_KEY } from './useLearningProgress';

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('Learning progress', () => {
  it('keeps two visible progress widgets synchronized and permits unmarking', () => {
    render(<MemoryRouter><LearningProgress /><LearningProgress topic="doctrina" /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como leído' }));
    expect(screen.getAllByText(/1 de 5 lecturas marcadas/)).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(LEARNING_PROGRESS_KEY)!)).toEqual(['doctrina']);
    fireEvent.click(screen.getByRole('button', { name: /Lectura completada/ }));
    expect(JSON.parse(localStorage.getItem(LEARNING_PROGRESS_KEY)!)).toEqual([]);
  });
  it('reports invalid saved progress and only resets it after confirmation', () => {
    localStorage.setItem(LEARNING_PROGRESS_KEY, '{bad'); vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<MemoryRouter><LearningProgress topic="doctrina" /></MemoryRouter>);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo leer');
    expect(screen.getByRole('button', { name: 'Marcar como leído' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar progreso' })); expect(localStorage.getItem(LEARNING_PROGRESS_KEY)).toBe('{bad');
    confirm.mockReturnValue(true); fireEvent.click(screen.getByRole('button', { name: 'Reiniciar progreso' }));
    expect(localStorage.getItem(LEARNING_PROGRESS_KEY)).toBe('[]');
  });
});
