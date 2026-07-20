const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Copy all .html files, opinion_admin.js, and static assets
const files = fs.readdirSync(__dirname);
for (const file of files) {
    if (file.endsWith('.html') || file === 'opinion_admin.js' || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico') || file.endsWith('.svg') || file === 'ads.txt' || file === 'robots.txt') {
        fs.copyFileSync(path.join(__dirname, file), path.join(publicDir, file));
        console.log(`Copied ${file} to public/`);
    }
}
console.log("Build completed successfully!");
// Redeploy trigger to inject Vercel environment variables - July 8, 2026
