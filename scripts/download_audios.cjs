const fs = require('fs');
const https = require('https');
const path = require('path');

const audiosDir = path.join(__dirname, '..', 'public', 'audios');

if (!fs.existsSync(audiosDir)) {
  fs.mkdirSync(audiosDir, { recursive: true });
}

// Reliable Wikimedia Commons or public domain URLs for basic sound effects
const sounds = [
  {
    name: 'correct.mp3',
    // Correct Answer Ding
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Sound_Effect_-_Correct_Answer_Ding.ogg'
  },
  {
    name: 'wrong.mp3',
    // Wrong Buzzer
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Wrong_Buzzer_Sound_Effect.ogg'
  },
  {
    name: 'win.mp3',
    // Ta Da!
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Bells_correct.ogg'
  },
  {
    name: 'final_answer.mp3',
    // Drum roll
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Bells_correct.ogg' // Placeholder
  },
  {
    name: 'theme.mp3',
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Chimes_Theme.ogg' // Placeholder
  },
  {
    name: 'suspense.mp3',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Ghost_Processional_%28Incompetech%29.ogg' // Placeholder ambient
  }
];

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${dest}...`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function downloadAll() {
  for (const sound of sounds) {
    try {
      await downloadFile(sound.url, path.join(audiosDir, sound.name));
      console.log(`Successfully downloaded ${sound.name}`);
    } catch (e) {
      console.error(`Failed to download ${sound.name}:`, e);
    }
  }
  console.log("All audio downloads complete!");
}

downloadAll();
