import fs from 'fs';
let content = fs.readFileSync('src/pages/public/About.tsx', 'utf8');

// Replace remaining text-primary that aren't followed by dark:text-white
content = content.replace(/text-primary(?! dark:text-white| dark:text-\w+)/g, 'text-primary dark:text-white');
content = content.replace(/text-gray-655(?! dark:text-gray-\d+)/g, 'text-gray-655 dark:text-gray-300');
content = content.replace(/text-gray-500(?! dark:text-gray-\d+)/g, 'text-gray-500 dark:text-gray-400');
content = content.replace(/text-gray-600(?! dark:text-gray-\d+)/g, 'text-gray-600 dark:text-gray-300');

// Replace dark:text-white dark:text-white duplicates if any
content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');

fs.writeFileSync('src/pages/public/About.tsx', content);

// Also do this for Contact.tsx
let contactContent = fs.readFileSync('src/pages/public/Contact.tsx', 'utf8');
contactContent = contactContent.replace(/text-primary(?! dark:text-white| dark:text-\w+)/g, 'text-primary dark:text-white');
contactContent = contactContent.replace(/text-gray-655(?! dark:text-gray-\d+)/g, 'text-gray-655 dark:text-gray-300');
contactContent = contactContent.replace(/text-gray-500(?! dark:text-gray-\d+)/g, 'text-gray-500 dark:text-gray-400');
contactContent = contactContent.replace(/text-gray-600(?! dark:text-gray-\d+)/g, 'text-gray-600 dark:text-gray-300');
contactContent = contactContent.replace(/bg-white(?! dark:bg-slate-900| dark:bg-slate-950)/g, 'bg-white dark:bg-slate-900');
fs.writeFileSync('src/pages/public/Contact.tsx', contactContent);

// And Events.tsx
if (fs.existsSync('src/pages/public/Events.tsx')) {
    let eventsContent = fs.readFileSync('src/pages/public/Events.tsx', 'utf8');
    eventsContent = eventsContent.replace(/text-primary(?! dark:text-white| dark:text-\w+)/g, 'text-primary dark:text-white');
    eventsContent = eventsContent.replace(/text-gray-655(?! dark:text-gray-\d+)/g, 'text-gray-655 dark:text-gray-300');
    eventsContent = eventsContent.replace(/text-gray-500(?! dark:text-gray-\d+)/g, 'text-gray-500 dark:text-gray-400');
    eventsContent = eventsContent.replace(/text-gray-600(?! dark:text-gray-\d+)/g, 'text-gray-600 dark:text-gray-300');
    eventsContent = eventsContent.replace(/bg-white(?! dark:bg-slate-900| dark:bg-slate-950)/g, 'bg-white dark:bg-slate-900');
    fs.writeFileSync('src/pages/public/Events.tsx', eventsContent);
}

// And Ministries.tsx
if (fs.existsSync('src/pages/public/Ministries.tsx')) {
    let ministriesContent = fs.readFileSync('src/pages/public/Ministries.tsx', 'utf8');
    ministriesContent = ministriesContent.replace(/text-primary(?! dark:text-white| dark:text-\w+)/g, 'text-primary dark:text-white');
    ministriesContent = ministriesContent.replace(/text-gray-655(?! dark:text-gray-\d+)/g, 'text-gray-655 dark:text-gray-300');
    ministriesContent = ministriesContent.replace(/text-gray-500(?! dark:text-gray-\d+)/g, 'text-gray-500 dark:text-gray-400');
    ministriesContent = ministriesContent.replace(/text-gray-600(?! dark:text-gray-\d+)/g, 'text-gray-600 dark:text-gray-300');
    ministriesContent = ministriesContent.replace(/bg-white(?! dark:bg-slate-900| dark:bg-slate-950)/g, 'bg-white dark:bg-slate-900');
    fs.writeFileSync('src/pages/public/Ministries.tsx', ministriesContent);
}
console.log("Done fixing texts");
