const fs = require('fs');
const file = 'src/features/songs/components/SongViewer.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!content.includes("SongSettingsSidebar")) {
  content = content.replace(
    "import { SheetMusicViewer } from './musical/SheetMusicViewer';",
    `import { SheetMusicViewer } from './musical/SheetMusicViewer';
import { SongSettingsSidebar } from './viewer/SongSettingsSidebar';
import type { InstrumentType } from '../../utils/chordDictionary';
import { StringChordDiagram } from './musical/StringChordDiagram';
import { PianoChordDiagram } from './musical/PianoChordDiagram';`
  );
}

// 2. State
const stateFind = `const [chordPosition, setChordPosition] = useState<'above' | 'inline'>('above');`;
if (content.includes(stateFind) && !content.includes("const [instrument, setInstrument] =")) {
  content = content.replace(
    stateFind,
    `${stateFind}
  const [instrument, setInstrument] = useState<InstrumentType>('guitarra');
  const [textSize, setTextSize] = useState(100);
  const [showDiagramsAtTop, setShowDiagramsAtTop] = useState(true);

  const uniqueChords = useMemo(() => {
    const chords = new Set<string>();
    
    // Support modern blocks
    if (selectedSong.structure_blocks) {
      selectedSong.structure_blocks.forEach((block: any) => {
        if (block.type === 'lyrics') {
          const text = block.lyrics || '';
          const regex = /\\[(.*?)\\]/g;
          let match;
          while ((match = regex.exec(text)) !== null) {
            chords.add(match[1]);
          }
        }
      });
    } else if (selectedSong.lyrics) {
      // Support legacy html 
      const text = selectedSong.lyrics || '';
      const regex = /\\[(.*?)\\]/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        chords.add(match[1]);
      }
    }
    return Array.from(chords).map(c => transposeNote(c, transposeAmount));
  }, [selectedSong.structure_blocks, selectedSong.lyrics, transposeAmount]);`
  );
}

// 3. CSS
if (!content.includes("--text-size")) {
  content = content.replace(
    `.song-lyrics {`,
    `.song-lyrics {
                font-size: clamp(14px, calc(18px * (var(--text-size) / 100)), 36px);
                line-height: clamp(1.8, calc(2.2 * (var(--text-size) / 100)), 4);`
  );

  content = content.replace(
    'className={`song-lyrics-wrapper font-${fontFamily}`}',
    'className={`song-lyrics-wrapper font-${fontFamily}`} style={{ "--text-size": textSize } as React.CSSProperties}'
  );
}

// 4. Layout Tab Lyrics
// We want to wrap from `<div className="space-y-6">` inside `{activeTab === 'lyrics' ? (` 
// all the way to `) : (` which is before `{/* RESOURCES AND TUTORIALS TAB */}`.

const startMarker = `{activeTab === 'lyrics' ? (
              /* LYRICS TAB */
              <div className="space-y-6">`;

const endMarker = `</div>
              </div>
            ) : (
              /* RESOURCES AND TUTORIALS TAB */`;

// It might not match exactly, so let's use a simpler strategy.
// Replace start of lyrics tab
if (content.includes(startMarker)) {
  content = content.replace(
    startMarker,
    `{activeTab === 'lyrics' ? (
              /* LYRICS TAB */
              <div className="flex flex-col lg:flex-row gap-6 relative items-start">
                {/* Main Content */}
                <div className="flex-1 w-full min-w-0">
                  <div className="space-y-6">
                    {/* Top Chords Strip */}
                    {showChords && showDiagramsAtTop && instrument !== 'ninguno' && uniqueChords.length > 0 && (
                      <div className="print:hidden w-full overflow-x-auto pb-4 mb-6 border-b border-slate-100 dark:border-white/5">
                        <div className="flex gap-4 min-w-max">
                          {uniqueChords.map(chord => (
                            <div key={chord} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl p-2 flex flex-col items-center min-w-[80px]">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{chord}</span>
                              {instrument === 'piano' ? (
                                <PianoChordDiagram chord={chord} width={70} height={60} showKeys={false} />
                              ) : (
                                <StringChordDiagram 
                                  chord={{ title: chord, fingers: [] }} 
                                  instrument={instrument === 'ukelele' ? 'ukulele' : 'guitar'} 
                                  width={60} 
                                  height={80} 
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}`
  );

  // Replace end of lyrics tab
  content = content.replace(
    `</div>
              </div>
            ) : (`,
    `</div>
                </div>
                
                {/* Sidebar */}
                <div className="print:hidden w-full lg:w-72 flex-shrink-0">
                  <div className="sticky top-24">
                    <SongSettingsSidebar 
                      instrument={instrument}
                      setInstrument={setInstrument}
                      transpose={transposeAmount}
                      setTranspose={setTransposeAmount}
                      textSize={textSize}
                      setTextSize={setTextSize}
                      showDiagramsAtTop={showDiagramsAtTop}
                      setShowDiagramsAtTop={setShowDiagramsAtTop}
                      showChords={showChords}
                      setShowChords={setShowChords}
                    />
                  </div>
                </div>
              </div>
            ) : (`
  );

  // Remove the old Advanced Toolbar because it's in the Sidebar now
  const toolbarRegex = /<div className="flex flex-wrap items-center gap-2 self-start md:self-auto max-w-full justify-end">[\s\S]*?{selectedSong\.has_chords && showChords && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>/;
  content = content.replace(toolbarRegex, '');
}

fs.writeFileSync(file, content);
console.log("Successfully patched SongViewer v4");
