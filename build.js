const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Copy all .html files (except login.html which is served via api/render-admin), opinion_admin.js, and static assets
const files = fs.readdirSync(__dirname);
const buildTime = Date.now();
for (const file of files) {
    if (file.endsWith('.html') && file !== 'login.html') {
        let content = fs.readFileSync(path.join(__dirname, file), 'utf8');
        content = `<!-- VercelBuild: ${buildTime} -->\n` + content;
        fs.writeFileSync(path.join(publicDir, file), content, 'utf8');
        console.log(`Processed & copied ${file} to public/`);
    } else if (file === 'opinion_admin.js' || file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.ico') || file.endsWith('.svg') || file.endsWith('.txt')) {
        fs.copyFileSync(path.join(__dirname, file), path.join(publicDir, file));
        console.log(`Copied ${file} to public/`);
    }
}

// Ensure login.html is NOT present in public/ so Vercel rewrites /admin to /api/render-admin dynamically
const publicLoginPath = path.join(publicDir, 'login.html');
if (fs.existsSync(publicLoginPath)) {
    fs.unlinkSync(publicLoginPath);
    console.log("Removed public/login.html to force dynamic API rendering for admin panel.");
}

// Copy images/ folder to public/images/
const imagesDir = path.join(__dirname, 'images');
const publicImagesDir = path.join(publicDir, 'images');
if (fs.existsSync(imagesDir)) {
    if (!fs.existsSync(publicImagesDir)) {
        fs.mkdirSync(publicImagesDir, { recursive: true });
    }
    const imgFiles = fs.readdirSync(imagesDir);
    for (const file of imgFiles) {
        fs.copyFileSync(path.join(imagesDir, file), path.join(publicImagesDir, file));
        console.log(`Copied images/${file} to public/images/`);
    }
}

console.log("Build completed successfully!");
// Redeploy trigger to inject Vercel environment variables - July 8, 2026
