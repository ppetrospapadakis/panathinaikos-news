const fs = require('fs');

const files = [
    'index.html',
    'article.html',
    'roster.html',
    'contact.html',
    'privacy-policy.html',
    'terms-of-service.html',
    'login.html'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Header logo
    // Some files might have width="200" height="74" style="aspect-ratio: 200 / 74;"
    // Some might just have width="200" height="74"
    // Some might just have class="..." without width/height
    
    // Use regex to replace the header logo image tag completely
    // Look for <img src="/logo.png" alt="PanathinaikosNews" class="h-[68px] md:h-[74px] ... />
    const headerLogoRegex = /<img src="\/logo\.png" alt="PanathinaikosNews" class="h-\[68px\] md:h-\[74px\][^>]+>/g;
    content = content.replace(headerLogoRegex, '<img src="/logo.png" alt="PanathinaikosNews" class="h-[68px] md:h-[74px] w-auto object-contain" width="261" height="74"/>');

    // 2. Drawer logo
    const drawerLogoRegex = /<img src="\/logo\.png" alt="PanathinaikosNews" class="h-20 md:h-24[^>]+>/g;
    content = content.replace(drawerLogoRegex, '<img src="/logo.png" alt="PanathinaikosNews" class="h-20 md:h-24 w-auto object-contain" width="338" height="96"/>');

    // 3. Section logo (index.html only)
    const sectionLogoRegex = /<img src="\/logo\.png" alt="PanathinaikosNews" class="h-10 md:h-12[^>]+>/g;
    content = content.replace(sectionLogoRegex, '<img src="/logo.png" alt="PanathinaikosNews" class="h-10 md:h-12 w-auto object-contain" width="169" height="48"/>');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated logos in ${file}`);
}
