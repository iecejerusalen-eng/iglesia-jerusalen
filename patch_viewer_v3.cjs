const fs = require('fs');
const file = 'src/features/songs/components/SongViewer.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  "import { SheetMusicViewer } from './musical/SheetMusicViewer';",
  "import { SheetMusicViewer } from './musical/SheetMusicViewer';\nimport { SongSettingsSidebar } from './viewer/SongSettingsSidebar';\nimport type { InstrumentType } from '../../utils/chordDictionary';\nimport { StringChordDiagram } from './musical/StringChordDiagram';\nimport { PianoChordDiagram } from './musical/PianoChordDiagram';"
);

// 2. Add state and uniqueChords logic
const stateInsertionPoint = content.indexOf("const [chordPosition, setChordPosition] = useState<'above' | 'inline'>('above');");
const stateText = `const [chordPosition, setChordPosition] = useState<'above' | 'inline'>('above');
  const [instrument, setInstrument] = useState<InstrumentType>('guitarra');
  const [textSize, setTextSize] = useState(100);
  const [showDiagramsAtTop, setShowDiagramsAtTop] = useState(true);

  const uniqueChords = useMemo(() => {
    if (!selectedSong.structure_blocks) return [];
    const chords = new Set<string>();
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
    return Array.from(chords).map(c => transposeNote(c, transposeAmount));
  }, [selectedSong.structure_blocks, transposeAmount]);
`;
content = content.substring(0, stateInsertionPoint) + stateText + content.substring(stateInsertionPoint + "const [chordPosition, setChordPosition] = useState<'above' | 'inline'>('above');".length);

// 3. Inject CSS for text size
const cssInsertionPoint = content.indexOf('.song-lyrics {');
content = content.replace(
  '.song-lyrics {',
  '.song-lyrics {\n                font-size: clamp(14px, calc(18px * (var(--text-size) / 100)), 36px);\n                line-height: clamp(1.8, calc(2.2 * (var(--text-size) / 100)), 4);\n'
);

// Add the CSS var to the wrapper
content = content.replace(
  'className={`song-lyrics-wrapper font-${fontFamily}`}',
  'className={`song-lyrics-wrapper font-${fontFamily}`} style={{ "--text-size": textSize } as React.CSSProperties}'
);

// 4. Update the layout
// Find where the Lyrics Tab renders
const lyricsTabStart = content.indexOf('{activeTab === \'lyrics\' ? (');
const nextTabStart = content.indexOf('{activeTab === \'details\' ? (', lyricsTabStart);

let lyricsTabContent = content.substring(lyricsTabStart, nextTabStart);

// We want to wrap the lyrics content in a two-column layout
const twoColumnStart = `{activeTab === 'lyrics' ? (
              <div className="flex flex-col lg:flex-row gap-6 relative items-start">
                {/* Main Content */}
                <div className="flex-1 w-full min-w-0">
                  <div className="space-y-6">
`;

// Also add the chords strip
const chordsStrip = `
                    {/* Top Chords Strip */}
                    {showChords && showDiagramsAtTop && instrument !== 'ninguno' && uniqueChords.length > 0 && (
                      <div className="print:hidden w-full overflow-x-auto pb-4 mb-6">
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
                    )}
`;

lyricsTabContent = lyricsTabContent.replace(
  '{activeTab === \'lyrics\' ? (\n              /* LYRICS TAB */\n              <div className="space-y-6">',
  twoColumnStart + chordsStrip + '                  {/* Print Title (Visible only in print) */}'
);

// Now we need to close the left column and add the right column at the end of lyrics tab
// Find the end of lyrics tab content
// It ends right before `) : null}` or `{activeTab === 'details' ? (`
// Let's replace `\n            {activeTab === 'details' ? (` with our sidebar and closing tags

lyricsTabContent = lyricsTabContent.replace(
  /\n(\s*)\{activeTab === 'details' \? \(/,
  `
                  </div>
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
            ) : ` + "{activeTab === 'details' ? ("
);

// We need to clean up the existing Advanced Musician Controls Toolbar, since we moved its functionality to the Sidebar!
// Wait, we can hide the old toolbar or remove it. Let's just hide it by returning null, or let's remove it if possible.
// Actually, I can just regex replace the block.
// It starts with `{/* Advanced Musician Controls Toolbar */}` and ends with `</div>` of that block.
// Let's replace the whole `className="flex flex-wrap items-center gap-2 self-start md:self-auto max-w-full justify-end"` block which contains it.

const toolbarRegex = /<div className="flex flex-wrap items-center gap-2 self-start md:self-auto max-w-full justify-end">[\s\S]*?{selectedSong\.has_chords && showChords && \([\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>/;

// Let's just remove that old toolbar from the content since it's duplicated in the sidebar now.
lyricsTabContent = lyricsTabContent.replace(toolbarRegex, '');

content = content.substring(0, lyricsTabStart) + lyricsTabContent + content.substring(nextTabStart);

fs.writeFileSync(file, content);
console.log('Patched SongViewer.tsx');
