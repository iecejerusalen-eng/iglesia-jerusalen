import { describe, expect, it } from 'vitest';
import { DEFAULT_DONATION_PAGE_CONFIG, parseDonationPageConfig } from './types';

describe('parseDonationPageConfig', () => {
  it('uses the safe default configuration when the database value is missing', () => {
    expect(parseDonationPageConfig(null)).toEqual(DEFAULT_DONATION_PAGE_CONFIG);
  });

  it('keeps valid administrative content and removes invalid suggested amounts', () => {
    const parsed = parseDonationPageConfig({
      title: 'Una página real',
      preset_amounts: [5, -10, '25', 40, Number.NaN],
      transfer_instructions: ['Primero', '', 22, 'Segundo'],
      transfer_enabled: false,
    });

    expect(parsed.title).toBe('Una página real');
    expect(parsed.preset_amounts).toEqual([5, 40]);
    expect(parsed.transfer_instructions).toEqual(['Primero', 'Segundo']);
    expect(parsed.transfer_enabled).toBe(false);
  });
});
