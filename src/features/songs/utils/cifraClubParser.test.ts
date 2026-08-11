import { describe, expect, it } from 'vitest';
import { parseCifraClubText } from './cifraClubParser';

describe('parseCifraClubText', () => {
  it('parses CifraClub pasted text with metadata, chord lines, and sections', () => {
    const rawInput = `
https://www.cifraclub.com/la-ibi/santo-por-siempre/
Título: Santo Por Siempre
Autor: IBI

Key: G

[Intro] C  Em  D  
">Bm
        Em  D  

[First Part]

">G

[First Part]

 
Mil generaciones
">G
Mil generaciones
    C          
Se postran adorarle
">G
Se postran adorarle
       Em        
Le cantan al cordero
">D
Le cantan al cordero
         
Que venció

[Chorus 1]

">Am7
Tu nombre, sobre todo es

[Chorus 1]

            
Claman ángeles
">C
Claman ángeles
 Em  
San_to
">D
San_to
               
Clama la creación
">Bm7
Clama la creación
    
Santo
">Em
Santo
           
Exaltado Dios
">Am7
Exaltado Dios
    
Santo
">D
Santo
            
Santo por siempre
    `;

    const result = parseCifraClubText(rawInput);

    expect(result.title).toBe('Santo Por Siempre');
    expect(result.artist).toBe('IBI');
    expect(result.key).toBe('G');
    expect(result.chords).toEqual(expect.arrayContaining(['C', 'Em', 'D', 'Bm', 'G', 'Am7', 'Bm7']));
    expect(result.structureBlocks.length).toBeGreaterThan(0);
    expect(result.bracketLyrics).toContain('[Intro]');
    expect(result.bracketLyrics).toContain('[C] [Em] [D]');
    expect(result.bracketLyrics).toContain('[Estrofa 1]');
  });
});
