const fs = require('fs');
const file = 'src/pages/admin/SongsManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add Import
if (!content.includes('SongBlockEditor')) {
  content = content.replace(
    "import SongLyricsEditor from '../../components/admin/SongLyricsEditor';",
    "import { SongBlockEditor } from '../../features/songs/components/editor/SongBlockEditor';"
  );
}

// 2. Remove editorMode state
content = content.replace(/const \[editorMode, setEditorMode\] = useState<'free' \| 'structured'>\('free'\);\n/g, '');
content = content.replace(/setEditorMode\('free'\);\n/g, '');
content = content.replace(/setEditorMode\([^)]+\);\n/g, '');

// 3. Update onSubmit to always compile blocks
content = content.replace(
  `    let compiledLyrics = lyrics;
    if (editorMode === 'structured') {
      compiledLyrics = compileBlocksToHtml(structureBlocks);
    }`,
  `    let compiledLyrics = compileBlocksToHtml(structureBlocks);`
);

// 4. Update onSubmit payload
content = content.replace(
  `structure_blocks: editorMode === 'structured' ? structureBlocks : [],`,
  `structure_blocks: structureBlocks,`
);

// 5. Remove old functions addBlock, removeBlock, updateBlock, moveBlock
const functionsRegex = /const addBlock = \(\) => \{[\s\S]*?const moveBlock = \(index: number, direction: 'up' \| 'down'\) => \{[\s\S]*?updateParent\(\[...blocks\]\);\s*\};/g;
// Actually simpler: just find the lines and replace them. Let's do it manually.
const addBlockStart = content.indexOf('const addBlock = () => {');
const blockFunctionsEnd = content.indexOf('const handlePreview = (song: Song) => {');
if (addBlockStart > -1 && blockFunctionsEnd > -1) {
  content = content.substring(0, addBlockStart) + content.substring(blockFunctionsEnd);
}

// 6. Replace the UI Editor Block
// Find `{editorMode === 'free' ? (`
const editorModeStart = content.indexOf("{editorMode === 'free' ? (");
// We need to replace until we hit the end of the STRUCTURED BLOCK EDITOR.
// The end is exactly before `{/* SETTINGS (Right Column) */}`
const settingsStart = content.indexOf("{/* SETTINGS (Right Column) */}");
if (editorModeStart > -1 && settingsStart > -1) {
  // We need to keep the </div> that closes the left column, which is right before settingsStart.
  // Actually, let's just do a regex or exact replace.
  const newEditorUI = `
                <div className="space-y-4">
                  <SongBlockEditor 
                    content={structureBlocks.length > 0 ? JSON.stringify(structureBlocks) : lyrics}
                    onChange={(val) => {
                      try {
                        const parsed = JSON.parse(val);
                        setStructureBlocks(parsed);
                        // Sync lyrics state for backup
                        setLyrics(compileBlocksToHtml(parsed));
                      } catch(e) {}
                    }}
                    disabled={readOnly}
                  />
                </div>
`;
  
  // Find the exact slice
  let sliceEnd = content.lastIndexOf('</div>', settingsStart);
  content = content.substring(0, editorModeStart) + newEditorUI + content.substring(sliceEnd);
}

fs.writeFileSync(file, content);
console.log('Patched SongsManager.tsx');
