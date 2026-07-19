const fs = require('fs');
let code = fs.readFileSync('api/render-index.js', 'utf8');

const oldImageLogic =         // Try to filter out generic branding logos and replace with google proxy if valid
        try {
            if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
            let u;
            if (imageUrl.startsWith('/')) {
                u = new URL(imageUrl, 'https://www.panathinaikosnews.gr');
            } else {
                u = new URL(imageUrl);
            }
            const pathLower = u.pathname.toLowerCase();
            const filenameBrandingIndicators = ['logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark'];
            const isBranding = filenameBrandingIndicators.some(ind => pathLower.includes(ind));
            if (isBranding) {
                imageUrl = DEFAULT_IMG;
            } else if (!u.hostname.includes('localhost') && !u.hostname.includes('panathinaikosnews.gr') && !u.hostname.includes('wsrv.nl')) {
                // Compress external image on-the-fly to tiny WebP/AVIF format
                imageUrl = \\\https://wsrv.nl/?url=\\\&w=800&output=webp&q=82\\\;
            }
        } catch (e) {};

const newImageLogic =         // Try to filter out generic branding logos and replace with google proxy if valid
        try {
            if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
            let u;
            if (imageUrl.startsWith('/')) {
                u = new URL(imageUrl, 'https://www.panathinaikosnews.gr');
            } else {
                u = new URL(imageUrl);
            }
            const filename = u.pathname.substring(u.pathname.lastIndexOf('/') + 1).toLowerCase();
            const pathLower = u.pathname.toLowerCase();
            const filenameBrandingIndicators = [
                'logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark',
                'og-image', 'og_image', 'site-logo', 'site_logo', 'default-image', 'default_image',
                'noimage', 'no-image', 'blank', 'generic', 'share-image', 'share_image'
            ];
            const pathBrandingPaths = ['/logos/', '/logo/', '/brand/', '/branding/', '/default_images/', '/default-images/', '/assets/images/', '/site-assets/'];
            let isBranding = filenameBrandingIndicators.some(ind => filename.includes(ind));
            if (!isBranding) isBranding = pathBrandingPaths.some(p => ('/' + pathLower + '/').includes(p));
            
            if (isBranding) {
                imageUrl = DEFAULT_IMG;
            } else if (!u.hostname.includes('localhost') && !u.hostname.includes('panathinaikosnews.gr') && !u.hostname.includes('wsrv.nl')) {
                // Compress external image on-the-fly to tiny WebP/AVIF format
                imageUrl = \\\https://wsrv.nl/?url=\\\&w=800&output=webp&q=82\\\;
            }
        } catch (e) {};

if(code.includes('const filenameBrandingIndicators = [' + "'logo', 'icon', 'avatar', 'branding', 'placeholder', 'fallback', 'watermark'" + '];')) {
    code = code.replace(oldImageLogic, newImageLogic);
    fs.writeFileSync('api/render-index.js', code, 'utf8');
    console.log('Fixed render-index.js image logic');
} else {
    console.log('Could not find exact block. Check file manually.');
}
