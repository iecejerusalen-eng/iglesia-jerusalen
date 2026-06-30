const https = require('https');
const fs = require('fs');

const files = [
  { url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Ding_Dong_Bell.ogg', name: 'correct.mp3' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Sfx_alarm_loop1.ogg', name: 'wrong.mp3' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Dark_Matter_-_Suspense_Music.ogg', name: 'suspense.mp3' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Piano_loop.ogg', name: 'theme.mp3' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Drum_roll.ogg', name: 'final_answer.mp3' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Tada.ogg', name: 'win.mp3' }
];

if (!fs.existsSync('public/audios')) {
  fs.mkdirSync('public/audios', { recursive: true });
}

files.forEach(file => {
  https.get(file.url, { headers: { 'User-Agent': 'MyGameApp/1.0' } }, (res) => {
    if (res.statusCode === 301 || res.statusCode === 302) {
      https.get(res.headers.location, { headers: { 'User-Agent': 'MyGameApp/1.0' } }, (res2) => {
        const fileStream = fs.createWriteStream(`public/audios/${file.name}`);
        res2.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Downloaded ${file.name} (redirect)`);
        });
      });
    } else {
      const fileStream = fs.createWriteStream(`public/audios/${file.name}`);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`Downloaded ${file.name}`);
      });
    }
  }).on('error', (err) => {
    console.error(`Error downloading ${file.name}: ${err.message}`);
  });
});
