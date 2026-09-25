import { describe, expect, it, beforeEach } from 'vitest';
import {
  DEFAULT_DRUM_STYLES,
  mergeDrumStyles,
  getLocalCustomDrumStyles,
  saveLocalCustomDrumStyles,
  DRUM_STYLES_LOCAL_STORAGE_KEY,
} from './drumStylesService';

describe('drumStylesService', () => {
  beforeEach(() => {
    window.localStorage.removeItem(DRUM_STYLES_LOCAL_STORAGE_KEY);
  });

  describe('mergeDrumStyles', () => {
    it('returns default presets when no custom or song styles are provided', () => {
      const merged = mergeDrumStyles();
      expect(merged).toEqual([...DEFAULT_DRUM_STYLES]);
    });

    it('merges custom styles and song styles without duplicating case-insensitively', () => {
      const presets = ['Balada Worship', 'Pop Worship 4/4'];
      const custom = ['Shuffle 4/4', 'balada worship', 'Reggae Cristiana'];
      const songsStyles = ['Pop Worship 4/4', 'Trap Worship', null, undefined, ''];

      const result = mergeDrumStyles(presets, custom, songsStyles);

      expect(result).toEqual([
        'Balada Worship',
        'Pop Worship 4/4',
        'Shuffle 4/4',
        'Reggae Cristiana',
        'Trap Worship',
      ]);
    });

    it('trims whitespace and ignores empty entries', () => {
      const presets = ['Marcha'];
      const custom = ['  Worship 6/8  ', '   '];
      const result = mergeDrumStyles(presets, custom, []);

      expect(result).toEqual(['Marcha', 'Worship 6/8']);
    });
  });

  describe('local storage persistence', () => {
    it('reads and writes custom drum styles cleanly', () => {
      expect(getLocalCustomDrumStyles()).toEqual([]);

      saveLocalCustomDrumStyles(['Shuffle Gospel', 'Bossa Nova Worship']);
      expect(getLocalCustomDrumStyles()).toEqual(['Shuffle Gospel', 'Bossa Nova Worship']);
    });

    it('handles malformed localStorage data gracefully', () => {
      window.localStorage.setItem(DRUM_STYLES_LOCAL_STORAGE_KEY, 'invalid json');
      expect(getLocalCustomDrumStyles()).toEqual([]);
    });
  });
});
