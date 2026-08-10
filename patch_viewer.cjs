const fs = require('fs');
const file = 'src/features/songs/components/SongViewer.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Imports
if (!content.includes('StringChordDiagram')) {
  content = content.replace(
    "import DOMPurify from 'dompurify';",
    "import DOMPurify from 'dompurify';\nimport { StringChordDiagram } from './musical/StringChordDiagram';\nimport { PianoChordDiagram } from './musical/PianoChordDiagram';\nimport { SheetMusicViewer } from './musical/SheetMusicViewer';"
  );
}

// 2. Replace the block rendering logic
const mapStart = content.indexOf('{selectedSong.structure_blocks.map((block) => (');
const mapEnd = content.indexOf('</div>\n                  ) : (', mapStart);

if (mapStart > -1 && mapEnd > -1) {
  const newMapLogic = `{selectedSong.structure_blocks.map((block: any) => (
                        <div 
                          key={block.id} 
                          className="border border-slate-100 dark:border-white/5 rounded-3xl p-5 bg-slate-50/30 dark:bg-slate-950/10 space-y-3"
                        >
                          {block.type === 'lyrics' && (
                            <>
                              <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2">
                                <span className={\`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide \${
                                  block.section_type === 'coro'
                                    ? 'bg-amber-55 dark:bg-amber-950/40 text-amber-800 dark:text-gold border-amber-300/30'
                                    : block.section_type === 'intro'
                                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-300/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 border-slate-200/30'
                                }\`}>
                                  {block.label}
                                </span>
                                {block.melody_guide && (
                                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-0.5 rounded-lg border border-indigo-200/20 flex items-center gap-1" title="Guía de notas">
                                    <Info size={10} /> {block.melody_guide}
                                  </span>
                                )}
                              </div>
                              <div 
                                className={\`song-lyrics \${!showChords ? 'hide-chords' : \`chords-\${chordPosition}\`}\`}
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bracketTextToHtml(block.lyrics, transposeAmount, nashvilleMode, originalKey), { ADD_ATTR: ['data-chord', 'data-chord-node'] }) }}
                              />
                            </>
                          )}
                          
                          {block.type === 'chord_diagram' && (
                            <div className="py-4">
                              <h4 className="text-xs font-bold text-muted-foreground uppercase mb-4 text-center">Diagramas de Acordes ({block.instrument})</h4>
                              <div className="flex flex-wrap justify-center gap-6">
                                {block.instrument === 'piano' ? (
                                  <PianoChordDiagram notes={block.chords} />
                                ) : (
                                  block.chords.map((c: string) => (
                                    <StringChordDiagram 
                                      key={c} 
                                      instrument={block.instrument} 
                                      chord={{ title: c, fingers: [] }} 
                                      color="var(--color-primary, #6366f1)"
                                    />
                                  ))
                                )}
                              </div>
                            </div>
                          )}

                          {block.type === 'sheet_music' && (
                            <div className="py-4">
                              {block.title && <h4 className="text-sm font-bold text-foreground mb-4 text-center">{block.title}</h4>}
                              <SheetMusicViewer abcNotation={block.abc_code} />
                            </div>
                          )}

                          {block.type === 'media_embed' && (
                            <div className="py-4 aspect-video rounded-xl overflow-hidden bg-black/10">
                              <iframe 
                                src={block.url.replace('watch?v=', 'embed/')} 
                                className="w-full h-full" 
                                allowFullScreen
                                title="Media Embed"
                              />
                            </div>
                          )}

                          {block.type === 'musician_note' && (
                            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
                              <Info className="text-amber-600 mt-0.5" size={18} />
                              <div>
                                <p className="text-xs font-bold text-amber-700 uppercase">{block.target_instrument}</p>
                                <p className="text-sm text-foreground mt-1">{block.content}</p>
                              </div>
                            </div>
                          )}
                          
                          {block.type === 'tablature' && (
                             <pre className="p-4 bg-slate-900 text-green-400 font-mono text-xs rounded-xl overflow-x-auto">
                               {block.content}
                             </pre>
                          )}
                        </div>
                      ))}
                      `;
  
  // Also we need to fix line 41 where it extracts textToAnalyze
  content = content.replace(
    "textToAnalyze = selectedSong.structure_blocks.map(b => b.lyrics).join('\\n');",
    "textToAnalyze = selectedSong.structure_blocks.filter((b: any) => b.type === 'lyrics').map((b: any) => b.lyrics).join('\\n');"
  );
  
  // And line 96
  content = content.replace(
    "result = song.structure_blocks.map(b => {",
    "result = song.structure_blocks.filter((b: any) => b.type === 'lyrics').map((b: any) => {"
  );
  
  // And line 114
  content = content.replace(
    "result = song.structure_blocks.map(b => {",
    "result = song.structure_blocks.filter((b: any) => b.type === 'lyrics').map((b: any) => {"
  );

  content = content.substring(0, mapStart) + newMapLogic + content.substring(mapEnd);
}

fs.writeFileSync(file, content);
console.log('Patched SongViewer.tsx');
