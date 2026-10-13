import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultLearningDocuments } from './defaultLearningDocuments';
import type { LearningDraft } from './learningDocument';

const mocks = vi.hoisted(() => ({ save: vi.fn(), review: vi.fn(), publish: vi.fn() }));
vi.mock('./learningService', () => ({ saveLearningDraft: mocks.save, requestLearningReview: mocks.review, publishLearning: mocks.publish }));
vi.mock('../../config/supabase', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }) }) } }));
vi.mock('../../store/useConfirmStore', () => ({ useConfirmStore: (selector: (state: { confirm: () => Promise<boolean> }) => unknown) => selector({ confirm: async () => true }) }));
vi.mock('../../components/admin/BlockEditor', () => ({ default: () => <div>Editor de bloques compartido</div> }));
vi.mock('../../components/common/MediaUploader', () => ({ default: () => <button>Subir</button> }));
vi.mock('./LearningDocumentView', () => ({ default: () => <div>Vista previa</div> }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
import { LearningDraftForm } from './LearningEditor';

const draft: LearningDraft = { ...defaultLearningDocuments[0], status: 'draft', revision: 2, updated_at: '2026-10-12T20:00:00Z', review_notes: '' };
function show(props: Partial<Parameters<typeof LearningDraftForm>[0]> = {}) {
  return render(<MemoryRouter><QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><LearningDraftForm draft={draft} canEdit canReview={false} onDirty={() => undefined} {...props} /></QueryClientProvider></MemoryRouter>);
}
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Pastoral editorial controls', () => {
  it('keeps readonly fields disabled and hides publication from editors', () => {
    show({ canEdit: false });
    expect(screen.getByLabelText('Título', { exact: true })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Revisar y publicar' })).not.toBeInTheDocument();
  });
  it('requires saving before requesting review and preserves an error instead of claiming success', async () => {
    mocks.save.mockRejectedValue(new Error('Otro editor cambió esta lectura.')); vi.spyOn(console, 'error').mockImplementation(() => undefined);
    show(); fireEvent.change(screen.getByLabelText('Título', { exact: true }), { target: { value: 'Título actualizado' } });
    expect(screen.getByRole('button', { name: 'Solicitar revisión' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Otro editor cambió'));
    expect(mocks.review).not.toHaveBeenCalled(); expect(mocks.publish).not.toHaveBeenCalled(); vi.restoreAllMocks();
  });
  it('enables publication only for a reviewer with a saved review and signature', async () => {
    mocks.publish.mockResolvedValue(undefined); show({ canReview: true, draft: { ...draft, status: 'review' } });
    const button = screen.getByRole('button', { name: 'Revisar y publicar' }); expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Firma pública del revisor'), { target: { value: 'Revisor de prueba' } });
    expect(button).toBeEnabled(); fireEvent.click(button); await waitFor(() => expect(mocks.publish).toHaveBeenCalledWith(expect.objectContaining({ revision: 2 }), 'Revisor de prueba'));
  });
});
