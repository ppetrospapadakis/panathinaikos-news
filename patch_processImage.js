const fs = require('fs');

function patchProcessImage(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    const regex = /const isBranding = BRANDING_FN\.some\([^;]+;[\s\n]*if \(isBranding\) \{[\s\n]*a\.image_url = DEFAULT_IMG;[\s\n]*\} else if \(!u\.hostname\.includes\('localhost'\) && !u\.hostname\.includes\('panathinaikosnews\.gr'\) && !u\.hostname\.includes\('wsrv\.nl'\)\) \{/g;

    const replacement = `const isInternal = u.hostname.includes('localhost') || u.hostname.includes('panathinaikosnews.gr') || imageUrl.startsWith('/');
                const isBranding = !isInternal && (BRANDING_FN.some(x => filename.includes(x)) || BRANDING_PATH.some(p => ('/'+u.pathname.toLowerCase()+'/').includes(p)));
                if (isBranding) {
                    a.image_url = DEFAULT_IMG;
                } else if (!isInternal && !u.hostname.includes('wsrv.nl')) {`;

    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
}

patchProcessImage('index.html');
patchProcessImage('api/render-index.js');
console.log('processImage patched');
