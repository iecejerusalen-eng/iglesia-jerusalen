import { describe, expect, it } from 'vitest';
import {
  monthEnd,
  movementSchema,
  summarize,
  titheCalendar,
  validateProof,
  type Movement,
  type Fund,
} from './model';
const fund: Fund = {
  id: '00000000-0000-4000-8000-000000000010',
  name: 'Diezmos',
  kind: 'tithe',
  restricted: false,
  active: true,
};
const movement: Movement = {
  id: '00000000-0000-4000-8000-000000000011',
  kind: 'income',
  fund_id: fund.id,
  user_id: '00000000-0000-4000-8000-000000000012',
  amount: 10.1,
  occurred_on: '2026-02-01',
  contribution_month: '2026-01-01',
  method: 'cash',
  status: 'confirmed',
  category: 'Diezmo',
  description: 'Aporte',
  reference: null,
  proof_path: null,
  beneficiary: null,
  correction_reason: null,
  version: 1,
  receipt_number: 'FIN-2026-1',
  created_at: '2026-02-01T00:00:00Z',
};
describe('Finanzas privadas', () => {
  it('excluye pendientes y anulados de los ingresos reales', () => {
    const result = summarize([
      movement,
      { ...movement, amount: 100, status: 'pending' },
      { ...movement, amount: 200, status: 'void' },
      {
        ...movement,
        amount: 2.3,
        kind: 'expense',
        method: 'transfer',
        user_id: null,
        contribution_month: null,
      },
    ]);
    expect(result).toEqual({
      income: 10.1,
      expenses: 2.3,
      net: 7.8,
      cash: 10.1,
      bank: -2.3,
      pending: 1,
    });
  });
  it('suma importes en centavos evitando acumulación de errores binarios', () => {
    expect(
      summarize([
        { ...movement, amount: 0.1 },
        { ...movement, amount: 0.2 },
      ]).income,
    ).toBe(0.3);
  });
  it('atribuye el diezmo al mes indicado aunque se haya registrado después', () => {
    const calendar = titheCalendar([movement], [fund], 2026);
    expect(calendar).toHaveLength(12);
    expect(calendar[0]).toEqual({
      month: '2026-01-01',
      amount: 10.1,
      status: 'confirmed',
    });
    expect(calendar[1].status).toBe('none');
  });
  it('no confunde una ofrenda ni un aporte anulado con un diezmo confirmado', () => {
    expect(
      titheCalendar(
        [
          { ...movement, fund_id: 'another' },
          { ...movement, status: 'void' },
        ],
        [fund],
        2026,
      )[0].status,
    ).toBe('none');
  });
  it('distingue el aporte pendiente de un mes sin registro', () => {
    expect(
      titheCalendar([{ ...movement, status: 'pending' }], [fund], 2026)[0]
        .status,
    ).toBe('pending');
  });
  it('calcula límites de mes incluyendo años bisiestos', () => {
    expect(monthEnd('2024-02-01')).toBe('2024-02-29');
    expect(monthEnd('2026-12-01')).toBe('2026-12-31');
  });
  it.each([0, -1, NaN, Infinity, 100000001])(
    'rechaza el importe inválido %s',
    (amount) => {
      expect(movementSchema.safeParse({ ...movement, amount }).success).toBe(
        false,
      );
    },
  );
  it('rechaza archivos vacíos, enormes o ejecutables', () => {
    expect(() =>
      validateProof(new File([], 'empty.pdf', { type: 'application/pdf' })),
    ).toThrow();
    expect(() =>
      validateProof(new File(['script'], 'script.html', { type: 'text/html' })),
    ).toThrow();
    expect(() =>
      validateProof(
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.pdf', {
          type: 'application/pdf',
        }),
      ),
    ).toThrow();
    expect(() =>
      validateProof(
        new File(['pdf'], 'proof.pdf', { type: 'application/pdf' }),
      ),
    ).not.toThrow();
  });
});
