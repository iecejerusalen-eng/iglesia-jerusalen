import { supabase } from '../../../config/supabase';
import type { Song } from '../../../types';

export interface HardwareBridgeStatus {
  proPresenterOnline: boolean;
  holyricsOnline: boolean;
  lastPing: string | null;
}

export interface HolyricsStagePayload {
  title: string;
  artist?: string | null;
  lyricsText: string;
  chordsText?: string | null;
  key?: string | null;
}

/**
 * Hardware Bridge Service
 * Controlador cliente para interactuar con el puente local de ProPresenter y Holyrics.
 */
export class HardwareBridgeService {
  private static HOLYRICS_LOCAL_URL = 'http://localhost:8080/stage';

  /**
   * Envía una orden de cambio de diapositiva o presentación a ProPresenter vía Realtime
   */
  static async sendProPresenterCommand(
    connectionId: string,
    commandType: 'show_lyrics' | 'clear_output' | 'next_slide' | 'previous_slide' | 'trigger_slide',
    payload: Record<string, unknown> = {}
  ) {
    try {
      const { data, error } = await supabase.from('propresenter_commands').insert({
        connection_id: connectionId,
        command_type: commandType,
        status: 'pending',
        payload
      }).select().single();

      if (error) throw error;
      return { success: true, command: data };
    } catch (error) {
      console.error('Error enviando comando a ProPresenter:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'No se pudo enviar el comando a ProPresenter.'
      };
    }
  }

  /**
   * Envía las letras y acordes del repertorio al servidor local de Holyrics
   */
  static async syncSongToHolyrics(song: Song): Promise<{ success: boolean; message: string }> {
    const payload: HolyricsStagePayload = {
      title: song.title,
      artist: song.artist,
      lyricsText: song.lyrics || '',
      chordsText: song.chords || null,
      key: song.original_key || null
    };

    try {
      // Intentar envío HTTP al endpoint de Holyrics en red local
      const response = await fetch(this.HOLYRICS_LOCAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return { success: true, message: `Canción "${song.title}" sincronizada con Holyrics.` };
      }
      throw new Error(`Respuesta HTTP ${response.status}`);
    } catch {
      // Fallback: Registrar en comando de Supabase para que el puente local lo procese
      try {
        await supabase.from('holyrics_commands').insert({
          command_type: 'sync_song',
          payload
        });
        return {
          success: true,
          message: `Canción "${song.title}" encolada para transmisión a Holyrics mediante puente local.`
        };
      } catch (err) {
        return {
          success: false,
          message: err instanceof Error ? err.message : 'No se pudo sincronizar la canción con Holyrics.'
        };
      }
    }
  }
}
