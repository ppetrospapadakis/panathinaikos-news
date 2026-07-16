const fs = require('fs');

const files = ['article.html', 'login.html', 'roster.html', 'matches.html', 'test.html'];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let initial = content;

        // Remove drawer links
        content = content.replace(/<a[^>]*href="\/metagrafes"[\s\S]*?<\/a>\s*/g, '');
        content = content.replace(/<a[^>]*href="\/agones"[\s\S]*?<\/a>\s*/g, '');

        if (content !== initial) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Cleaned up ${file}`);
        }
    }
}
